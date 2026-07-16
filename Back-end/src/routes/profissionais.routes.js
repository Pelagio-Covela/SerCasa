const express = require("express");
const pool = require("../config/baseDados");
const { filtrarDisponiveis } = require("../utils/disponibilidade");

const router = express.Router();

// Monta o objecto do profissional no formato que o Front-end do cliente espera
// (camelCase, com as listas de competências e disponibilidade já juntas).
function formatarProfissional(linha, competenciasPorId, disponibilidadePorId) {
  return {
    id: String(linha.id),
    usuario_id: linha.usuario_id,
    nome: linha.nome,
    telefone: linha.telefone,
    categoria: linha.categoria_id,
    avaliacao: linha.avaliacao !== null ? Number(linha.avaliacao) : 0,
    totalAvaliacoes: linha.total_avaliacoes || 0,
    precoPorHora: linha.preco_por_hora !== null ? Number(linha.preco_por_hora) : 0,
    foto: linha.foto,
    experiencia: linha.experiencia,
    descricao: linha.descricao,
    competencias: competenciasPorId[linha.id] || [],
    disponibilidade: disponibilidadePorId[linha.id] || [],
  };
}

// Busca competências e disponibilidade de vários profissionais de uma vez
// (evita fazer uma query extra por profissional).
async function buscarCompetenciasEDisponibilidade(ids) {
  if (ids.length === 0) return { competenciasPorId: {}, disponibilidadePorId: {} };

  const placeholders = ids.map(() => "?").join(",");

  const [linhasCompetencias] = await pool.query(
    `SELECT profissional_id, nome FROM competencias WHERE profissional_id IN (${placeholders})`,
    ids
  );
  const [linhasDisponibilidade] = await pool.query(
    `SELECT profissional_id, dia_semana FROM disponibilidade WHERE profissional_id IN (${placeholders})`,
    ids
  );

  const competenciasPorId = {};
  for (const linha of linhasCompetencias) {
    (competenciasPorId[linha.profissional_id] ||= []).push(linha.nome);
  }

  const disponibilidadePorId = {};
  for (const linha of linhasDisponibilidade) {
    (disponibilidadePorId[linha.profissional_id] ||= []).push(linha.dia_semana);
  }

  return { competenciasPorId, disponibilidadePorId };
}

// LISTAR PROFISSIONAIS
router.get("/", async (req, res) => {
  try {
    const { categoria, data, hora } = req.query;

    let query = "SELECT * FROM profissionais WHERE ativo = TRUE";
    let valores = [];

    if (categoria) {
      query += " AND categoria_id = ?";
      valores.push(categoria);
    }

    const [linhas] = await pool.query(query, valores);
    let ids = linhas.map((l) => l.id);

    // sempre filtra quem está manualmente pausado ("ficar indisponível" no
    // app); se o cliente já escolheu data (e opcionalmente hora), também
    // filtra quem está disponível nesse dia da semana e sem conflito de agenda
    const disponiveis = await filtrarDisponiveis(ids, data, hora);

    const linhasFiltradas = linhas.filter((l) => disponiveis.has(l.id));
    ids = linhasFiltradas.map((l) => l.id);

    const { competenciasPorId, disponibilidadePorId } = await buscarCompetenciasEDisponibilidade(ids);

    res.json({
      total: linhasFiltradas.length,
      profissionais: linhasFiltradas.map((l) => formatarProfissional(l, competenciasPorId, disponibilidadePorId)),
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      mensagem: "Erro ao obter profissionais",
    });
  }
});

// OBTER PROFISSIONAL POR ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [linhas] = await pool.query(
      "SELECT * FROM profissionais WHERE id = ?",
      [id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({
        mensagem: "Profissional não encontrado",
      });
    }

    const { competenciasPorId, disponibilidadePorId } = await buscarCompetenciasEDisponibilidade([id]);

    res.json(formatarProfissional(linhas[0], competenciasPorId, disponibilidadePorId));
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      mensagem: "Erro ao obter profissional",
    });
  }
});

// LISTAR AVALIAÇÕES APROVADAS DE UM PROFISSIONAL (público)
router.get("/:id/avaliacoes", async (req, res) => {
  try {
    const { id } = req.params;

    const [linhas] = await pool.query(
      `SELECT nome_cliente, nota, comentario, criado_em
       FROM avaliacoes
       WHERE profissional_id = ? AND status = 'aprovado'
       ORDER BY criado_em DESC`,
      [id]
    );

    res.json({ total: linhas.length, avaliacoes: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter avaliações" });
  }
});

module.exports = router;
