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
      data,
      hora,
      endereco,
      latitude,
      longitude,
      descricao,
    } = req.body;
    let { categoria_id } = req.body;

    if (!nome_cliente || !telefone || !data || !hora || !endereco) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos obrigatórios (nome, telefone, data, hora e endereço)",
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
      (profissional_id, categoria_id, nome_cliente, telefone, data, hora, endereco, latitude, longitude, descricao, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const status = profissional_id ? "aceite" : "pendente";

    const [resultado] = await pool.query(query, [
      profissional_id || null,
      categoria_id || null,
      nome_cliente,
      telefone,
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

module.exports = router;