// Camada de comunicação com o backend (Back-end/src/routes/trabalhador.routes.js e auth.routes.js)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
    if (resposta.status === 401) limparSessao();
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

  if (dados.usuario?.papel !== "trabalhador") {
    throw new Error("Esta conta não é de um profissional. Fale com o gestor.");
  }

  return dados; // { token, usuario }
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export const getMeusPedidos = () => pedidoAutenticado("/trabalhador/pedidos");
export const getPedidosProximos = () => pedidoAutenticado("/trabalhador/pedidos/proximos");
export const getPedido = (id) => pedidoAutenticado(`/trabalhador/pedidos/${id}`);

export const aceitarPedido = (id) =>
  pedidoAutenticado(`/trabalhador/pedidos/${id}/aceitar`, { method: "PUT" });

export const fazerCheckin = (id, latitude, longitude) =>
  pedidoAutenticado(`/trabalhador/pedidos/${id}/checkin`, {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });

export const fazerCheckout = (id, latitude, longitude) =>
  pedidoAutenticado(`/trabalhador/pedidos/${id}/checkout`, {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });

export const atualizarLocalizacao = (latitude, longitude) =>
  pedidoAutenticado("/trabalhador/localizacao", {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });

export const getHistorico = (periodo) =>
  pedidoAutenticado(`/trabalhador/historico${periodo ? `?periodo=${periodo}` : ""}`);

// ─── Perfil ──────────────────────────────────────────────────────────────────

export const getPerfil = () => pedidoAutenticado("/trabalhador/perfil");

export const atualizarDisponibilidade = (disponibilidade) =>
  pedidoAutenticado("/trabalhador/perfil/disponibilidade", {
    method: "PUT",
    body: JSON.stringify({ disponibilidade }),
  });
