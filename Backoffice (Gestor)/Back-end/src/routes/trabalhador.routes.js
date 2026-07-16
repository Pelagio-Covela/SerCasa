const express = require("express");
const crypto = require("crypto");
const pool = require("../config/baseDados");
const { verificarToken, verificarPapel } = require("../middlewares/auth.middleware");

const router = express.Router();

const { obterTaxaAppPercentual } = require("../utils/configuracoes");
const { normalizarDia } = require("../utils/disponibilidade");
const { enviarEmail } = require("../utils/email");
const { montarEmailFatura } = require("../utils/emailTemplates");

// URL pública do site do cliente, usada para montar o link de pagamento
// enviado por e-mail. CLIENT_URL é a primeira origem de FRONTEND_URL
// (que já existe no .env para configurar o CORS).
function obterUrlCliente() {
  return process.env.CLIENT_URL || (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0];
}

// raio máximo (em metros) que o profissional pode estar do endereço do
// cliente para o check-in ser aceite
const RAIO_CHECKIN_METROS = 100;

// distância em metros entre duas coordenadas (fórmula de Haversine)
function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (v) => (v * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// todas as rotas abaixo exigem estar logado como trabalhador
router.use(verificarToken, verificarPapel("trabalhador"));

// ATUALIZAR LOCALIZAÇÃO ATUAL DO TRABALHADOR (enviado periodicamente pelo app)
router.put("/localizacao", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { profissionalId } = req.usuario;

    if (!latitude || !longitude) {
      return res.status(400).json({
        mensagem: "Latitude e longitude são obrigatórias",
      });
    }

    await pool.query(
      `UPDATE profissionais
       SET latitude = ?, longitude = ?, localizacao_atualizada_em = NOW()
       WHERE id = ?`,
      [latitude, longitude, profissionalId]
    );

    res.json({ mensagem: "Localização atualizada" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar localização" });
  }
});

// LISTAR PEDIDOS PENDENTES (sem profissional fixo), ORDENADOS PELA DISTÂNCIA
// ATÉ A POSIÇÃO ATUAL DO TRABALHADOR
router.get("/pedidos/proximos", async (req, res) => {
  try {
    const { profissionalId } = req.usuario;

    const [[profissional]] = await pool.query(
      "SELECT latitude, longitude FROM profissionais WHERE id = ?",
      [profissionalId]
    );

    if (!profissional?.latitude || !profissional?.longitude) {
      return res.status(400).json({
        mensagem: "Ative a localização no app antes de ver os pedidos próximos",
      });
    }

    const { latitude, longitude } = profissional;

    // fórmula de Haversine: calcula distância em km direto no SQL
    const [linhas] = await pool.query(
      `SELECT a.*, c.nome AS nome_categoria,
        (6371 * acos(
          cos(radians(?)) * cos(radians(a.latitude))
          * cos(radians(a.longitude) - radians(?))
          + sin(radians(?)) * sin(radians(a.latitude))
        )) AS distancia_km
       FROM agendamentos a
       LEFT JOIN categorias c ON c.id = a.categoria_id
       WHERE a.status = 'pendente'
         AND a.latitude IS NOT NULL
         AND a.longitude IS NOT NULL
       ORDER BY distancia_km ASC`,
      [latitude, longitude, latitude]
    );

    res.json({ total: linhas.length, pedidos: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter pedidos próximos" });
  }
});

// OBTER DETALHE DE UM PEDIDO (precisa pertencer a este profissional, OU
// estar pendente sem ninguém atribuído — para ver antes de aceitar)
router.get("/pedidos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { profissionalId } = req.usuario;

    const [[pedido]] = await pool.query(
      `SELECT a.*, c.nome AS nome_categoria
       FROM agendamentos a
       LEFT JOIN categorias c ON c.id = a.categoria_id
       WHERE a.id = ? AND (a.profissional_id = ? OR a.status = 'pendente')`,
      [id, profissionalId]
    );

    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado" });
    }

    res.json(pedido);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter pedido" });
  }
});

