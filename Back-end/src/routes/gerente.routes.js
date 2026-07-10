const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/baseDados");
const { verificarToken, verificarPapel } = require("../middlewares/auth.middleware");

const router = express.Router();

// todas as rotas abaixo exigem estar logado como gerente
// gerente E admin têm acesso a estas rotas (admin fica "acima" do gerente)
router.use(verificarToken, verificarPapel("gerente", "admin"));

// DASHBOARD - contagens gerais
router.get("/dashboard", async (req, res) => {
  try {
    const [[pendentes]] = await pool.query(
      "SELECT COUNT(*) AS total FROM agendamentos WHERE status = 'pendente'"
    );
    const [[emExecucao]] = await pool.query(
      "SELECT COUNT(*) AS total FROM agendamentos WHERE status IN ('aceite','a_caminho','em_execucao')"
    );
    const [[concluidos]] = await pool.query(
      "SELECT COUNT(*) AS total FROM agendamentos WHERE status = 'concluido'"
    );
    const [[totalProfissionais]] = await pool.query(
      "SELECT COUNT(*) AS total FROM profissionais"
    );
    const [porStatus] = await pool.query(
      "SELECT status, COUNT(*) AS total FROM agendamentos GROUP BY status"
    );
    const [porDia] = await pool.query(
      `SELECT DATE(criado_em) AS dia, COUNT(*) AS total
       FROM agendamentos
       WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(criado_em)
       ORDER BY dia ASC`
    );

    res.json({
      pendentes: pendentes.total,
      emExecucao: emExecucao.total,
      concluidos: concluidos.total,
      totalProfissionais: totalProfissionais.total,
      porStatus,
      porDia,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter dashboard" });
  }
});

// LISTAR TODOS OS AGENDAMENTOS (com filtro opcional por status)
router.get("/agendamentos", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT a.*, p.nome AS nome_profissional, c.nome AS nome_categoria
      FROM agendamentos a
      LEFT JOIN profissionais p ON p.id = a.profissional_id
      LEFT JOIN categorias c ON c.id = a.categoria_id
    `;
    const valores = [];

    if (status) {
      query += " WHERE a.status = ?";
      valores.push(status);
    }

    query += " ORDER BY a.criado_em DESC";

    const [linhas] = await pool.query(query, valores);
    res.json({ total: linhas.length, agendamentos: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter agendamentos" });
  }
});

// CRIAR AGENDAMENTO DIRETO PELO BACKOFFICE ("Nova Visita")
router.post("/agendamentos", async (req, res) => {
  try {
    const {
      nome_cliente,
      telefone,
      endereco,
      categoria_id,
      data,
      hora,
      latitude,
      longitude,
      profissional_id,
    } = req.body;

    if (!nome_cliente || !telefone || !endereco || !categoria_id || !data || !hora) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos obrigatórios",
      });
    }

    const status = profissional_id ? "aceite" : "pendente";

    const [resultado] = await pool.query(
      `INSERT INTO agendamentos
        (nome_cliente, telefone, endereco, categoria_id, data, hora, latitude, longitude, profissional_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome_cliente,
        telefone,
        endereco,
        categoria_id,
        data,
        hora,
        latitude || null,
        longitude || null,
        profissional_id || null,
        status,
      ]
    );

    res.status(201).json({
      mensagem: "Agendamento criado com sucesso",
      id: resultado.insertId,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao criar agendamento" });
  }
});

// ATRIBUIR MANUALMENTE UM AGENDAMENTO A UM PROFISSIONAL
router.put("/agendamentos/:id/atribuir", async (req, res) => {
  try {
    const { id } = req.params;
    const { profissional_id } = req.body;

    if (!profissional_id) {
      return res.status(400).json({ mensagem: "Selecione um profissional" });
    }

    // se o pedido ainda não tinha categoria definida, preenche a partir
    // da categoria do profissional que está a ser atribuído agora
    await pool.query(
      `UPDATE agendamentos a
       JOIN profissionais p ON p.id = ?
       SET a.profissional_id = ?,
           a.status = 'aceite',
           a.categoria_id = COALESCE(a.categoria_id, p.categoria_id)
       WHERE a.id = ?`,
      [profissional_id, profissional_id, id]
    );

    res.json({ mensagem: "Agendamento atribuído com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atribuir agendamento" });
  }
});

// CANCELAR AGENDAMENTO
router.put("/agendamentos/:id/cancelar", async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    await pool.query(
      "UPDATE agendamentos SET status = 'cancelado', motivo_cancelamento = ? WHERE id = ?",
      [motivo || "Cancelado pelo gestor", id]
    );

    res.json({ mensagem: "Agendamento cancelado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao cancelar agendamento" });
  }
});

