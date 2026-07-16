const express = require("express");
const pool = require("../config/baseDados");

const router = express.Router();

// ENVIAR CONTACTO
router.post("/", async (req, res) => {
  try {
    const { nome, email, mensagem } = req.body;

    const query = `
      INSERT INTO contactos (nome, email, mensagem)
      VALUES (?, ?, ?)
    `;

    await pool.query(query, [nome, email, mensagem]);

    res.status(201).json({
      mensagem: "Mensagem enviada com sucesso",
    });
  } catch (erro) {
    res.status(500).json({
      mensagem: "Erro ao enviar mensagem",
    });
  }
});

module.exports = router;