// FAZER CHECK-IN — só é aceite se o profissional estiver fisicamente
// próximo (dentro do raio) da localização exacta do pedido
// EDITAR A DURAÇÃO ESTIMADA (definida ao aceitar; pode ser ajustada a
// qualquer momento, ex: se surgir um imprevisto durante o serviço)
router.put("/pedidos/:id/duracao-estimada", async (req, res) => {
  try {
    const { id } = req.params;
    const { profissionalId } = req.usuario;
    const { duracao_estimada_minutos } = req.body;

    if (!duracao_estimada_minutos || duracao_estimada_minutos <= 0) {
      return res.status(400).json({ mensagem: "Duração estimada inválida" });
    }

    const [[pedido]] = await pool.query(
      "SELECT duracao_estimada_minutos FROM agendamentos WHERE id = ? AND profissional_id = ?",
      [id, profissionalId]
    );

    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado para este profissional" });
    }

    // um ajuste (ao contrário da definição inicial ao aceitar) só pode
    // AUMENTAR a duração estimada — nunca diminuir o que já foi combinado
    if (pedido.duracao_estimada_minutos && duracao_estimada_minutos <= pedido.duracao_estimada_minutos) {
      return res.status(400).json({
        mensagem: `A nova duração deve ser maior que a atual (${pedido.duracao_estimada_minutos} min).`,
      });
    }

    const [resultado] = await pool.query(
      `UPDATE agendamentos SET duracao_estimada_minutos = ?
       WHERE id = ? AND profissional_id = ?`,
      [duracao_estimada_minutos, id, profissionalId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Pedido não encontrado para este profissional" });
    }

    res.json({ mensagem: "Duração estimada atualizada" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar duração estimada" });
  }
});

router.put("/pedidos/:id/checkin", async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const { profissionalId } = req.usuario;

    if (!latitude || !longitude) {
      return res.status(400).json({ mensagem: "Localização atual é obrigatória para o check-in" });
    }

    const [[pedido]] = await pool.query(
      "SELECT latitude, longitude, status, duracao_estimada_minutos FROM agendamentos WHERE id = ? AND profissional_id = ?",
      [id, profissionalId]
    );

    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado para este profissional" });
    }

    if (!pedido.duracao_estimada_minutos) {
      return res.status(400).json({ mensagem: "Defina a duração estimada do serviço antes de fazer o check-in" });
    }

    if (!pedido.latitude || !pedido.longitude) {
      return res.status(400).json({ mensagem: "Este pedido não tem uma localização exacta definida" });
    }

    const distancia = distanciaMetros(latitude, longitude, pedido.latitude, pedido.longitude);

    if (distancia > RAIO_CHECKIN_METROS) {
      return res.status(409).json({
        mensagem: `Está a ${Math.round(distancia)}m do local. Aproxime-se até ${RAIO_CHECKIN_METROS}m para fazer check-in.`,
        distancia_metros: Math.round(distancia),
      });
    }

    await pool.query(
      `UPDATE agendamentos
       SET status = 'em_execucao', checkin_hora = NOW(), checkin_lat = ?, checkin_lng = ?
       WHERE id = ?`,
      [latitude, longitude, id]
    );

    res.json({ mensagem: "Check-in realizado com sucesso", distancia_metros: Math.round(distancia) });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao fazer check-in" });
  }
});

// FAZER CHECK-OUT — calcula duração trabalhada e o valor a receber
router.put("/pedidos/:id/checkout", async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const { profissionalId } = req.usuario;

    const [[pedido]] = await pool.query(
      `SELECT a.checkin_hora, a.nome_cliente, a.email_cliente, a.endereco, a.data,
              p.preco_por_hora, c.nome AS nome_categoria
       FROM agendamentos a
       JOIN profissionais p ON p.id = a.profissional_id
       LEFT JOIN categorias c ON c.id = a.categoria_id
       WHERE a.id = ? AND a.profissional_id = ?`,
      [id, profissionalId]
    );

    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado para este profissional" });
    }

    if (!pedido.checkin_hora) {
      return res.status(409).json({ mensagem: "É preciso fazer check-in antes do check-out" });
    }

    const duracaoMinutos = Math.max(1, Math.round((Date.now() - new Date(pedido.checkin_hora).getTime()) / 60000));
    const taxaPercentual = await obterTaxaAppPercentual();
    const valorTotal = Number(((pedido.preco_por_hora || 0) * (duracaoMinutos / 60)).toFixed(2));
    const taxaApp = Number((valorTotal * (taxaPercentual / 100)).toFixed(2));
    const valorProfissional = Number((valorTotal - taxaApp).toFixed(2));
    const tokenPagamento = crypto.randomBytes(24).toString("hex");

    await pool.query(
      `UPDATE agendamentos
       SET status = 'concluido', checkout_hora = NOW(), checkout_lat = ?, checkout_lng = ?,
           duracao_minutos = ?, valor_total = ?, valor_profissional = ?, taxa_app = ?,
           status_pagamento = 'pendente', token_pagamento = ?
       WHERE id = ?`,
      [latitude || null, longitude || null, duracaoMinutos, valorTotal, valorProfissional, taxaApp, tokenPagamento, id]
    );

    // envia a fatura por e-mail com o link de pagamento (não bloqueia a
    // resposta ao profissional caso o envio demore ou falhe)
    if (pedido.email_cliente) {
      const linkPagamento = `${obterUrlCliente()}/pagamento/${tokenPagamento}`;
      const html = montarEmailFatura({
        agendamento: { ...pedido, duracao_minutos: duracaoMinutos, valor_total: valorTotal, nome_categoria: pedido.nome_categoria },
        linkPagamento,
      });
      enviarEmail({ para: pedido.email_cliente, assunto: "A sua fatura ServCasa está pronta", html })
        .catch((erro) => console.error("[checkout] falha ao enviar fatura:", erro.message));
    }

    res.json({
      mensagem: "Check-out realizado com sucesso",
      duracao_minutos: duracaoMinutos,
      valor_profissional: valorProfissional,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao fazer check-out" });
  }
});