// MARCAR PAGAMENTO DE UM TRABALHO CONCLUÍDO COMO PAGO
router.put("/agendamentos/:id/marcar-pago", async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await pool.query(
      "UPDATE agendamentos SET status_pagamento = 'pago' WHERE id = ? AND status = 'concluido'",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Agendamento concluído não encontrado" });
    }

    res.json({ mensagem: "Pagamento marcado como pago" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao marcar pagamento" });
  }
});

// LISTAR TRABALHADORES
router.get("/profissionais", async (req, res) => {
  try {
    const [linhas] = await pool.query(`
      SELECT p.*, c.nome AS nome_categoria, u.email
      FROM profissionais p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      ORDER BY p.nome ASC
    `);

    const ids = linhas.map((l) => l.id);
    let competenciasPorId = {};
    let disponibilidadePorId = {};

    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const [linhasCompetencias] = await pool.query(
        `SELECT profissional_id, nome FROM competencias WHERE profissional_id IN (${placeholders})`,
        ids
      );
      const [linhasDisponibilidade] = await pool.query(
        `SELECT profissional_id, dia_semana FROM disponibilidade WHERE profissional_id IN (${placeholders})`,
        ids
      );
      for (const linha of linhasCompetencias) {
        (competenciasPorId[linha.profissional_id] ||= []).push(linha.nome);
      }
      for (const linha of linhasDisponibilidade) {
        (disponibilidadePorId[linha.profissional_id] ||= []).push(linha.dia_semana);
      }
    }

    const profissionais = linhas.map((l) => ({
      ...l,
      competencias: competenciasPorId[l.id] || [],
      disponibilidade: disponibilidadePorId[l.id] || [],
    }));

    res.json({ total: profissionais.length, profissionais });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter profissionais" });
  }
});

