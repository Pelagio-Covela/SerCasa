const nodemailer = require("nodemailer");

let transportador = null;

// Só cria o transportador de verdade se houver configuração SMTP no .env.
// Sem isso, o sistema continua a funcionar normalmente (check-in/checkout,
// etc.) mas os e-mails ficam só registados no terminal em vez de enviados —
// assim nada quebra num ambiente que ainda não configurou um serviço de
// e-mail (ex: Gmail com senha de app, SendGrid, Mailgun, Brevo, etc).
function obterTransportador() {
  if (transportador) return transportador;
  if (!process.env.SMTP_HOST) return null;

  transportador = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transportador;
}

async function enviarEmail({ para, assunto, html }) {
  const t = obterTransportador();

  if (!t) {
    console.warn(
      `[email] SMTP não configurado — e-mail NÃO enviado de verdade.\n` +
      `  Para: ${para}\n  Assunto: ${assunto}\n` +
      `  (configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD no .env para enviar de verdade)`
    );
    return { enviado: false, motivo: "SMTP não configurado" };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `"ServCasa" <${process.env.SMTP_USER}>`,
      to: para,
      subject: assunto,
      html,
    });
    return { enviado: true };
  } catch (erro) {
    console.error("[email] Falha ao enviar:", erro.message);
    return { enviado: false, motivo: erro.message };
  }
}

module.exports = { enviarEmail };
