import { useState, useEffect, useRef } from "react";
import {
  Home, Map, Clock, User, Phone, Eye, EyeOff,
  LogOut, MapPin, ArrowLeft, Navigation,
  CheckCircle, AlertCircle, Calendar,
  Star, Loader2, Wallet, Check, Timer, RefreshCw, Power,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import {
  login, guardarSessao, limparSessao, obterUtilizadorGuardado,
  getMeusPedidos, getPedidosProximos, getPedido, aceitarPedido,
  fazerCheckin, fazerCheckout, atualizarLocalizacao, editarDuracaoEstimada,
  getHistorico, getPerfil, atualizarDisponibilidade, atualizarDisponivelAgora,
} from "./api.js";

// Corrige o ícone padrão do Leaflet (não carrega sozinho no Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function R(v) {
  return `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
}

function formatarCronometro(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function formatarHora(dataHora) {
  if (!dataHora) return "—";
  return new Date(dataHora).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function formatarData(data) {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-PT", { timeZone: "UTC" });
}

// distância em km entre duas coordenadas (fórmula de Haversine) — usada só
// para mostrar ao profissional; a validação de verdade é feita no backend
function distanciaKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const Rt = 6371;
  const rad = (v) => (v * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Rt * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EMOJI_CATEGORIA = {
  domestica: "🧹", encanador: "🔧", cozinheiro: "🍳", jardineiro: "🌿", eletricista: "⚡",
};

// Regra de negócio: Pendente = atribuído mas ainda sem check-in (inclui os
// estados internos "aceite" e "a_caminho", anteriores ao check-in);
// Em execução = check-in feito, sem check-out ainda; Concluído = os dois feitos.
const STATUS_CFG = {
  pendente: { label: "Pendente", cls: "bg-amber-500/20 text-amber-400" },
  aceite: { label: "Pendente", cls: "bg-amber-500/20 text-amber-400" },
  a_caminho: { label: "Pendente", cls: "bg-amber-500/20 text-amber-400" },
  em_execucao: { label: "Em execução", cls: "bg-blue-500/20 text-blue-400" },
  concluido: { label: "Concluído", cls: "bg-green-500/20 text-green-400" },
  cancelado: { label: "Cancelado", cls: "bg-red-500/20 text-red-400" },
};

function Badge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pendente;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ── Seletor de duração (relógio nativo horas:minutos) ──────────────────────────

function minutosParaHHMM(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmParaMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Selector de horas:minutos usando o <input type="time"> nativo — em
// telemóveis (iOS/Android) isto mostra o "relógio" giratório nativo do
// aparelho, muito mais preciso e familiar do que botões pré-definidos.
// Se minimoMinutos for passado, só aceita valores estritamente maiores.
function SeletorDuracaoRelogio({ valorMinutos, aoMudar, minimoMinutos }) {
  const [erro, setErro] = useState("");

  function lidarComMudanca(evento) {
    const valor = evento.target.value;
    if (!valor) return;
    const minutos = hhmmParaMinutos(valor);

    if (minimoMinutos != null && minutos <= minimoMinutos) {
      setErro(`Escolha um valor maior que ${minutosParaHHMM(minimoMinutos)}`);
      return;
    }
    setErro("");
    aoMudar(minutos);
  }

  return (
    <div>
      <input
        type="time"
        value={minutosParaHHMM(valorMinutos)}
        onChange={lidarComMudanca}
        className="w-full text-center text-[28px] font-bold rounded-2xl py-3 px-4"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
          colorScheme: "dark",
        }}
      />
      <p className="text-center text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>horas : minutos</p>
      {erro && (
        <p className="text-center text-[12px] mt-1" style={{ color: "#f87171" }}>{erro}</p>
      )}
    </div>
  );
}

// ── Mini-mapa real (Leaflet) ───────────────────────────────────────────────────

function RecentrarMapa({ centro }) {
  const map = useMap();
  useEffect(() => { if (centro) map.setView(centro, map.getZoom()); }, [centro]);
  return null;
}

function MiniMapa({ pedidos = [], altura = 160, aoTap }) {
  const comCoordenadas = pedidos.filter((p) => p.latitude && p.longitude);
  const centro = comCoordenadas.length > 0
    ? [comCoordenadas[0].latitude, comCoordenadas[0].longitude]
    : [-25.9692, 32.5732]; // Maputo, usado só se não houver nenhum pedido com localização

  return (
    <div style={{ height: altura, background: "#080f1c" }}>
      <MapContainer center={centro} zoom={13} zoomControl={false} attributionControl={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {comCoordenadas.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            eventHandlers={aoTap ? { click: () => aoTap(p) } : undefined}
          />
        ))}
      </MapContainer>
    </div>
  );
}

// ── Tela: Login ────────────────────────────────────────────────────────────────

function TelaLogin({ aoEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function lidarComLogin(e) {
    e.preventDefault();
    if (!email || !senha) { setErro("Preencha o e-mail e a senha para continuar."); return; }
    setErro("");
    setCarregando(true);
    try {
      const dados = await login(email, senha);
      guardarSessao(dados.token, dados.usuario);
      aoEntrar(dados.usuario);
    } catch (falha) {
      setErro(falha.message || "Credenciais inválidas.");
    } finally {
      setCarregando(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    outline: "none",
    color: "white",
  };

  return (
    <div className="flex flex-col h-full px-6 pt-14 pb-8" style={{ background: "#030213" }}>
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.png"
            alt="ServCasa logotipo"
            className="w-24 h-24 rounded-3xl mb-5 object-contain"
            style={{ boxShadow: "0 8px 32px rgba(37,99,235,0.35)" }}
          />
          <h1 className="text-white text-[28px] font-bold tracking-tight">ServCasa</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>App do Profissional</p>
        </div>

        <form onSubmit={lidarComLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              E-mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-2xl px-4 py-4 text-[15px] placeholder-white/20"
              style={inputStyle}
              placeholder="seu@email.com"
              autoCapitalize="none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"} value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full rounded-2xl px-4 py-4 pr-14 text-[15px] placeholder-white/20"
                style={inputStyle}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors p-1"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} /><span>{erro}</span>
            </div>
          )}

          <button type="submit" disabled={carregando}
            className="mt-1 rounded-2xl py-4 font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.97] disabled:opacity-60"
            style={{ background: "white", color: "#030213" }}>
            {carregando && <Loader2 size={16} className="animate-spin" />}
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
        Conta criada pelo gestor no backoffice
      </p>
    </div>
  );
}

// ── Card de Pedido ─────────────────────────────────────────────────────────────

function CardPedido({ pedido, aoTap, distancia }) {
  return (
    <button onClick={() => aoTap(pedido)}
      className="w-full text-left rounded-2xl p-4 mb-3 transition-transform active:scale-[0.97]"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          {EMOJI_CATEGORIA[pedido.categoria_id] || "🧰"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <span className="text-white font-semibold text-[15px] truncate">{pedido.nome_cliente}</span>
            <Badge status={pedido.status} />
          </div>
          <div className="flex items-center gap-1 text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            <MapPin size={11} />
            <span className="truncate">{pedido.endereco}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Calendar size={11} />{formatarData(pedido.data)} às {(pedido.hora || "").slice(0, 5)}
            </span>
            {(distancia ?? pedido.distancia_km) != null && (
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {Number(distancia ?? pedido.distancia_km).toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Tela: Início ──────────────────────────────────────────────────────────────

// início (segunda) e fim (domingo) da semana corrente, para separar
// "esta semana" de "próximas semanas" nas abas de pedidos
function limitesDaSemanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Domingo...6=Sábado
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana; // volta até Segunda
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() + deslocamento);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

// ordena por data+hora crescente — o pedido mais próximo (hoje/em breve)
// aparece primeiro
function ordenarPorDataHora(pedidos) {
  return [...pedidos].sort((a, b) => {
    const chaveA = `${(a.data || "").slice(0, 10)} ${(a.hora || "00:00").slice(0, 5)}`;
    const chaveB = `${(b.data || "").slice(0, 10)} ${(b.hora || "00:00").slice(0, 5)}`;
    return chaveA.localeCompare(chaveB);
  });
}

function TelaInicio({ utilizador, aoAbrirPedido }) {
  const [aba, setAba] = useState("meus");
  const [estado, setEstado] = useState("carregando");
  const [meusPedidos, setMeusPedidos] = useState([]);
  const [ganhoSemana, setGanhoSemana] = useState(0);
  const [disponivelAgora, setDisponivelAgora] = useState(true);
  const [alterandoDisponibilidade, setAlterandoDisponibilidade] = useState(false);
  const [erroDisponibilidade, setErroDisponibilidade] = useState("");

  async function carregar() {
    setEstado("carregando");
    try {
      const [meus, historico, perfil] = await Promise.all([
        getMeusPedidos(),
        getHistorico("semana").catch(() => ({ totalRecebido: 0 })),
        getPerfil().catch(() => null),
      ]);
      setMeusPedidos(meus.pedidos);
      setGanhoSemana(historico.totalRecebido || 0);
      if (perfil) setDisponivelAgora(!!perfil.disponivel_agora);
      setEstado("carregado");
    } catch {
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, []);

  async function lidarComAlternarDisponibilidade() {
    const novoValor = !disponivelAgora;
    setAlterandoDisponibilidade(true);
    setErroDisponibilidade("");
    try {
      await atualizarDisponivelAgora(novoValor);
      setDisponivelAgora(novoValor);
    } catch (falha) {
      console.error("Erro ao alternar disponibilidade:", falha);
      setErroDisponibilidade(falha.message || "Não foi possível atualizar. Tente novamente.");
    } finally {
      setAlterandoDisponibilidade(false);
    }
  }

  // só faz sentido mostrar o aviso de disponibilidade quando ele NÃO está a
  // meio de um serviço (aí já é óbvio que está "ocupado")
  const emServicoAtivo = meusPedidos.some((p) => p.status === "em_execucao");

  // "Meus pedidos" = esta semana (inclui atrasados, se houver);
  // "Próximos" = semanas seguintes — ambos ordenados do mais próximo pro mais distante
  const { fim: fimDaSemana } = limitesDaSemanaAtual();
  const pedidosDestaSemana = ordenarPorDataHora(
    meusPedidos.filter((p) => new Date(`${(p.data || "").slice(0, 10)}T23:59:59`) <= fimDaSemana)
  );
  const pedidosProximasSemanas = ordenarPorDataHora(
    meusPedidos.filter((p) => new Date(`${(p.data || "").slice(0, 10)}T23:59:59`) > fimDaSemana)
  );

  const pedidos = aba === "meus" ? pedidosDestaSemana : pedidosProximasSemanas;
  const primeiroNome = (utilizador?.nome || "").split(" ")[0];

  return (
    <div className="flex flex-col h-full" style={{ background: "#030213" }}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Olá,</p>
          <h2 className="text-white text-[22px] font-bold">{primeiroNome} 👋</h2>
        </div>
        <button onClick={carregar} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
          <RefreshCw size={15} className="text-white/60" />
        </button>
      </div>

      {!emServicoAtivo && (
        <div className="mx-5 mb-4 rounded-2xl p-4" style={{
          background: disponivelAgora ? "rgba(22,163,74,0.1)" : "rgba(212,24,61,0.1)",
          border: `1px solid ${disponivelAgora ? "rgba(22,163,74,0.25)" : "rgba(212,24,61,0.25)"}`,
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{
              background: disponivelAgora ? "rgba(22,163,74,0.15)" : "rgba(212,24,61,0.15)",
            }}>
              <Power size={16} color={disponivelAgora ? "#4ade80" : "#f87171"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: disponivelAgora ? "#4ade80" : "#f87171" }}>
                {disponivelAgora ? "Você está disponível" : "Você está indisponível"}
              </p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {disponivelAgora ? "A receber novos pedidos próximos" : "Não vai receber novos pedidos agora"}
              </p>
            </div>
            <button onClick={lidarComAlternarDisponibilidade} disabled={alterandoDisponibilidade}
              className="text-[12px] font-semibold px-3 py-2 rounded-xl flex-shrink-0 disabled:opacity-60"
              style={{
                background: disponivelAgora ? "rgba(212,24,61,0.15)" : "rgba(22,163,74,0.15)",
                color: disponivelAgora ? "#f87171" : "#4ade80",
              }}>
              {alterandoDisponibilidade ? "..." : disponivelAgora ? "Ficar indisponível" : "Ficar disponível"}
            </button>
          </div>
          {erroDisponibilidade && (
            <p className="text-[11px] mt-2" style={{ color: "#f87171" }}>{erroDisponibilidade}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 px-5 mb-4">
        <div className="flex-1 rounded-2xl p-4" style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(74,222,128,0.7)" }}>Esta semana</p>
          <p className="text-[#4ade80] text-lg font-bold">{R(ganhoSemana)}</p>
        </div>
        <div className="flex-1 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Pedidos</p>
          <p className="text-white text-lg font-bold">{meusPedidos.length} ativos</p>
        </div>
      </div>

      <div className="flex mx-5 mb-4 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        {["meus", "proximos"].map(a => (
          <button key={a} onClick={() => setAba(a)}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
            style={{ background: aba === a ? "white" : "transparent", color: aba === a ? "#030213" : "rgba(255,255,255,0.45)" }}>
            {a === "meus" ? "Meus pedidos" : "Próximos"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {estado === "carregando" ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-white/30 mb-3" />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>A carregar pedidos...</p>
          </div>
        ) : estado === "erro" ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle size={32} className="text-red-400/60 mb-3" />
            <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Erro ao carregar pedidos</p>
            <button onClick={carregar} className="text-[13px] font-semibold px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>Tentar novamente</button>
          </div>

        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              {aba === "proximos" ? "Nenhum pedido agendado para as próximas semanas." : "Nenhum pedido agendado para esta semana."}
            </p>
          </div>
        ) : (
          pedidos.map(p => <CardPedido key={p.id} pedido={p} aoTap={aoAbrirPedido} />)
        )}
      </div>
    </div>
  );
}

// ── Tela: Detalhe do Pedido ───────────────────────────────────────────────────

function TelaDetalhePedido({ pedidoId, aoVoltar, aoCheckin, minhaLocalizacao }) {
  const [pedido, setPedido] = useState(null);
  const [estado, setEstado] = useState("carregando");
  const [aceitando, setAceitando] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarSeletorDuracao, setMostrarSeletorDuracao] = useState(false);
  const [duracaoEscolhidaMinutos, setDuracaoEscolhidaMinutos] = useState(120);

  async function carregar() {
    setEstado("carregando");
    try {
      const dados = await getPedido(pedidoId);
      setPedido(dados);
      setEstado("carregado");
    } catch {
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, [pedidoId]);

  async function lidarComAceitar() {
    setAceitando(true);
    setErro("");
    try {
      await aceitarPedido(pedidoId, duracaoEscolhidaMinutos);
      setMostrarSeletorDuracao(false);
      await carregar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAceitando(false);
    }
  }

  if (estado === "carregando" || !pedido) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: "#030213" }}>
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  const distancia = minhaLocalizacao
    ? distanciaKm(minhaLocalizacao.lat, minhaLocalizacao.lng, pedido.latitude, pedido.longitude)
    : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "#030213" }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button onClick={aoVoltar}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-[17px]">Detalhe do Pedido</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="rounded-2xl overflow-hidden mb-4 relative" style={{ height: 158 }}>
          <MiniMapa pedidos={[pedido]} altura={158} />
          <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
            <p className="text-white text-[13px] font-semibold">{pedido.endereco}</p>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              {EMOJI_CATEGORIA[pedido.categoria_id] || "🧰"}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-[17px]">{pedido.nome_cliente}</h3>
            </div>
            <Badge status={pedido.status} />
          </div>
          {pedido.descricao && <p className="text-[14px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>{pedido.descricao}</p>}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Calendar size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              <span>{formatarData(pedido.data)} às {(pedido.hora || "").slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <MapPin size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              <span>{pedido.endereco}</span>
            </div>
            {distancia != null && (
              <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Navigation size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <span>{distancia.toFixed(1)} km de distância</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Cliente</p>
              <p className="text-white text-[15px] font-semibold">{pedido.nome_cliente}</p>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>{pedido.telefone}</p>
            </div>
            {pedido.telefone && (
              <a href={`tel:${pedido.telefone}`}
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform active:scale-90"
                style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)" }}>
                <Phone size={18} style={{ color: "#4ade80" }} />
              </a>
            )}
          </div>
        </div>

        {pedido.status === "concluido" ? (
          <div className="rounded-2xl p-4" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(74,222,128,0.65)" }}>Você recebeu</p>
            <p className="text-[#4ade80] text-2xl font-bold">{R(pedido.valor_profissional)}</p>
          </div>
        ) : (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Pagamento</p>
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Calculado automaticamente após o check-out, com base no tempo trabalhado.</p>
          </div>
        )}

        {erro && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-[13px]">
            <AlertCircle size={14} /><span>{erro}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex flex-col gap-2.5">
        {pedido.latitude && pedido.longitude && (
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${pedido.latitude},${pedido.longitude}`, "_blank")}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold transition-transform active:scale-[0.97]"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            <Navigation size={15} /> Abrir no Google Maps
          </button>
        )}
        {pedido.status === "pendente" && !mostrarSeletorDuracao && (
          <button onClick={() => setMostrarSeletorDuracao(true)}
            className="flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.97]"
            style={{ background: "white", color: "#030213" }}>
            <Check size={16} /> Aceitar pedido
          </button>
        )}
        {pedido.status === "pendente" && mostrarSeletorDuracao && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-white text-[14px] font-semibold mb-1">Quanto tempo vai durar?</p>
            <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
              Obrigatório — define até quando você fica indisponível para outros pedidos.
            </p>
            <div className="mb-3">
              <SeletorDuracaoRelogio valorMinutos={duracaoEscolhidaMinutos} aoMudar={setDuracaoEscolhidaMinutos} />
            </div>
            {erro && (
              <div className="mb-3 flex items-center gap-2 text-red-400 text-[13px]">
                <AlertCircle size={14} /><span>{erro}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setMostrarSeletorDuracao(false)}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                Cancelar
              </button>
              <button onClick={lidarComAceitar} disabled={aceitando}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold disabled:opacity-60"
                style={{ background: "white", color: "#030213" }}>
                {aceitando ? <Loader2 size={16} className="animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        )}
        {pedido.status === "aceite" && (
          <button onClick={() => aoCheckin(pedido)}
            className="flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.97]"
            style={{ background: "#2563eb", color: "white" }}>
            <MapPin size={16} /> Fazer Check-in
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tela: Check-in ─────────────────────────────────────────────────────────────

function TelaCheckin({ pedido, aoVoltar, aoConfirmar }) {
  const RAIO = 100;
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");

  // a duração estimada é obrigatória antes do check-in — se por algum
  // motivo o pedido ainda não tiver uma (ex: veio de um fluxo antigo),
  // pede aqui antes de liberar o check-in
  const [duracaoDefinida, setDuracaoDefinida] = useState(pedido.duracao_estimada_minutos || null);
  const [novaDuracao, setNovaDuracao] = useState(pedido.duracao_estimada_minutos || 120);
  const [salvandoDuracao, setSalvandoDuracao] = useState(false);
  const [erroDuracao, setErroDuracao] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) { setErroLocalizacao("Geolocalização não suportada neste dispositivo."); return; }

    // se demorar demais (ex: sem sinal de GPS, testando num PC sem sensores),
    // avisa em vez de ficar "Aguardando localização..." para sempre
    const idTimeout = setTimeout(() => {
      setErroLocalizacao((atual) => atual || "A demorar para obter a localização. Verifique se o GPS está ativo (em computadores, use o Chrome DevTools > Sensors para simular).");
    }, 15000);

    const idObservador = navigator.geolocation.watchPosition(
      (posicao) => { clearTimeout(idTimeout); setErroLocalizacao(""); setPosicaoAtual({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }); },
      () => { clearTimeout(idTimeout); setErroLocalizacao("Não foi possível obter a sua localização. Verifique as permissões."); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => { clearTimeout(idTimeout); navigator.geolocation.clearWatch(idObservador); };
  }, []);

  const distanciaMetros = posicaoAtual
    ? distanciaKm(posicaoAtual.lat, posicaoAtual.lng, pedido.latitude, pedido.longitude) * 1000
    : null;
  const dentroRaio = distanciaMetros != null && distanciaMetros <= RAIO;

  async function confirmar() {
    if (!dentroRaio || !posicaoAtual) return;
    setConfirmando(true);
    setErro("");
    try {
      await fazerCheckin(pedido.id, posicaoAtual.lat, posicaoAtual.lng);
      aoConfirmar(duracaoDefinida);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setConfirmando(false);
    }
  }

  async function confirmarDuracao() {
    setSalvandoDuracao(true);
    setErroDuracao("");
    try {
      await editarDuracaoEstimada(pedido.id, novaDuracao);
      setDuracaoDefinida(novaDuracao);
    } catch (falha) {
      setErroDuracao(falha.message);
    } finally {
      setSalvandoDuracao(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#030213" }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button onClick={aoVoltar}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-[17px]">Check-in</h2>
      </div>

      {!duracaoDefinida ? (
        <div className="flex-1 flex flex-col px-5 pt-4">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-semibold text-[15px] mb-1">Antes de fazer check-in...</p>
            <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              Defina quanto tempo o serviço deve durar. Isso é obrigatório para o sistema saber quando você fica disponível de novo.
            </p>
            <SeletorDuracaoRelogio valorMinutos={novaDuracao} aoMudar={setNovaDuracao} />
            {erroDuracao && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-[13px]">
                <AlertCircle size={14} /><span>{erroDuracao}</span>
              </div>
            )}
            <button onClick={confirmarDuracao} disabled={salvandoDuracao}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-[14px] disabled:opacity-60"
              style={{ background: "white", color: "#030213" }}>
              {salvandoDuracao ? <Loader2 size={16} className="animate-spin" /> : "Confirmar duração"}
            </button>
          </div>
        </div>
      ) : (
      <>
      <div className="flex-1 flex flex-col px-5">
        <div className="flex flex-col items-center py-10">
          <div className="relative w-44 h-44 flex items-center justify-center mb-6">
            {dentroRaio ? (
              <>
                <div className="absolute inset-0 rounded-full animate-ping" style={{ border: "2px solid rgba(74,222,128,0.25)" }} />
                <div className="absolute inset-6 rounded-full" style={{ border: "1px solid rgba(74,222,128,0.15)" }} />
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(22,163,74,0.1)", border: "2px solid rgba(22,163,74,0.4)" }}>
                  <MapPin size={32} style={{ color: "#4ade80" }} />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                <div className="absolute inset-6 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.05)" }} />
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.12)" }}>
                  <MapPin size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
                </div>
              </>
            )}
          </div>

          {erroLocalizacao ? (
            <p className="text-[13px] text-center px-6 text-red-400">{erroLocalizacao}</p>
          ) : posicaoAtual == null ? (
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>A obter a sua localização...</p>
          ) : dentroRaio ? (
            <>
              <p className="font-bold text-[18px] mb-1" style={{ color: "#4ade80" }}>Você está no local!</p>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>{Math.round(distanciaMetros)}m do endereço do serviço</p>
            </>
          ) : (
            <>
              <p className="text-white font-bold text-[18px] mb-1">Aproxime-se do local</p>
              <p className="text-[13px] text-center px-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                Você está a {Math.round(distanciaMetros)}m. O check-in fica disponível a {RAIO}m ou menos.
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white font-semibold text-[15px] mb-1">{pedido.nome_cliente}</p>
          <p className="flex items-center gap-1 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <MapPin size={12} />{pedido.endereco}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{pedido.nome_categoria} · {(pedido.hora || "").slice(0, 5)}</p>
        </div>

        {erro && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-[13px]">
            <AlertCircle size={14} /><span>{erro}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <button onClick={confirmar} disabled={!dentroRaio || confirmando}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.97]"
          style={{
            background: dentroRaio ? "#16a34a" : "rgba(255,255,255,0.05)",
            color: dentroRaio ? "white" : "rgba(255,255,255,0.2)",
            border: dentroRaio ? "none" : "1px solid rgba(255,255,255,0.08)",
          }}>
          {confirmando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {confirmando ? "A confirmar..." : dentroRaio ? "Confirmar Check-in" : "Aguardando localização..."}
        </button>
      </div>
      </>
      )}
    </div>
  );
}

// ── Tela: Em Andamento ─────────────────────────────────────────────────────────

function TelaEmAndamento({ pedido, checkinHoraISO, aoCheckout }) {
  const [segundos, setSegundos] = useState(() => Math.max(0, Math.floor((Date.now() - new Date(checkinHoraISO).getTime()) / 1000)));
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");
  const [ajustandoDuracao, setAjustandoDuracao] = useState(false);
  const [novaDuracaoMinutos, setNovaDuracaoMinutos] = useState((pedido.duracao_estimada_minutos || 120) + 15);
  const [salvandoDuracao, setSalvandoDuracao] = useState(false);
  const [duracaoAtual, setDuracaoAtual] = useState(pedido.duracao_estimada_minutos || null);

  // ── Alerta sonoro quando faltam 10min (ou menos) para o fim estimado ──────
  const [alertaVisivel, setAlertaVisivel] = useState(false);
  const [novaDuracaoAlerta, setNovaDuracaoAlerta] = useState((duracaoAtual || 120) + 15);
  const [salvandoAlerta, setSalvandoAlerta] = useState(false);
  const [erroAlerta, setErroAlerta] = useState("");
  const intervalBeepRef = useRef(null);

  const minutosDecorridos = Math.floor(segundos / 60);
  const tempoRestanteMinutos = duracaoAtual != null ? duracaoAtual - minutosDecorridos : null;

  useEffect(() => {
    const id = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // dispara o alerta assim que faltarem 10min ou menos para o fim estimado
  useEffect(() => {
    if (tempoRestanteMinutos != null && tempoRestanteMinutos <= 10 && !alertaVisivel) {
      setAlertaVisivel(true);
      setNovaDuracaoAlerta(duracaoAtual + 15);
    }
  }, [tempoRestanteMinutos]);

  // toca "beep beep beep" repetidamente enquanto o alerta estiver visível —
  // só para quando o profissional confirmar uma nova duração
  useEffect(() => {
    if (!alertaVisivel) return;
    function tocarBeeps() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.28, 0.56].forEach((atraso) => {
          const osc = ctx.createOscillator();
          const ganho = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = 880;
          ganho.gain.value = 0.18;
          osc.connect(ganho);
          ganho.connect(ctx.destination);
          osc.start(ctx.currentTime + atraso);
          osc.stop(ctx.currentTime + atraso + 0.16);
        });
      } catch { /* áudio pode não estar disponível em alguns navegadores */ }
    }
    tocarBeeps();
    intervalBeepRef.current = setInterval(tocarBeeps, 4000);
    return () => clearInterval(intervalBeepRef.current);
  }, [alertaVisivel]);

  async function lidarComResponderAlerta() {
    setSalvandoAlerta(true);
    setErroAlerta("");
    try {
      await editarDuracaoEstimada(pedido.id, novaDuracaoAlerta);
      setDuracaoAtual(novaDuracaoAlerta);
      setAlertaVisivel(false);
    } catch (falha) {
      setErroAlerta(falha.message);
    } finally {
      setSalvandoAlerta(false);
    }
  }

  async function lidarComSalvarDuracao() {
    setSalvandoDuracao(true);
    try {
      await editarDuracaoEstimada(pedido.id, novaDuracaoMinutos);
      setDuracaoAtual(novaDuracaoMinutos);
      setAjustandoDuracao(false);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvandoDuracao(false);
    }
  }

  async function lidarComCheckout() {
    setSaindo(true);
    setErro("");
    try {
      let coords = {};
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => { coords = { lat: p.coords.latitude, lng: p.coords.longitude }; resolve(); },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      }
      const resultado = await fazerCheckout(pedido.id, coords.lat, coords.lng);
      aoCheckout(resultado);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#030213", position: "relative" }}>
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#60a5fa" }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#60a5fa" }}>Serviço em execução</p>
        </div>
        <h2 className="text-white text-[22px] font-bold">{pedido.nome_cliente}</h2>
        <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.5)" }}>{pedido.nome_categoria}</p>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-5">
        <div className="flex flex-col items-center py-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            Tempo decorrido
          </p>
          <p className="text-white font-bold tracking-widest tabular-nums" style={{ fontSize: 48, fontFamily: "monospace" }}>
            {formatarCronometro(segundos)}
          </p>
          <p className="text-[13px] mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>Check-in às {formatarHora(checkinHoraISO)}</p>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <MapPin size={13} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            {pedido.endereco}
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {!ajustandoDuracao ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Duração estimada</p>
                <p className="text-white text-[15px] font-semibold">
                  {duracaoAtual ? (duracaoAtual >= 60 ? `${Math.floor(duracaoAtual / 60)}h ${duracaoAtual % 60 || ""}`.trim() : `${duracaoAtual}min`) : "Não definida"}
                </p>
              </div>
              <button onClick={() => setAjustandoDuracao(true)}
                className="text-[12px] font-semibold px-3 py-2 rounded-lg"
                style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa" }}>
                Ajustar
              </button>
            </div>
          ) : (
            <div>
              <p className="text-white text-[13px] font-semibold mb-2">Ajustar duração estimada</p>
              <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Use se surgiu um imprevisto — só é possível aumentar a duração.</p>
              <div className="mb-3">
                <SeletorDuracaoRelogio valorMinutos={novaDuracaoMinutos} aoMudar={setNovaDuracaoMinutos} minimoMinutos={duracaoAtual} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAjustandoDuracao(false)}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                  Cancelar
                </button>
                <button onClick={lidarComSalvarDuracao} disabled={salvandoDuracao}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-60"
                  style={{ background: "white", color: "#030213" }}>
                  {salvandoDuracao ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {erro && (
          <div className="mb-3 flex items-center gap-2 text-red-400 text-[13px]">
            <AlertCircle size={14} /><span>{erro}</span>
          </div>
        )}

        <div className="mt-auto">
          <button onClick={lidarComCheckout} disabled={saindo}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.97] disabled:opacity-60"
            style={{ background: "#d4183d", color: "white" }}>
            {saindo ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {saindo ? "A finalizar..." : "Fazer Check-out"}
          </button>
        </div>
      </div>

      {/* Alerta sonoro: tempo estimado quase a acabar — só fecha ao definir
          uma nova duração (ou ao fazer check-out, que troca de ecrã) */}
      {alertaVisivel && (
        <div className="absolute inset-0 flex items-end justify-center p-5" style={{ background: "rgba(3,2,19,0.85)", zIndex: 30 }}>
          <div className="w-full rounded-3xl p-5" style={{ background: "#0b0d1a", border: "1px solid rgba(248,113,113,0.35)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#f87171" }} />
              <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#f87171" }}>Tempo quase a acabar</p>
            </div>
            <p className="text-white font-bold text-[17px] mb-1">
              {tempoRestanteMinutos > 0 ? `Faltam ${tempoRestanteMinutos} min para o fim estimado` : "O tempo estimado já terminou"}
            </p>
            <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              Ainda não fez check-out. Quanto tempo falta, de verdade, para terminar o serviço?
            </p>
            <SeletorDuracaoRelogio valorMinutos={novaDuracaoAlerta} aoMudar={setNovaDuracaoAlerta} minimoMinutos={duracaoAtual} />
            {erroAlerta && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-[13px]">
                <AlertCircle size={14} /><span>{erroAlerta}</span>
              </div>
            )}
            <button onClick={lidarComResponderAlerta} disabled={salvandoAlerta}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-[14px] disabled:opacity-60"
              style={{ background: "white", color: "#030213" }}>
              {salvandoAlerta ? <Loader2 size={16} className="animate-spin" /> : "Atualizar duração"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tela: Resumo ───────────────────────────────────────────────────────────────

function TelaResumo({ pedido, checkinHoraISO, resultadoCheckout, aoVoltar }) {
  const duracaoTexto = (() => {
    const min = resultadoCheckout?.duracao_minutos || 0;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  })();

  return (
    <div className="flex flex-col h-full px-5 pb-5 overflow-y-auto" style={{ background: "#030213" }}>
      <div className="pt-10 flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)" }}>
          <CheckCircle size={32} style={{ color: "#4ade80" }} />
        </div>
        <h2 className="text-white text-[22px] font-bold mb-1">Serviço concluído!</h2>
        <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.4)" }}>Ótimo trabalho</p>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="p-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Serviço</p>
          <p className="text-white font-semibold text-[15px]">{pedido.nome_cliente} · {pedido.nome_categoria}</p>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>{formatarData(pedido.data)}</p>
        </div>
        <div className="grid grid-cols-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[["Chegada", formatarHora(checkinHoraISO)], ["Saída", formatarHora(new Date())]].map(([label, val]) => (
            <div key={label} className="p-4" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
              <p className="text-white text-[17px] font-semibold" style={{ fontFamily: "monospace" }}>{val}</p>
            </div>
          ))}
        </div>
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Duração total</p>
          <p className="text-white text-[16px] font-semibold">{duracaoTexto}</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(74,222,128,0.65)" }}>Você vai receber</p>
        <p className="font-bold mb-1" style={{ color: "#4ade80", fontSize: 38 }}>{R(resultadoCheckout?.valor_profissional)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
          <p className="text-[12px] font-medium" style={{ color: "rgba(251,191,36,0.7)" }}>Pagamento pendente</p>
        </div>
      </div>

      <button onClick={aoVoltar}
        className="rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.97]"
        style={{ background: "white", color: "#030213" }}>
        Voltar ao início
      </button>
    </div>
  );
}

// ── Tela: Mapa ─────────────────────────────────────────────────────────────────

function TelaMapa({ aoAbrirPedido }) {
  const [estado, setEstado] = useState("carregando");
  const [pedidos, setPedidos] = useState([]);

  async function carregar() {
    setEstado("carregando");
    try {
      const [meus, proximos] = await Promise.all([
        getMeusPedidos(),
        getPedidosProximos().catch(() => ({ pedidos: [] })),
      ]);
      const todos = [...meus.pedidos, ...proximos.pedidos].sort(
        (a, b) => (a.distancia_km ?? 999) - (b.distancia_km ?? 999)
      );
      setPedidos(todos);
      setEstado("carregado");
    } catch {
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: "#030213" }}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-bold text-[22px]">Mapa</h2>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>Pedidos próximos a você</p>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden mb-3 flex-shrink-0" style={{ height: 220 }}>
        <MiniMapa pedidos={pedidos} altura={220} aoTap={aoAbrirPedido} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Pedidos próximos
        </p>
        {estado === "carregando" ? (
          <Loader2 size={22} className="animate-spin text-white/30 mx-auto mt-6" />
        ) : pedidos.length === 0 ? (
          <p className="text-[13px] text-center mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum pedido para mostrar</p>
        ) : (
          pedidos.map(p => (
            <button key={p.id} onClick={() => aoAbrirPedido(p)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-2xl mb-2 transition-transform active:scale-[0.97]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {EMOJI_CATEGORIA[p.categoria_id] || "🧰"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[14px] font-semibold truncate">{p.nome_cliente}</p>
                <p className="text-[12px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{p.endereco}</p>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                {p.distancia_km != null && <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>{Number(p.distancia_km).toFixed(1)} km</span>}
                <Badge status={p.status} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Tela: Histórico ────────────────────────────────────────────────────────────

function TelaHistorico() {
  const [filtro, setFiltro] = useState("semana");
  const [estado, setEstado] = useState("carregando");
  const [historico, setHistorico] = useState({ pedidos: [], totalRecebido: 0 });
  const filtros = [{ v: "semana", l: "Semana" }, { v: "mes", l: "Mês" }, { v: "", l: "Tudo" }];

  async function carregar() {
    setEstado("carregando");
    try {
      const dados = await getHistorico(filtro || undefined);
      setHistorico(dados);
      setEstado("carregado");
    } catch {
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, [filtro]);

  return (
    <div className="flex flex-col h-full" style={{ background: "#030213" }}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-bold text-[22px]">Histórico</h2>
      </div>

      <div className="mx-5 rounded-2xl p-4 mb-4" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(74,222,128,0.65)" }}>Total recebido</p>
        <p className="font-bold" style={{ color: "#4ade80", fontSize: 32 }}>{R(historico.totalRecebido)}</p>
        <p className="text-[12px] mt-1" style={{ color: "rgba(74,222,128,0.5)" }}>
          {historico.pedidos.filter(h => h.status_pagamento === "pago").length} serviços pagos
        </p>
      </div>

      <div className="flex gap-2 px-5 mb-4">
        {filtros.map(f => (
          <button key={f.v} onClick={() => setFiltro(f.v)}
            className="px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: filtro === f.v ? "white" : "rgba(255,255,255,0.06)",
              color: filtro === f.v ? "#030213" : "rgba(255,255,255,0.4)",
            }}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {estado === "carregando" ? (
          <Loader2 size={22} className="animate-spin text-white/30 mx-auto mt-6" />
        ) : historico.pedidos.length === 0 ? (
          <p className="text-[13px] text-center mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum serviço concluído neste período</p>
        ) : (
          historico.pedidos.map(h => {
            const duracaoTxt = h.duracao_minutos != null
              ? (h.duracao_minutos >= 60 ? `${Math.floor(h.duracao_minutos / 60)}h ${h.duracao_minutos % 60}min` : `${h.duracao_minutos}min`)
              : "—";
            return (
              <div key={h.id} className="rounded-2xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-[15px]">{h.nome_cliente}</p>
                    <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>{h.nome_categoria} · {formatarData(h.data)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold" style={{ color: h.status_pagamento === "pago" ? "#4ade80" : "rgba(255,255,255,0.5)" }}>{R(h.valor_profissional)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${h.status_pagamento === "pago" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {h.status_pagamento === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <span className="flex items-center gap-1"><Clock size={11} />{formatarHora(h.checkin_hora)} → {formatarHora(h.checkout_hora)}</span>
                  <span className="flex items-center gap-1"><Timer size={11} />{duracaoTxt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Tela: Perfil ───────────────────────────────────────────────────────────────

function TelaPerfil({ utilizador, aoSair }) {
  // valores sem acento (formato do banco); rótulo com acento só para exibição
  const dias = [
    { valor: "Domingo", rotulo: "Dom" },
    { valor: "Segunda", rotulo: "Seg" },
    { valor: "Terca", rotulo: "Ter" },
    { valor: "Quarta", rotulo: "Qua" },
    { valor: "Quinta", rotulo: "Qui" },
    { valor: "Sexta", rotulo: "Sex" },
    { valor: "Sabado", rotulo: "Sáb" },
  ];
  const [perfil, setPerfil] = useState(null);
  const [diasAtivos, setDiasAtivos] = useState([]);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      const dados = await getPerfil();
      setPerfil(dados);
      // normaliza acentos de dados antigos ("Terça" -> "Terca") para os
      // botões de dia marcarem corretamente
      const semAcento = (dados.disponibilidade || []).map((d) =>
        String(d).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      );
      setDiasAtivos(semAcento);
    } catch {
      // se falhar, mantém a tela com os dados básicos do login
    }
  }

  useEffect(() => { carregar(); }, []);

  async function toggleDia(dia) {
    const novaLista = diasAtivos.includes(dia) ? diasAtivos.filter(d => d !== dia) : [...diasAtivos, dia];
    setDiasAtivos(novaLista);
    setSalvando(true);
    try {
      await atualizarDisponibilidade(novaLista);
    } catch {
      // reverte em caso de falha
      setDiasAtivos(diasAtivos);
    } finally {
      setSalvando(false);
    }
  }

  const nome = perfil?.nome || utilizador?.nome || "";

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-5" style={{ background: "#030213" }}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-bold text-[22px]">Perfil</h2>
      </div>

      <div className="flex flex-col items-center px-5 pb-5">
        <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.05))", border: "1px solid rgba(255,255,255,0.1)" }}>
          {perfil?.foto ? (
            <img src={perfil.foto} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <User size={36} style={{ color: "rgba(255,255,255,0.6)" }} />
          )}
        </div>
        <h3 className="text-white text-[20px] font-bold mb-0.5">{nome}</h3>
        <p className="text-[14px] mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{perfil?.nome_categoria || ""}</p>
        <div className="flex items-center gap-5 text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          <span className="flex items-center gap-1.5">
            <Star size={13} style={{ color: "#fbbf24" }} />
            {perfil?.avaliacao || "—"}
          </span>
          <span>{perfil?.totalServicos ?? 0} serviços</span>
        </div>
      </div>

      <div className="mx-5 rounded-2xl overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {[["E-mail", utilizador?.email], ["Telefone", perfil?.telefone || "—"]].map(([label, val], i) => (
          <div key={label} className="p-4" style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.06)" } : {}}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            <p className="text-white text-[14px]">{val}</p>
          </div>
        ))}
      </div>

      <div className="mx-5 rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>Disponibilidade</p>
          {salvando && <Loader2 size={12} className="animate-spin text-white/40" />}
        </div>
        <div className="flex gap-2 flex-wrap">
          {dias.map((d) => {
            const ativo = diasAtivos.includes(d.valor);
            return (
              <button key={d.valor} onClick={() => toggleDia(d.valor)}
                className="w-10 h-10 rounded-xl text-[12px] font-semibold transition-all active:scale-90"
                style={{
                  background: ativo ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${ativo ? "rgba(22,163,74,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: ativo ? "#4ade80" : "rgba(255,255,255,0.3)",
                }}>
                {d.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-5">
        <button onClick={aoSair}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-[14px] transition-transform active:scale-[0.97]"
          style={{ background: "rgba(212,24,61,0.1)", border: "1px solid rgba(212,24,61,0.25)", color: "#f87171" }}>
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

// ── Barra de tabs ──────────────────────────────────────────────────────────────

function BarraTabs({ abaAtiva, aoMudar }) {
  const abas = [
    { id: "inicio", Icone: Home, label: "Início" },
    { id: "mapa", Icone: Map, label: "Mapa" },
    { id: "historico", Icone: Clock, label: "Histórico" },
    { id: "perfil", Icone: User, label: "Perfil" },
  ];

  return (
    <div className="flex px-2 py-2" style={{ background: "#06070f", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      {abas.map(({ id, Icone, label }) => {
        const ativo = abaAtiva === id;
        return (
          <button key={id} onClick={() => aoMudar(id)}
            className="flex-1 flex flex-col items-center gap-1 py-1 transition-transform active:scale-90">
            <Icone size={22} style={{ color: ativo ? "white" : "rgba(255,255,255,0.22)" }} />
            <span className="text-[10px] font-semibold" style={{ color: ativo ? "white" : "rgba(255,255,255,0.22)" }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [utilizador, setUtilizador] = useState(() => obterUtilizadorGuardado());
  const [abaAtiva, setAbaAtiva] = useState("inicio");
  const [stack, setStack] = useState([]);
  const [minhaLocalizacao, setMinhaLocalizacao] = useState(null);

  // Ao autenticar, ativa o rastreio de localização (necessário para pedidos
  // próximos e para o check-in) e envia a posição ao servidor periodicamente.
  useEffect(() => {
    if (!utilizador || !navigator.geolocation) return;

    const idObservador = navigator.geolocation.watchPosition(
      (posicao) => {
        const coords = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
        setMinhaLocalizacao(coords);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(idObservador);
  }, [utilizador]);

  // Envia a localização ao backend a cada 30s (não a cada mudança, para
  // poupar bateria e dados) — assim o cálculo de "pedidos próximos" fica
  // sempre atualizado no servidor.
  useEffect(() => {
    if (!utilizador || !minhaLocalizacao) return;
    atualizarLocalizacao(minhaLocalizacao.lat, minhaLocalizacao.lng).catch(() => {});
    const id = setInterval(() => {
      atualizarLocalizacao(minhaLocalizacao.lat, minhaLocalizacao.lng).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [utilizador, !!minhaLocalizacao]);

  function empurrar(tela, params = {}) {
    setStack(prev => [...prev, { tela, params }]);
  }

  function voltar() {
    setStack(prev => prev.slice(0, -1));
  }

  function lidarComCheckin(pedido) {
    empurrar("checkin", { pedido });
  }

  function lidarComConfirmarCheckin(pedido) {
    setStack(prev => {
      const sem = prev.filter(s => s.tela !== "checkin");
      return [...sem, { tela: "emAndamento", params: { pedido, checkinHoraISO: new Date().toISOString() } }];
    });
  }

  function lidarComCheckout(pedido, checkinHoraISO, resultado) {
    empurrar("resumo", { pedido, checkinHoraISO, resultado });
  }

  function lidarComVoltarInicio() {
    setStack([]);
    setAbaAtiva("inicio");
  }

  function lidarComSair() {
    limparSessao();
    setUtilizador(null);
    setStack([]);
    setAbaAtiva("inicio");
  }

  const telaAtual = stack.length > 0 ? stack[stack.length - 1] : null;
  const mostrarTabs = stack.length === 0 && utilizador;

  function renderTela() {
    if (!utilizador) return <TelaLogin aoEntrar={setUtilizador} />;

    if (telaAtual) {
      const { tela, params } = telaAtual;
      if (tela === "detalhe") return (
        <TelaDetalhePedido pedidoId={params.pedidoId} aoVoltar={voltar}
          aoCheckin={lidarComCheckin} minhaLocalizacao={minhaLocalizacao} />
      );
      if (tela === "checkin") return (
        <TelaCheckin pedido={params.pedido} aoVoltar={voltar}
          aoConfirmar={(duracaoAtualizada) => lidarComConfirmarCheckin({ ...params.pedido, duracao_estimada_minutos: duracaoAtualizada })} />
      );
      if (tela === "emAndamento") return (
        <TelaEmAndamento pedido={params.pedido} checkinHoraISO={params.checkinHoraISO}
          aoCheckout={(resultado) => lidarComCheckout(params.pedido, params.checkinHoraISO, resultado)} />
      );
      if (tela === "resumo") return (
        <TelaResumo pedido={params.pedido} checkinHoraISO={params.checkinHoraISO}
          resultadoCheckout={params.resultado} aoVoltar={lidarComVoltarInicio} />
      );
    }

    if (abaAtiva === "inicio") return <TelaInicio utilizador={utilizador} aoAbrirPedido={p => empurrar("detalhe", { pedidoId: p.id })} />;
    if (abaAtiva === "mapa") return <TelaMapa aoAbrirPedido={p => empurrar("detalhe", { pedidoId: p.id })} />;
    if (abaAtiva === "historico") return <TelaHistorico />;
    if (abaAtiva === "perfil") return <TelaPerfil utilizador={utilizador} aoSair={lidarComSair} />;
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#030213" }}>
      <div className="flex-1 overflow-hidden">
        {renderTela()}
      </div>
      {mostrarTabs && <BarraTabs abaAtiva={abaAtiva} aoMudar={setAbaAtiva} />}
    </div>
  );
}
