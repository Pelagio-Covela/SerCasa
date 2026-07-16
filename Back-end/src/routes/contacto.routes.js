const express = require("express");
const pool = require("../config/baseDados");
const { enviarEmail } = require("../utils/email");

const router = express.Router();

const EMAIL_DESTINO_CONTACTO = process.env.CONTACT_EMAIL_TO || "info@digilab.co.mz";

// ENVIAR CONTACTO — grava um registo e envia um e-mail para a equipa
router.post("/", async (req, res) => {
  try {
    const { nome, email, telefone, assunto, mensagem } = req.body;

    if (!nome || !email || !mensagem) {
      return res.status(400).json({ mensagem: "Preencha nome, e-mail e mensagem." });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #030213;">Nova mensagem de contacto — ServCasa</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #666;">Nome</td><td style="padding: 6px 0;"><strong>${nome}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">E-mail</td><td style="padding: 6px 0;">${email}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Telefone</td><td style="padding: 6px 0;">${telefone || "—"}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Assunto</td><td style="padding: 6px 0;">${assunto || "—"}</td></tr>
        </table>
        <p style="margin-top: 16px; color: #666;">Mensagem:</p>
        <p style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 8px;">${mensagem}</p>
      </div>`;

    const resultadoEnvio = await enviarEmail({
      para: EMAIL_DESTINO_CONTACTO,
      assunto: `[Contacto ServCasa] ${assunto || "Nova mensagem"} — ${nome}`,
      html,
    });

    // grava um registo mesmo que o e-mail falhe, para não perder a mensagem
    try {
      await pool.query(
        "INSERT INTO contactos (nome, email, telefone, assunto, mensagem, email_enviado) VALUES (?, ?, ?, ?, ?, ?)",
        [nome, email, telefone || null, assunto || null, mensagem, resultadoEnvio.enviado]
      );
    } catch (erroGravacao) {
      console.error("[contacto] falha ao gravar registo (mensagem já foi processada):", erroGravacao.message);
    }

    res.status(201).json({ mensagem: "Mensagem enviada com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao enviar mensagem" });
  }
});

module.exports = router;
