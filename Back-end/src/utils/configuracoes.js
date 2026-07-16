const pool = require("../config/baseDados");

// Lê uma configuração da tabela "configuracoes"; se a tabela ainda não
// existir (migração 009 não aplicada) ou a chave não existir, devolve o
// valor padrão — assim o sistema continua a funcionar sem a migração.
async function obterConfiguracao(chave, valorPadrao) {
  try {
    const [[linha]] = await pool.query(
      "SELECT valor FROM configuracoes WHERE chave = ?",
      [chave]
    );
    return linha ? linha.valor : valorPadrao;
  } catch {
    return valorPadrao;
  }
}

async function obterTaxaAppPercentual() {
  const valor = await obterConfiguracao("taxa_app_percentual", "20");
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 && numero <= 100 ? numero : 20;
}

module.exports = { obterConfiguracao, obterTaxaAppPercentual };