// CADASTRAR NOVO TRABALHADOR (cria usuário de login + linha em profissionais)
router.post("/profissionais", async (req, res) => {
  const conexao = await pool.getConnection();
  try {
    const {
      nome,
      email,
      senha,
      telefone,
      categoria_id,
      preco_por_hora,
      experiencia,
      descricao,
      foto,
      competencias,
      disponibilidade,
    } = req.body;

    if (!nome || !email || !senha || !categoria_id) {
      conexao.release();
      return res.status(400).json({
        mensagem: "Nome, email, senha e categoria são obrigatórios",
      });
    }

    await conexao.beginTransaction();

    const senhaHash = await bcrypt.hash(senha, 10);

    const [resultadoUsuario] = await conexao.query(
      "INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, 'trabalhador')",
      [nome, email, senhaHash]
    );

    const [resultadoProfissional] = await conexao.query(
      `INSERT INTO profissionais
        (usuario_id, nome, telefone, categoria_id, preco_por_hora, experiencia, descricao, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultadoUsuario.insertId,
        nome,
        telefone || null,
        categoria_id,
        preco_por_hora || null,
        experiencia || null,
        descricao || null,
        foto || null,
      ]
    );

    const profissionalId = resultadoProfissional.insertId;

    // competencias e disponibilidade vêm como arrays de texto (ex: ["Limpeza", "Organização"])
    const listaCompetencias = (competencias || []).filter((c) => c && c.trim());
    if (listaCompetencias.length > 0) {
      await conexao.query(
        `INSERT INTO competencias (profissional_id, nome) VALUES ${listaCompetencias.map(() => "(?, ?)").join(", ")}`,
        listaCompetencias.flatMap((nome) => [profissionalId, nome])
      );
    }

    const listaDisponibilidade = (disponibilidade || []).filter((d) => d && d.trim());
    if (listaDisponibilidade.length > 0) {
      await conexao.query(
        `INSERT INTO disponibilidade (profissional_id, dia_semana) VALUES ${listaDisponibilidade.map(() => "(?, ?)").join(", ")}`,
        listaDisponibilidade.flatMap((dia) => [profissionalId, dia])
      );
    }

    await conexao.commit();

    res.status(201).json({ mensagem: "Trabalhador cadastrado com sucesso" });
  } catch (erro) {
    await conexao.rollback();
    console.error(erro);

    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Este email já está em uso" });
    }

    res.status(500).json({ mensagem: "Erro ao cadastrar trabalhador" });
  } finally {
    conexao.release();
  }
});

// ATIVAR / DESATIVAR TRABALHADOR
router.put("/profissionais/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    // fonte da verdade é profissionais.ativo — funciona mesmo sem conta de login
    const [resultado] = await pool.query(
      "UPDATE profissionais SET ativo = ? WHERE id = ?",
      [ativo, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Profissional não encontrado" });
    }

    // se o profissional tiver conta de login, sincroniza também
    // (assim ele fica impedido de entrar na app quando desativado)
    await pool.query(
      `UPDATE usuarios u
       JOIN profissionais p ON p.usuario_id = u.id
       SET u.ativo = ?
       WHERE p.id = ?`,
      [ativo, id]
    );

    res.json({ mensagem: "Estado do trabalhador atualizado" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar estado" });
  }
});

// EDITAR DADOS DE UM PROFISSIONAL
router.put("/profissionais/:id", async (req, res) => {
  const conexao = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      nome, telefone, categoria_id, preco_por_hora,
      experiencia, descricao, foto, competencias, disponibilidade,
    } = req.body;

    await conexao.beginTransaction();

    await conexao.query(
      `UPDATE profissionais
       SET nome = ?, telefone = ?, categoria_id = ?, preco_por_hora = ?,
           experiencia = ?, descricao = ?, foto = ?
       WHERE id = ?`,
      [nome, telefone || null, categoria_id, preco_por_hora || null, experiencia || null, descricao || null, foto || null, id]
    );

    // substitui a lista de competências/disponibilidade pela nova, se enviada
    if (Array.isArray(competencias)) {
      await conexao.query("DELETE FROM competencias WHERE profissional_id = ?", [id]);
      const lista = competencias.filter((c) => c && c.trim());
      if (lista.length > 0) {
        await conexao.query(
          `INSERT INTO competencias (profissional_id, nome) VALUES ${lista.map(() => "(?, ?)").join(", ")}`,
          lista.flatMap((nome) => [id, nome])
        );
      }
    }

    if (Array.isArray(disponibilidade)) {
      await conexao.query("DELETE FROM disponibilidade WHERE profissional_id = ?", [id]);
      const lista = disponibilidade.filter((d) => d && d.trim());
      if (lista.length > 0) {
        await conexao.query(
          `INSERT INTO disponibilidade (profissional_id, dia_semana) VALUES ${lista.map(() => "(?, ?)").join(", ")}`,
          lista.flatMap((dia) => [id, dia])
        );
      }
    }

    await conexao.commit();
    res.json({ mensagem: "Profissional atualizado com sucesso" });
  } catch (erro) {
    await conexao.rollback();
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar profissional" });
  } finally {
    conexao.release();
  }
});

// EXCLUIR PROFISSIONAL PERMANENTEMENTE (gestor e admin podem)
router.delete("/profissionais/:id", async (req, res) => {
  const conexao = await pool.getConnection();
  try {
    const { id } = req.params;

    const [[profissional]] = await conexao.query(
      "SELECT usuario_id FROM profissionais WHERE id = ?",
      [id]
    );

    if (!profissional) {
      conexao.release();
      return res.status(404).json({ mensagem: "Profissional não encontrado" });
    }

    await conexao.beginTransaction();

    // agendamentos antigos ficam sem profissional em vez de serem apagados
    await conexao.query(
      "UPDATE agendamentos SET profissional_id = NULL WHERE profissional_id = ?",
      [id]
    );
    await conexao.query("DELETE FROM competencias WHERE profissional_id = ?", [id]);
    await conexao.query("DELETE FROM disponibilidade WHERE profissional_id = ?", [id]);
    await conexao.query("DELETE FROM profissionais WHERE id = ?", [id]);
    if (profissional.usuario_id) {
      await conexao.query("DELETE FROM usuarios WHERE id = ?", [profissional.usuario_id]);
    }

    await conexao.commit();
    res.json({ mensagem: "Profissional excluído com sucesso" });
  } catch (erro) {
    await conexao.rollback();
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao excluir profissional" });
  } finally {
    conexao.release();
  }
});

module.exports = router;
