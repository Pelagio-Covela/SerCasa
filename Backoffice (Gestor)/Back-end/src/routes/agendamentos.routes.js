const express = require("express");
const pool = require("../config/baseDados");

const router = express.Router();

// CRIAR AGENDAMENTO
router.post("/", async (req, res) => {
  try {
    const {
      profissional_id,
      nome_cliente,
      telefone,
      email_cliente,
      data,
      hora,
      endereco,
      latitude,
      longitude,
      descricao,
    } = req.body;
    let { categoria_id } = req.body;

    if (!nome_cliente || !telefone || !email_cliente || !data || !hora || !endereco) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos obrigatórios (nome, telefone, e-mail, data, hora e endereço)",
      });
    }

    // Se o cliente escolheu um profissional mas não mandou a categoria,
    // preenchemos automaticamente a partir da categoria do profissional —
    // assim o gestor sempre vê a categoria certa no backoffice.
    if (!categoria_id && profissional_id) {
      const [[profissional]] = await pool.query(
        "SELECT categoria_id FROM profissionais WHERE id = ?",
        [profissional_id]
      );
      categoria_id = profissional?.categoria_id || null;
    }

    const query = `
      INSERT INTO agendamentos 
      (profissional_id, categoria_id, nome_cliente, telefone, email_cliente, data, hora, endereco, latitude, longitude, descricao, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const status = profissional_id ? "aceite" : "pendente";

    const [resultado] = await pool.query(query, [
      profissional_id || null,
      categoria_id || null,
      nome_cliente,
      telefone,
      email_cliente,
      data,
      hora,
      endereco,
      latitude || null,
      longitude || null,
      descricao || null,
      status,
    ]);

    res.status(201).json({
      mensagem: "Agendamento criado com sucesso",
      id: resultado.insertId,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      mensagem: "Erro ao criar agendamento",
    });
  }
});

// CONSULTAR OS MEUS AGENDAMENTOS (cliente, pelo número de telefone).
// Inclui as "contas a pagar": serviços concluídos com pagamento pendente.
// O valor mostrado ao cliente é o valor TOTAL do serviço (a divisão entre
// profissional e taxa da app é interna, só visível no backoffice).
router.get("/meus", async (req, res) => {
  try {
    const { telefone } = req.query;

    if (!telefone || telefone.trim().length < 6) {
      return res.status(400).json({ mensagem: "Informe o número de telefone usado no agendamento" });
    }

    // compara ignorando espaços, para "84 111 2222" e "841112222" baterem
    const telefoneLimpo = telefone.replace(/\s+/g, "");

    const [linhas] = await pool.query(
      `SELECT a.id, a.nome_cliente, a.data, a.hora, a.endereco, a.descricao,
              a.status, a.criado_em, a.duracao_minutos, a.valor_total,
              a.status_pagamento, a.checkin_hora, a.checkout_hora,
              c.nome AS nome_categoria, p.nome AS nome_profissional
       FROM agendamentos a
       LEFT JOIN categorias c ON c.id = a.categoria_id
       LEFT JOIN profissionais p ON p.id = a.profissional_id
       WHERE REPLACE(a.telefone, ' ', '') = ?
       ORDER BY a.data DESC, a.hora DESC`,
      [telefoneLimpo]
    );

    const contasAPagar = linhas.filter(
      (l) => l.status === "concluido" && l.status_pagamento === "pendente"
    );
    const totalAPagar = contasAPagar.reduce((soma, l) => soma + Number(l.valor_total || 0), 0);

    res.json({
      total: linhas.length,
      totalAPagar: Number(totalAPagar.toFixed(2)),
      contasAPagar: contasAPagar.length,
      agendamentos: linhas,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao consultar agendamentos" });
  }
});

// ─── Pagamento pós-serviço (público, acedido pelo link enviado por e-mail) ──

// OBTER A FATURA PELO TOKEN (link enviado por e-mail após o check-out)
router.get("/pagamento/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [[agendamento]] = await pool.query(
      `SELECT a.id, a.nome_cliente, a.data, a.hora, a.endereco, a.duracao_minutos,
              a.valor_total, a.status_pagamento, a.metodo_pagamento,
              c.nome AS nome_categoria, p.nome AS nome_profissional
       FROM agendamentos a
       LEFT JOIN categorias c ON c.id = a.categoria_id
       LEFT JOIN profissionais p ON p.id = a.profissional_id
       WHERE a.token_pagamento = ?`,
      [token]
    );

    if (!agendamento) {
      return res.status(404).json({ mensagem: "Fatura não encontrada. Verifique o link recebido por e-mail." });
    }

    res.json(agendamento);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter a fatura" });
  }
});

// SUBMETER OS DADOS DE PAGAMENTO (carteira móvel ou conta bancária)
router.post("/pagamento/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { metodo_pagamento, detalhes } = req.body;

    if (!["carteira_movel", "conta_bancaria"].includes(metodo_pagamento)) {
      return res.status(400).json({ mensagem: "Método de pagamento inválido" });
    }
    if (!detalhes || typeof detalhes !== "object") {
      return res.status(400).json({ mensagem: "Preencha os detalhes do pagamento" });
    }

    const [[agendamento]] = await pool.query(
      "SELECT id, status_pagamento FROM agendamentos WHERE token_pagamento = ?",
      [token]
    );

    if (!agendamento) {
      return res.status(404).json({ mensagem: "Fatura não encontrada" });
    }
    if (agendamento.status_pagamento === "pago") {
      return res.status(409).json({ mensagem: "Este serviço já está marcado como pago" });
    }

    await pool.query(
      `UPDATE agendamentos
       SET metodo_pagamento = ?, detalhes_pagamento = ?, pagamento_submetido_em = NOW(),
           status_pagamento = 'processando'
       WHERE token_pagamento = ?`,
      [metodo_pagamento, JSON.stringify(detalhes), token]
    );

    res.json({ mensagem: "Dados de pagamento recebidos. A nossa equipa vai confirmar em breve." });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao submeter o pagamento" });
  }
});

module.exports = router;