// HISTÓRICO DE TRABALHOS CONCLUÍDOS (com filtro opcional por período)
router.get("/historico", async (req, res) => {
  try {
    const { profissionalId } = req.usuario;
    const { periodo } = req.query; // "semana" | "mes" | undefined (tudo)

    let filtroData = "";
    if (periodo === "semana") filtroData = "AND checkout_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    if (periodo === "mes") filtroData = "AND checkout_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)";

    const [linhas] = await pool.query(
      `SELECT * FROM agendamentos
       WHERE profissional_id = ? AND status = 'concluido' ${filtroData}
       ORDER BY checkout_hora DESC`,
      [profissionalId]
    );

    const totalRecebido = linhas
      .filter((l) => l.status_pagamento === "pago")
      .reduce((soma, l) => soma + Number(l.valor_profissional || 0), 0);

    res.json({ total: linhas.length, totalRecebido, pedidos: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter histórico" });
  }
});

// OBTER O PRÓPRIO PERFIL (nome, categoria, avaliação, etc.)
router.get("/perfil", async (req, res) => {
  try {
    const { profissionalId } = req.usuario;

    const [[perfil]] = await pool.query(
      `SELECT p.*, c.nome AS nome_categoria
       FROM profissionais p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`,
      [profissionalId]
    );

    if (!perfil) {
      return res.status(404).json({ mensagem: "Perfil não encontrado" });
    }

    const [disponibilidade] = await pool.query(
      "SELECT dia_semana FROM disponibilidade WHERE profissional_id = ?",
      [profissionalId]
    );

    const [[{ totalServicos }]] = await pool.query(
      "SELECT COUNT(*) AS totalServicos FROM agendamentos WHERE profissional_id = ? AND status = 'concluido'",
      [profissionalId]
    );

    res.json({ ...perfil, disponibilidade: disponibilidade.map((d) => d.dia_semana), totalServicos });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter perfil" });
  }
});

// ATUALIZAR DISPONIBILIDADE (dias da semana) DO PRÓPRIO PERFIL
router.put("/perfil/disponibilidade", async (req, res) => {
  const conexao = await pool.getConnection();
  try {
    const { profissionalId } = req.usuario;
    const { disponibilidade } = req.body;

    await conexao.beginTransaction();
    await conexao.query("DELETE FROM disponibilidade WHERE profissional_id = ?", [profissionalId]);

    const lista = (disponibilidade || []).filter((d) => d && d.trim()).map(normalizarDia);
    if (lista.length > 0) {
      await conexao.query(
        `INSERT INTO disponibilidade (profissional_id, dia_semana) VALUES ${lista.map(() => "(?, ?)").join(", ")}`,
        lista.flatMap((dia) => [profissionalId, dia])
      );
    }

    await conexao.commit();
    res.json({ mensagem: "Disponibilidade atualizada" });
  } catch (erro) {
    await conexao.rollback();
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar disponibilidade" });
  } finally {
    conexao.release();
  }
});

// LISTAR OS PEDIDOS JÁ ATRIBUÍDOS A ESTE TRABALHADOR
router.get("/pedidos", async (req, res) => {
  try {
    const { profissionalId } = req.usuario;

    const [linhas] = await pool.query(
      `SELECT a.*, c.nome AS nome_categoria
       FROM agendamentos a
       LEFT JOIN categorias c ON c.id = a.categoria_id
       WHERE a.profissional_id = ? AND a.status NOT IN ('concluido', 'cancelado')
       ORDER BY a.data ASC, a.hora ASC`,
      [profissionalId]
    );

    res.json({ total: linhas.length, pedidos: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter pedidos" });
  }
});

// ACEITAR UM PEDIDO
router.put("/pedidos/:id/aceitar", async (req, res) => {
  try {
    const { id } = req.params;
    const { profissionalId } = req.usuario;
    const { duracao_estimada_minutos } = req.body || {};

    const [resultado] = await pool.query(
      `UPDATE agendamentos
       SET profissional_id = ?, status = 'aceite', duracao_estimada_minutos = ?
       WHERE id = ? AND status = 'pendente'`,
      [profissionalId, duracao_estimada_minutos || null, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        mensagem: "Este pedido já foi aceite por outro profissional",
      });
    }

    res.json({ mensagem: "Pedido aceite com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao aceitar pedido" });
  }
});

// ATUALIZAR STATUS DE UM PEDIDO (a_caminho, em_execucao, concluido)
router.put("/pedidos/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { profissionalId } = req.usuario;

    const estadosValidos = ["a_caminho", "em_execucao", "concluido", "cancelado"];
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({ mensagem: "Status inválido" });
    }

    const [resultado] = await pool.query(
      `UPDATE agendamentos
       SET status = ?
       WHERE id = ? AND profissional_id = ?`,
      [status, id, profissionalId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Pedido não encontrado para este profissional",
      });
    }

    res.json({ mensagem: "Status atualizado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar status" });
  }
});

module.exports = router;
