// Gera o HTML do e-mail de fatura + link de pagamento, enviado ao cliente
// assim que o profissional faz o check-out.
function montarEmailFatura({ agendamento, linkPagamento }) {
  const duracaoTexto = agendamento.duracao_minutos >= 60
    ? `${Math.floor(agendamento.duracao_minutos / 60)}h ${agendamento.duracao_minutos % 60}min`
    : `${agendamento.duracao_minutos}min`;

  const valorFormatado = `${Number(agendamento.valor_total || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })} MT`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #030213; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">ServCasa</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Fatura do serviço concluído</p>
    </div>
    <div style="background: #fff; padding: 28px; border: 1px solid #eee; border-top: none;">
      <p style="font-size: 15px;">Olá, <strong>${agendamento.nome_cliente}</strong>!</p>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        O seu serviço de <strong>${agendamento.nome_categoria || "serviço doméstico"}</strong> foi concluído.
        Confira os detalhes e finalize o pagamento através do link abaixo.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #666;">Serviço</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${agendamento.nome_categoria || "—"}</td></tr>
        <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Data</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${new Date(agendamento.data).toLocaleDateString("pt-PT", { timeZone: "UTC" })}</td></tr>
        <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Duração do serviço</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${duracaoTexto}</td></tr>
        <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Endereço</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${agendamento.endereco || "—"}</td></tr>
      </table>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #16a34a; text-transform: uppercase; font-weight: 600;">Valor a pagar</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #16a34a;">${valorFormatado}</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${linkPagamento}" style="background: #030213; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Pagar agora
        </a>
      </div>

      <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="${linkPagamento}" style="color: #2563eb;">${linkPagamento}</a>
      </p>
    </div>
    <div style="text-align: center; padding: 16px; font-size: 11px; color: #999;">
      ServCasa — Serviços domésticos em Moçambique
    </div>
  </div>`;

  return html;
}

module.exports = { montarEmailFatura };
