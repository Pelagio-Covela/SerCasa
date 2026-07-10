const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/baseDados");

const router = express.Router();

// LOGIN (gerente ou trabalhador)
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        mensagem: "Email e senha são obrigatórios",
      });
    }

    const [linhas] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ? AND ativo = 1",
      [email]
    );

    if (linhas.length === 0) {
      return res.status(401).json({
        mensagem: "Credenciais inválidas",
      });
    }

    const usuario = linhas[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "Credenciais inválidas",
      });
    }

    // se o usuário for trabalhador, buscamos o id da linha profissionais ligada a ele
    let profissionalId = null;
    if (usuario.papel === "trabalhador") {
      const [profissional] = await pool.query(
        "SELECT id FROM profissionais WHERE usuario_id = ?",
        [usuario.id]
      );
      profissionalId = profissional[0]?.id || null;
    }

    const token = jwt.sign(
      { id: usuario.id, papel: usuario.papel, profissionalId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      mensagem: "Login efetuado com sucesso",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        profissionalId,
      },
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      mensagem: "Erro ao efetuar login",
    });
  }
});

module.exports = router;
