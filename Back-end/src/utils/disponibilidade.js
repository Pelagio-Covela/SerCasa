const pool = require("../config/baseDados");

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Devolve o nome do dia da semana (em português, mesmo formato usado na
// tabela "disponibilidade") a partir de uma data "YYYY-MM-DD".
function diaDaSemana(dataStr) {
  const data = new Date(`${dataStr}T00:00:00`);
  return DIAS_SEMANA[data.getDay()];
}

// Dado um conjunto de ids de profissionais e uma data/hora pretendidas,
// devolve o subconjunto de ids que:
//  - têm esse dia da semana marcado como disponível (ou não têm nenhuma
//    disponibilidade configurada ainda — nesse caso assume-se disponível
//    todos os dias, para não esconder profissionais que ainda não
//    preencheram essa informação)
//  - não têm já um agendamento marcado exatamente na mesma data e hora
async function filtrarDisponiveis(idsProfissionais, data, hora) {
  if (idsProfissionais.length === 0) return new Set();
  if (!data) return new Set(idsProfissionais); // sem data escolhida ainda, não filtra

  const placeholders = idsProfissionais.map(() => "?").join(",");
  const diaSemana = diaDaSemana(data);

  // profissionais que marcaram pelo menos um dia de disponibilidade
  const [linhasDisponibilidade] = await pool.query(
    `SELECT DISTINCT profissional_id FROM disponibilidade WHERE profissional_id IN (${placeholders})`,
    idsProfissionais
  );
  const comDisponibilidadeConfigurada = new Set(linhasDisponibilidade.map((l) => l.profissional_id));

  // profissionais disponíveis nesse dia da semana específico
  const [linhasDoDia] = await pool.query(
    `SELECT DISTINCT profissional_id FROM disponibilidade WHERE profissional_id IN (${placeholders}) AND dia_semana = ?`,
    [...idsProfissionais, diaSemana]
  );
  const disponiveisNoDia = new Set(linhasDoDia.map((l) => l.profissional_id));

  // profissionais com um agendamento já marcado na mesma data+hora (conflito)
  let comConflito = new Set();
  if (hora) {
    const [linhasConflito] = await pool.query(
      `SELECT DISTINCT profissional_id FROM agendamentos
       WHERE profissional_id IN (${placeholders}) AND data = ? AND hora = ?
         AND status NOT IN ('cancelado')`,
      [...idsProfissionais, data, hora]
    );
    comConflito = new Set(linhasConflito.map((l) => l.profissional_id));
  }

  return new Set(
    idsProfissionais.filter((id) => {
      const respeitaDisponibilidade = !comDisponibilidadeConfigurada.has(id) || disponiveisNoDia.has(id);
      const semConflito = !comConflito.has(id);
      return respeitaDisponibilidade && semConflito;
    })
  );
}

module.exports = { diaDaSemana, filtrarDisponiveis, DIAS_SEMANA };
