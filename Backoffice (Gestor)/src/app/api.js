// Camada de comunicação com o backend (Back-end/src/routes/*.js)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ─── Auxiliares de autenticação ────────────────────────────────────────────

function obterToken() {
  return localStorage.getItem("servcasa_token");
}

export function guardarSessao(token, utilizador) {
  localStorage.setItem("servcasa_token", token);
  localStorage.setItem("servcasa_utilizador", JSON.stringify(utilizador));
}

export function limparSessao() {
  localStorage.removeItem("servcasa_token");
  localStorage.removeItem("servcasa_utilizador");
}

export function obterUtilizadorGuardado() {
  const dados = localStorage.getItem("servcasa_utilizador");
  return dados ? JSON.parse(dados) : null;
}

// wrapper do fetch que já injeta o token e trata erros de forma consistente
async function pedidoAutenticado(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
      ...opcoes.headers,
    },
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    // sessão expirada ou token inválido -> força novo login
    if (resposta.status === 401) {
      limparSessao();
    }
    throw new Error(dados.mensagem || "Erro na comunicação com o servidor");
  }

  return dados;
}

// ─── Autenticação ───────────────────────────────────────────────────────────

export async function login(email, senha) {
  const resposta = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Credenciais inválidas");
  }

  if (!["gerente", "admin"].includes(dados.usuario?.papel)) {
    throw new Error("Esta conta não tem acesso ao backoffice.");
  }

  return dados; // { token, usuario }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getDashboard = () => pedidoAutenticado("/gerente/dashboard");

// ─── Agendamentos ────────────────────────────────────────────────────────────

export const getAgendamentos = (status = "") => {
  const query = status && status !== "todos" ? `?status=${status}` : "";
  return pedidoAutenticado(`/gerente/agendamentos${query}`);
};

export const criarAgendamento = (dados) =>
  pedidoAutenticado("/gerente/agendamentos", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const atribuirAgendamento = (id, profissional_id) =>
  pedidoAutenticado(`/gerente/agendamentos/${id}/atribuir`, {
    method: "PUT",
    body: JSON.stringify({ profissional_id }),
  });

export const cancelarAgendamento = (id, motivo) =>
  pedidoAutenticado(`/gerente/agendamentos/${id}/cancelar`, {
    method: "PUT",
    body: JSON.stringify({ motivo }),
  });

// ─── Profissionais ───────────────────────────────────────────────────────────

export const getProfissionais = () => pedidoAutenticado("/gerente/profissionais");

export const criarProfissional = (dados) =>
  pedidoAutenticado("/gerente/profissionais", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const alterarEstadoProfissional = (id, ativo) =>
  pedidoAutenticado(`/gerente/profissionais/${id}/estado`, {
    method: "PUT",
    body: JSON.stringify({ ativo }),
  });

export const editarProfissional = (id, dados) =>
  pedidoAutenticado(`/gerente/profissionais/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });

export const excluirProfissional = (id) =>
  pedidoAutenticado(`/gerente/profissionais/${id}`, {
    method: "DELETE",
  });

// ─── Administração (exclusivo do papel "admin") ────────────────────────────

export const getGestores = () => pedidoAutenticado("/admin/gestores");

export const criarGestor = (dados) =>
  pedidoAutenticado("/admin/gestores", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const editarGestor = (id, dados) =>
  pedidoAutenticado(`/admin/gestores/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });

export const alterarEstadoGestor = (id, ativo) =>
  pedidoAutenticado(`/admin/gestores/${id}/estado`, {
    method: "PUT",
    body: JSON.stringify({ ativo }),
  });

export const resetarSenhaGestor = (id, senha) =>
  pedidoAutenticado(`/admin/gestores/${id}/resetar-senha`, {
    method: "PUT",
    body: JSON.stringify({ senha }),
  });

export const resetarSenhaTrabalhador = (profissionalId, senha) =>
  pedidoAutenticado(`/admin/trabalhadores/${profissionalId}/resetar-senha`, {
    method: "PUT",
    body: JSON.stringify({ senha }),
  });

export const criarCategoria = (dados) =>
  pedidoAutenticado("/admin/categorias", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const editarCategoria = (id, dados) =>
  pedidoAutenticado(`/admin/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });

export const removerCategoria = (id) =>
  pedidoAutenticado(`/admin/categorias/${id}`, {
    method: "DELETE",
  });

// ─── Categorias (endpoint público, já existente no backend) ────────────────

export async function getCategorias() {
  const resposta = await fetch(`${BASE_URL}/categorias`);
  return resposta.json();
}
