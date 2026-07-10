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
  return res.json();
};