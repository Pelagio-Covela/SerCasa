const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// PROFISSIONAIS
export const getProfissionais = async (categoriaId = "", data = "", hora = "") => {
  const params = new URLSearchParams();
  if (categoriaId) params.set("categoria", categoriaId);
  if (data) params.set("data", data);
  if (hora) params.set("hora", hora);
  const query = params.toString();
  const res = await fetch(`${BASE_URL}/profissionais${query ? `?${query}` : ""}`);
  const dados = await res.json();
  return dados.profissionais;
};

export const getProfissional = async (id) => {
  const res = await fetch(`${BASE_URL}/profissionais/${id}`);
  return res.json();
};

// CATEGORIAS
export const getCategorias = async () => {
  const res = await fetch(`${BASE_URL}/categorias`);
  return res.json();
};

export const getCategoria = async (id) => {
  const res = await fetch(`${BASE_URL}/categorias/${id}`);
  if (!res.ok) return null;
  return res.json();
};

// AGENDAMENTOS
export const criarAgendamento = async (dados) => {
  const res = await fetch(`${BASE_URL}/agendamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
};

// CONTACTO
export const enviarContacto = async (dados) => {
  const res = await fetch(`${BASE_URL}/contacto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const resposta = await res.json();
  if (!res.ok) throw new Error(resposta.mensagem || "Erro ao enviar mensagem");
  return resposta;
};
// PAGAMENTO PÓS-SERVIÇO (fatura + submissão dos dados de pagamento)
export const getFatura = async (token) => {
  const res = await fetch(`${BASE_URL}/agendamentos/pagamento/${token}`);
  const dados = await res.json();
  if (!res.ok) throw new Error(dados.mensagem || "Fatura não encontrada");
  return dados;
};

export const submeterPagamento = async (token, metodo_pagamento, detalhes) => {
  const res = await fetch(`${BASE_URL}/agendamentos/pagamento/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metodo_pagamento, detalhes }),
  });
  const dados = await res.json();
  if (!res.ok) throw new Error(dados.mensagem || "Erro ao submeter o pagamento");
  return dados;
};

// AVALIAÇÕES
export const submeterAvaliacao = async (token, nota, comentario) => {
  const res = await fetch(`${BASE_URL}/agendamentos/pagamento/${token}/avaliacao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota, comentario }),
  });
  const dados = await res.json();
  if (!res.ok) throw new Error(dados.mensagem || "Erro ao submeter avaliação");
  return dados;
};

export const getAvaliacoesProfissional = async (profissionalId) => {
  const res = await fetch(`${BASE_URL}/profissionais/${profissionalId}/avaliacoes`);
  if (!res.ok) return { total: 0, avaliacoes: [] };
  return res.json();
};
