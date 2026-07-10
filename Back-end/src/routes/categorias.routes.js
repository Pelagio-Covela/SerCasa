const express = require("express");
const pool = require("../config/baseDados");

const router = express.Router();

// LISTAR CATEGORIAS
router.get("/", async (req, res) => {
  try {
    const [linhas] = await pool.query("SELECT * FROM categorias");
    res.json(linhas);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar categorias" });
  }
});

// OBTER CATEGORIA POR ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [linhas] = await pool.query(
      "SELECT * FROM categorias WHERE id = ?",
      [id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }

    res.json(linhas[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar categoria" });
  }
});

module.exports = router;