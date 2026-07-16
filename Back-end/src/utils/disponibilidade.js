const pool = require("../config/baseDados");

// Dias guardados SEM acento no banco (ver migração 010) — imune a problemas
// de codificação na importação de SQLs pelo phpMyAdmin.
const DIAS_SEMANA = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

// Remove acentos de um dia ("Terça" -> "Terca", "Sábado" -> "Sabado"),
// para aceitar entradas antigas/da interface com acento.
function normalizarDia(dia) {
  return String(dia || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Devolve o nome do dia da semana (sem acento, mesmo formato usado na
// tabela "disponibilidade") a partir de uma data "YYYY-MM-DD".
function diaDaSemana(dataStr) {
  const data = new Date(`${String(dataStr).slice(0, 10)}T00:00:00`);
  return DIAS_SEMANA[data.getDay()];
}

// duração assumida para um agendamento que ainda não tem duração estimada
// definida pelo profissional (ele só define isso depois de aceitar o
// pedido, no app) — usada só para efeitos de cálculo de conflito
const DURACAO_PADRAO_MINUTOS = 120;

// tempo de folga entre um serviço e o próximo, para o profissional se
// deslocar/descansar — ele só volta a ficar "livre" no sistema depois do
// fim estimado do serviço + esta margem
const MARGEM_BUFFER_MINUTOS = 30;

// Duração "ocupada" (em minutos) que um agendamento reserva na agenda do
// profissional: usa a duração estimada por ele (editável a qualquer altura
// em caso de imprevisto); se ainda não foi definida, usa a duração real já
// registada (caso já tenha sido concluído); por fim cai no padrão.
function duracaoOcupadaMinutos(agendamento) {
  const duracao = agendamento.duracao_estimada_minutos ?? agendamento.duracao_minutos ?? DURACAO_PADRAO_MINUTOS;
  return duracao + MARGEM_BUFFER_MINUTOS;
}

// Dado um conjunto de ids de profissionais e uma data/hora pretendidas,
// devolve o subconjunto de ids que:
//  - têm esse dia da semana marcado como disponível (ou não têm nenhuma
//    disponibilidade configurada ainda — nesse caso assume-se disponível
//    todos os dias, para não esconder profissionais que ainda não
//    preencheram essa informação)
//  - não têm nenhum agendamento cujo período ocupado (início até fim
//    estimado + margem) englobe o horário pretendido
async function filtrarDisponiveis(idsProfissionais, data, hora) {
  if (idsProfissionais.length === 0) return new Set();

  const placeholders = idsProfissionais.map(() => "?").join(",");

  // profissionais que se marcaram manualmente como indisponíveis agora
  // (like "ficar offline") ficam de fora de qualquer busca, mesmo que a
  // agenda semanal deles esteja livre
  const [linhasIndisponiveis] = await pool.query(
    `SELECT id FROM profissionais WHERE id IN (${placeholders}) AND disponivel_agora = FALSE`,
    idsProfissionais
  );
  const indisponiveisAgora = new Set(linhasIndisponiveis.map((l) => l.id));
  const idsCandidatos = idsProfissionais.filter((id) => !indisponiveisAgora.has(id));

  if (!data) return new Set(idsCandidatos); // sem data escolhida ainda, só filtra pela pausa manual
  if (idsCandidatos.length === 0) return new Set();

  const placeholdersCandidatos = idsCandidatos.map(() => "?").join(",");
  const diaSemana = diaDaSemana(data);

  // profissionais que marcaram pelo menos um dia de disponibilidade
  const [linhasDisponibilidade] = await pool.query(
    `SELECT DISTINCT profissional_id FROM disponibilidade WHERE profissional_id IN (${placeholdersCandidatos})`,
    idsCandidatos
  );
  const comDisponibilidadeConfigurada = new Set(linhasDisponibilidade.map((l) => l.profissional_id));

  // profissionais disponíveis nesse dia da semana específico
  const [linhasDoDia] = await pool.query(
    `SELECT DISTINCT profissional_id FROM disponibilidade WHERE profissional_id IN (${placeholdersCandidatos}) AND dia_semana = ?`,
    [...idsCandidatos, diaSemana]
  );
  const disponiveisNoDia = new Set(linhasDoDia.map((l) => l.profissional_id));

  // profissionais com o horário pretendido dentro do período ocupado de
  // outro agendamento (mesmo dia — serviços não atravessam a meia-noite)
  let comConflito = new Set();
  if (hora) {
    const [agendamentosDoDia] = await pool.query(
      `SELECT profissional_id, hora, duracao_estimada_minutos, duracao_minutos, status, checkout_hora
       FROM agendamentos
       WHERE profissional_id IN (${placeholdersCandidatos}) AND data = ?
         AND status NOT IN ('cancelado')`,
      [...idsCandidatos, data]
    );

    const alvoMinutos = horaParaMinutos(hora);
    for (const ag of agendamentosDoDia) {
      const inicio = horaParaMinutos(ag.hora);
      let fim;

      if (ag.status === "concluido" && ag.checkout_hora) {
        // já sabemos a hora real em que terminou — usa isso em vez da
        // duração estimada (que pode ter sido pessimista, ou o trabalho
        // pode ter terminado mais cedo do que o previsto)
        const checkout = new Date(ag.checkout_hora);
        const fimReal = checkout.getHours() * 60 + checkout.getMinutes();
        fim = fimReal + MARGEM_BUFFER_MINUTOS;
      } else {
        fim = inicio + duracaoOcupadaMinutos(ag);
      }

      if (alvoMinutos >= inicio && alvoMinutos < fim) {
        comConflito.add(ag.profissional_id);
      }
    }
  }

  return new Set(
    idsCandidatos.filter((id) => {
      const respeitaDisponibilidade = !comDisponibilidadeConfigurada.has(id) || disponiveisNoDia.has(id);
      const semConflito = !comConflito.has(id);
      return respeitaDisponibilidade && semConflito;
    })
  );
}

// Converte "HH:MM:SS" ou "HH:MM" em minutos desde a meia-noite
function horaParaMinutos(horaStr) {
  const [h, m] = String(horaStr).split(":").map(Number);
  return h * 60 + m;
}

module.exports = {
  diaDaSemana, filtrarDisponiveis, normalizarDia, DIAS_SEMANA,
  horaParaMinutos, duracaoOcupadaMinutos, DURACAO_PADRAO_MINUTOS, MARGEM_BUFFER_MINUTOS,
};
