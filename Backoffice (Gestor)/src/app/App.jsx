import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Calendar, Users, LogOut, Menu, X,
  Eye, EyeOff, MoreVertical, Search,
  Plus, CheckCircle, AlertCircle, RefreshCw,
  Phone, MapPin, Clock, Package, TrendingUp,
  Sun, Moon, Map, Table2, LocateFixed, Navigation,
  ShieldCheck, UserCog, KeyRound, Tag, Trash2, Pencil,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  login, guardarSessao, limparSessao, obterUtilizadorGuardado,
  getDashboard,
  getAgendamentos, criarAgendamento, atribuirAgendamento, cancelarAgendamento,
  getProfissionais, criarProfissional, alterarEstadoProfissional,
  editarProfissional, excluirProfissional,
  getCategorias, criarCategoria, editarCategoria, removerCategoria,
  getGestores, criarGestor, editarGestor, alterarEstadoGestor, resetarSenhaGestor,
} from "./api.js";

// Fix leaflet default marker icons in Vite/webpack
delete (L.Icon.Default.prototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeStatusIcon(status) {
  const color = (STATUS_MAP)[status]?.dot || "#9ca3af";
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.35)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function makePinIcon(color = "#030213") {
  return L.divIcon({
    html: `<div style="position:relative;width:24px;height:24px">
      <div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
    </div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -26],
  });
}

// ─── Types ──────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  pendente:     { label: "Pendente",     bg: "#f3f4f6", color: "#6b7280",  dot: "#9ca3af"  },
  aceite:       { label: "Aceite",       bg: "#eff6ff", color: "#2563eb",  dot: "#3b82f6"  },
  a_caminho:    { label: "A caminho",    bg: "#f5f3ff", color: "#7c3aed",  dot: "#8b5cf6"  },
  em_execucao:  { label: "Em execução",  bg: "#fffbeb", color: "#d97706",  dot: "#f59e0b"  },
  concluido:    { label: "Concluído",    bg: "#f0fdf4", color: "#16a34a",  dot: "#22c55e"  },
  cancelado:    { label: "Cancelado",    bg: "#fff1f2", color: "#be123c",  dot: "#f43f5e"  },
};

const STATUS_DARK = {
  pendente:     { bg: "#1f2937", color: "#9ca3af",  dot: "#6b7280"  },
  aceite:       { bg: "#1e3a5f", color: "#93c5fd",  dot: "#3b82f6"  },
  a_caminho:    { bg: "#2e1f5e", color: "#c4b5fd",  dot: "#8b5cf6"  },
  em_execucao:  { bg: "#3b2700", color: "#fcd34d",  dot: "#f59e0b"  },
  concluido:    { bg: "#052e16", color: "#6ee7b7",  dot: "#22c55e"  },
  cancelado:    { bg: "#4c0519", color: "#fda4af",  dot: "#f43f5e"  },
};

// Converte os campos separados `data` (DATE) e `hora` (TIME) vindos do
// backend numa string amigável para exibir nas tabelas.
function formatarDataHora(agendamento) {
  if (!agendamento.data) return "—";
  const data = new Date(agendamento.data);
  const dataFormatada = data.toLocaleDateString("pt-PT", { timeZone: "UTC" });
  const hora = (agendamento.hora || "").toString().slice(0, 5);
  return hora ? `${dataFormatada} ${hora}` : dataFormatada;
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Nome do dia da semana (em português) a partir de uma data "YYYY-MM-DD"
function diaDaSemana(dataStr) {
  if (!dataStr) return null;
  const data = new Date(`${dataStr.slice(0, 10)}T00:00:00`);
  return DIAS_SEMANA[data.getDay()];
}

// Um profissional está disponível para uma data/hora se:
//  - não tiver marcado nenhuma disponibilidade ainda (assume-se disponível todos os dias), OU
//  - tiver esse dia da semana marcado como disponível
// E também não pode já ter outro agendamento na mesma data+hora.
function profissionalDisponivel(profissional, agendamentos, data, hora, agendamentoIdIgnorar) {
  if (!data) return true; // sem data escolhida ainda, não filtra
  const dia = diaDaSemana(data);
  const disp = profissional.disponibilidade || [];
  const respeitaDisponibilidade = disp.length === 0 || disp.includes(dia);
  if (!respeitaDisponibilidade) return false;

  if (hora) {
    const dataAlvo = data.slice(0, 10);
    const horaAlvo = hora.slice(0, 5);
    const temConflito = agendamentos.some(a =>
      a.id !== agendamentoIdIgnorar &&
      a.profissional_id === profissional.id &&
      a.status !== "cancelado" &&
      (a.data || "").toString().slice(0, 10) === dataAlvo &&
      (a.hora || "").toString().slice(0, 5) === horaAlvo
    );
    if (temConflito) return false;
  }
  return true;
}

// Converte coordenadas num endereço legível (OpenStreetMap Nominatim),
// usado para preencher o campo de endereço automaticamente quando o
// gestor escolhe um ponto no mapa.
async function obterEnderecoPorCoordenadas(lat, lng) {
  try {
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const dados = await resposta.json();
    return dados.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// Lê um ficheiro de imagem escolhido pelo utilizador, redimensiona para no
// máximo 400x400px e devolve como base64 (JPEG comprimido) — assim a foto
// cabe tranquilamente no banco e não pesa a requisição.
function redimensionarImagem(ficheiro, tamanhoMaximo = 400, qualidade = 0.8) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error("Ficheiro de imagem inválido"));
      imagem.onload = () => {
        let { width, height } = imagem;
        if (width > height && width > tamanhoMaximo) {
          height = Math.round((height * tamanhoMaximo) / width);
          width = tamanhoMaximo;
        } else if (height > tamanhoMaximo) {
          width = Math.round((width * tamanhoMaximo) / height);
          height = tamanhoMaximo;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(imagem, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(ficheiro);
  });
}

// ─── Utility Components ───────────────────────────────────────────────────────

function Avatar({ nome, foto, size = 36 }) {
  const initials = nome ? nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() : "?";
  const colors = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626"];
  const bg = colors[nome ? nome.charCodeAt(0) % colors.length : 0];
  if (foto) {
    return <img src={foto} alt={nome} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Badge({ status, escuro }) {
  const cfg = escuro ? { ...STATUS_MAP[status], ...STATUS_DARK[status] } : STATUS_MAP[status];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99, fontSize: 12, fontWeight: 500,
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}


function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(3,2,19,0.45)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div
        style={{
          background: "var(--card)", color: "var(--card-foreground)",
          borderRadius: "var(--radius)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
        {footer && (
          <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton({ width = "100%", height = 16, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: "linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

function EmptyState({ message = "Nenhum dado encontrado" }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--muted-foreground)" }}>
      <Package size={40} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--muted-foreground)" }}>
      <AlertCircle size={40} style={{ margin: "0 auto 12px", color: "#d4183d", opacity: 0.7 }} />
      <p style={{ margin: "0 0 16px", fontSize: 14 }}>Falha ao carregar os dados.</p>
      <button onClick={onRetry} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: "var(--radius)",
        background: "var(--primary)", color: "var(--primary-foreground)",
        border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
      }}>
        <RefreshCw size={14} /> Tentar novamente
      </button>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, erro, suffix, autoFocus, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          style={{
            width: "100%", padding: suffix ? "9px 36px 9px 12px" : "9px 12px",
            borderRadius: "var(--radius)",
            border: `1.5px solid ${erro ? "#d4183d" : "var(--border)"}`,
            background: disabled ? "var(--muted)" : "var(--input-background)",
            color: disabled ? "var(--muted-foreground)" : "var(--foreground)",
            fontSize: 14, outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s", cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {suffix && (
          <button type="button" onClick={suffix.onClick} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2,
          }}>
            {suffix.icon}
          </button>
        )}
      </div>
      {erro && <span style={{ fontSize: 12, color: "#d4183d" }}>{erro}</span>}
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%", padding: "9px 12px",
          borderRadius: "var(--radius)",
          border: "1.5px solid var(--border)",
          background: "var(--input-background)", color: "var(--foreground)",
          fontSize: 14, outline: "none", appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23717182' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

function Btn({ variant = "primary", size = "md", children, onClick, type = "button", disabled, style = {} }) {
  const sizes = { sm: "6px 12px", md: "9px 18px", lg: "12px 24px" };
  const fontSize = { sm: 12, md: 14, lg: 15 };
  const variants = {
    primary:     { background: "var(--primary)", color: "var(--primary-foreground)", border: "1.5px solid var(--primary)" },
    secondary:   { background: "var(--secondary)", color: "var(--foreground)", border: "1.5px solid var(--border)" },
    destructive: { background: "#d4183d", color: "#fff", border: "1.5px solid #d4183d" },
    ghost:       { background: "transparent", color: "var(--foreground)", border: "1.5px solid var(--border)" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: sizes[size], borderRadius: "var(--radius)",
        fontSize: fontSize[size], fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1, transition: "opacity 0.15s",
        fontFamily: "inherit",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Map helpers ─────────────────────────────────────────────────────────────

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// O Leaflet às vezes mede o tamanho do mapa antes do modal terminar de
// abrir (fica 0x0) e o mapa fica em branco. Isto força um recálculo
// logo depois de montar.
function CorrigirTamanhoDoMapa() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

// Map view for agendamentos
function MapView({ agendamentos, onAtribuir, onCancelar, escuro }) {
  const [selecionado, definirSelecionado] = useState(null);
  const [voarPara, definirVoarPara] = useState(null);

  const comCoordenadas = agendamentos.filter((a) => a.latitude && a.longitude);

  return (
    <div style={{ display: "flex", gap: 0, height: 560, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
      {/* Sidebar list */}
      <div style={{
        width: 300, flexShrink: 0, overflowY: "auto",
        background: "var(--card)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {comCoordenadas.length} localizações
        </div>
        {comCoordenadas.map((a) => {
          const st = STATUS_MAP[a.status];
          const isSelected = selecionado === a.id;
          return (
            <button key={a.id} onClick={() => { definirSelecionado(a.id); definirVoarPara([a.latitude, a.longitude]); }}
              style={{
                width: "100%", textAlign: "left", padding: "11px 14px",
                background: isSelected ? "var(--accent)" : "transparent",
                border: "none", borderBottom: "1px solid var(--border)",
                cursor: "pointer", fontFamily: "inherit",
                borderLeft: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)" }}>{a.nome_cliente}</div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, flexShrink: 0,
                  background: st?.bg, color: st?.color,
                }}>{st?.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={10} /> {a.endereco.split("—")[0].trim()}
              </div>
              {a.nome_categoria && (
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{a.nome_categoria}</div>
              )}
            </button>
          );
        })}
        {comCoordenadas.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--muted-foreground)" }}>
            Nenhum agendamento com localização.
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[-18.5, 35.0]}
          zoom={5}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FlyTo coords={voarPara} />
          <CorrigirTamanhoDoMapa />
          {comCoordenadas.map((a) => (
            <Marker key={a.id} position={[a.latitude, a.longitude]} icon={makeStatusIcon(a.status)}
              eventHandlers={{ click: () => definirSelecionado(a.id) }}>
              <Popup>
                <div style={{ minWidth: 200, fontFamily: "inherit", fontSize: 13, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{a.nome_cliente}</div>
                  <div style={{ color: "#717182", marginBottom: 4 }}>{a.telefone}</div>
                  <div style={{ marginBottom: 2 }}><strong>Data:</strong> {formatarDataHora(a)}</div>
                  {a.nome_categoria && <div style={{ marginBottom: 2 }}><strong>Serviço:</strong> {a.nome_categoria}</div>}
                  <div style={{ marginBottom: 6 }}><strong>Profissional:</strong> {a.nome_profissional || "Não atribuído"}</div>
                  <div style={{ marginBottom: 10, color: "#717182", fontSize: 12 }}>{a.endereco}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(a.status === "pendente" || !a.nome_profissional) && !["cancelado", "concluido"].includes(a.status) && (
                      <button onClick={() => onAtribuir(a)} style={{
                        padding: "5px 11px", borderRadius: 6, border: "1.5px solid #030213",
                        background: "#030213", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      }}>Atribuir</button>
                    )}
                    {!["cancelado", "concluido"].includes(a.status) && (
                      <button onClick={() => onCancelar(a)} style={{
                        padding: "5px 11px", borderRadius: 6, border: "1.5px solid rgba(212,24,61,0.3)",
                        background: "transparent", color: "#d4183d", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      }}>Cancelar</button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 12, right: 12, zIndex: 1000,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "10px 12px",
          display: "flex", flexDirection: "column", gap: 5, fontSize: 11,
        }}>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--foreground)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: v.dot, flexShrink: 0 }} />
              {v.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Location picker for forms
function LocationPicker({ value, onChange, onEnderecoDetectado }) {
  const [carregando, definirCarregando] = useState(false);
  const [erro, definirErro] = useState("");
  const [obtendoEndereco, definirObtendoEndereco] = useState(false);

  // Sempre que o pin muda (clique, arraste, ou "usar localização actual"),
  // busca o endereço correspondente e preenche o campo automaticamente.
  async function moverPara(lat, lng) {
    onChange({ lat, lng });
    if (!onEnderecoDetectado) return;
    definirObtendoEndereco(true);
    const endereco = await obterEnderecoPorCoordenadas(lat, lng);
    onEnderecoDetectado(endereco);
    definirObtendoEndereco(false);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { definirErro("Geolocalização não suportada neste navegador."); return; }
    definirCarregando(true);
    definirErro("");
    navigator.geolocation.getCurrentPosition(
      pos => {
        moverPara(pos.coords.latitude, pos.coords.longitude);
        definirCarregando(false);
      },
      () => {
        definirErro("Não foi possível obter a localização. Verifique as permissões do navegador.");
        definirCarregando(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  const mapCenter = value ? [value.lat, value.lng] : [-25.9692, 32.5732];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Localização no mapa</label>
        {obtendoEndereco && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>A obter endereço...</span>
        )}
        <button type="button" onClick={useCurrentLocation} disabled={carregando}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: "var(--radius)",
            border: "1.5px solid var(--border)", background: carregando ? "var(--muted)" : "var(--card)",
            color: carregando ? "var(--muted-foreground)" : "var(--foreground)",
            fontSize: 12, fontWeight: 500, cursor: carregando ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}>
          {carregando
            ? <><RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} /> A obter...</>
            : <><LocateFixed size={12} /> Usar localização actual</>
          }
        </button>
      </div>

      {/* Map */}
      <div style={{ height: 220, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer center={mapCenter} zoom={value ? 15 : 12} style={{ width: "100%", height: "100%" }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CorrigirTamanhoDoMapa />
          {value && (
            <>
              <FlyTo coords={[value.lat, value.lng]} />
              <Marker position={[value.lat, value.lng]} icon={makePinIcon("#030213")} />
            </>
          )}
          <MapClickHandler onPick={(lat, lng) => moverPara(lat, lng)} />
        </MapContainer>
      </div>

      {value ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "monospace" }}>
            <Navigation size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </span>
          <button type="button" onClick={() => onChange(null)}
            style={{ fontSize: 11, color: "#d4183d", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Remover pin
          </button>
        </div>
      ) : (
        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
          Clique no mapa para marcar a localização, ou use o botão acima.
        </span>
      )}

      {erro && <span style={{ fontSize: 12, color: "#d4183d" }}>{erro}</span>}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, definirMostrarSenha] = useState(false);
  const [carregando, definirCarregando] = useState(false);
  const [erro, definirErro] = useState("");

  async function lidarComEnvio(e) {
    e.preventDefault();
    definirErro("");
    if (!email || !senha) { definirErro("Preencha o e-mail e a palavra-passe."); return; }
    definirCarregando(true);
    try {
      const dados = await login(email, senha);
      guardarSessao(dados.token, dados.usuario);
      onLogin(dados.usuario);
    } catch (falha) {
      definirErro(falha.message || "Credenciais inválidas. Verifique o seu e-mail e palavra-passe.");
    } finally {
      definirCarregando(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--background)", padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="ServCasa" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 12 }} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--foreground)" }}>ServCasa</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>Painel do Gestor — Moçambique</p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--card)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", padding: 28,
          boxShadow: "0 2px 16px rgba(3,2,19,0.06)",
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 600 }}>Iniciar sessão</h2>
          <form onSubmit={lidarComEnvio} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="gerente@servcasa.co.mz" autoFocus />
            <Input label="Palavra-passe" type={mostrarSenha ? "text" : "password"} value={senha}
              onChange={e => setSenha(e.target.value)} placeholder="••••••••"
              suffix={{ icon: mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />, onClick: () => definirMostrarSenha(v => !v) }} />

            {erro && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
                borderRadius: "var(--radius)", background: "rgba(212,24,61,0.07)",
                border: "1px solid rgba(212,24,61,0.2)",
              }}>
                <AlertCircle size={15} color="#d4183d" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#d4183d" }}>{erro}</span>
              </div>
            )}

            <Btn type="submit" variant="primary" size="lg" disabled={carregando} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {carregando ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
                    <path d="M12 3a9 9 0 019 9" />
                  </svg>
                  A autenticar...
                </span>
              ) : "Entrar"}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

function DashboardScreen({ escuro }) {
  const [estado, definirEstado] = useState("carregando");
  const [erro, definirErro] = useState("");
  const [dashboard, definirDashboard] = useState(null);
  const [agendamentosRecentes, definirAgendamentosRecentes] = useState([]);

  async function carregarDados() {
    definirEstado("carregando");
    definirErro("");
    try {
      const [resumo, listaAgendamentos] = await Promise.all([
        getDashboard(),
        getAgendamentos(),
      ]);
      definirDashboard(resumo);
      definirAgendamentosRecentes(listaAgendamentos.agendamentos.slice(0, 5));
      definirEstado("carregado");
    } catch (falha) {
      definirErro(falha.message);
      definirEstado("erro");
    }
  }

  useEffect(() => { carregarDados(); }, []);

  if (estado === "carregando") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 20 }}>
            <Skeleton width={80} height={12} />
            <Skeleton width={48} height={28} style={{ marginTop: 10 }} />
            <Skeleton width={60} height={11} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 24, height: 260 }}>
        <Skeleton width={120} height={14} />
        <Skeleton width="100%" height={200} style={{ marginTop: 16 }} />
      </div>
    </div>
  );

  if (estado === "erro") return <ErrorState onRetry={carregarDados} />;

  const kpis = [
    { label: "Pendentes",     value: dashboard.pendentes,         icon: Clock,      color: "#f59e0b", bg: "#fffbeb" },
    { label: "Em execução",   value: dashboard.emExecucao,        icon: TrendingUp, color: "#2563eb", bg: "#eff6ff" },
    { label: "Concluídos",    value: dashboard.concluidos,        icon: CheckCircle,color: "#16a34a", bg: "#f0fdf4" },
    { label: "Profissionais", value: dashboard.totalProfissionais,icon: Users,      color: "#7c3aed", bg: "#f5f3ff" },
  ];

  const pieData = (dashboard.porStatus || [])
    .filter(linha => linha.status && STATUS_MAP[linha.status])
    .map(linha => ({
      name: STATUS_MAP[linha.status].label,
      value: linha.total,
      color: STATUS_MAP[linha.status].dot,
    }));

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const barData = (dashboard.porDia || []).map(linha => ({
    dia: diasSemana[new Date(linha.dia).getDay()],
    agendamentos: linha.total,
  }));

  const totalAgendamentos = pieData.reduce((soma, p) => soma + Number(p.value), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{
              background: "var(--card)", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", padding: 20,
              boxShadow: "0 1px 4px rgba(3,2,19,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>{k.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: escuro ? "rgba(255,255,255,0.08)" : k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} color={k.color} />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--foreground)", lineHeight: 1 }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Bar chart */}
        <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Agendamentos nos últimos 7 dias</h3>
          {barData.length === 0 ? <EmptyState message="Sem agendamentos recentes para mostrar" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "var(--accent)" }}
                />
                <Bar dataKey="agendamentos" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 24 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Por status</h3>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted-foreground)" }}>Total: {totalAgendamentos} agendamentos</p>
          {pieData.length === 0 ? <EmptyState message="Sem dados ainda" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry) => <Cell key={`pie-${entry.name}`} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent agendamentos */}
      <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Agendamentos recentes</h3>
        </div>
        {agendamentosRecentes.length === 0 ? <EmptyState message="Nenhum agendamento ainda" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Cliente", "Profissional", "Data", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agendamentosRecentes.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 20px", fontWeight: 500 }}>{a.nome_cliente}</td>
                    <td style={{ padding: "12px 20px", color: a.nome_profissional ? "var(--foreground)" : "var(--muted-foreground)" }}>
                      {a.nome_profissional || "Não atribuído"}
                    </td>
                    <td style={{ padding: "12px 20px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{formatarDataHora(a)}</td>
                    <td style={{ padding: "12px 20px" }}><Badge status={a.status} escuro={escuro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agendamentos Screen ───────────────────────────────────────────────────────

function AgendamentosScreen({ escuro }) {
  const [filtroStatus, definirFiltroStatus] = useState("todos");
  const [filtroCategoria, definirFiltroCategoria] = useState("");
  const [filtroAtribuicao, definirFiltroAtribuicao] = useState("todos");
  const [busca, definirBusca] = useState("");
  const [estado, definirEstado] = useState("carregando");
  const [erroCarregamento, definirErroCarregamento] = useState("");
  const [modalAtribuir, definirModalAtribuir] = useState(null);
  const [profissionalSelecionado, definirProfissionalSelecionado] = useState("");
  const [atribuindo, definirAtribuindo] = useState(false);
  const [modalCancelar, definirModalCancelar] = useState(null);
  const [motivoCancelamento, definirMotivoCancelamento] = useState("");
  const [cancelando, definirCancelando] = useState(false);
  const [modalNovo, definirModalNovo] = useState(false);
  const [salvando, definirSalvando] = useState(false);
  const [formularioNovo, definirFormularioNovo] = useState({
    nome_cliente: "", telefone: "", endereco: "", categoria_id: "", data: "", hora: "", profissional_id: "",
  });
  const [coordenadasNovo, definirCoordenadasNovo] = useState(null);
  const [erroNovo, definirErroNovo] = useState("");
  const [modoVisualizacao, definirModoVisualizacao] = useState("tabela");
  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionaisAtivos, setProfissionaisAtivos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  async function carregarAgendamentos() {
    definirEstado("carregando");
    definirErroCarregamento("");
    try {
      const [respostaAgendamentos, respostaProfissionais, respostaCategorias] = await Promise.all([
        getAgendamentos(),
        getProfissionais(),
        getCategorias(),
      ]);
      setAgendamentos(respostaAgendamentos.agendamentos);
      setProfissionaisAtivos(respostaProfissionais.profissionais.filter(p => p.ativo));
      setCategorias(respostaCategorias);
      definirEstado("carregado");
    } catch (falha) {
      definirErroCarregamento(falha.message);
      definirEstado("erro");
    }
  }

  useEffect(() => { carregarAgendamentos(); }, []);

  const statusTabs = [
    { key: "todos",       label: "Todos"        },
    { key: "pendente",    label: "Pendente"     },
    { key: "aceite",      label: "Aceite"       },
    { key: "a_caminho",   label: "A caminho"    },
    { key: "em_execucao", label: "Em execução"  },
    { key: "concluido",   label: "Concluído"    },
    { key: "cancelado",   label: "Cancelado"    },
  ];

  const categoriasUsadas = ["", ...Array.from(new Set(agendamentos.map(a => a.nome_categoria).filter(Boolean)))];

  const filtered = agendamentos.filter(a => {
    const okStatus     = filtroStatus === "todos" || a.status === filtroStatus;
    const okCategoria  = !filtroCategoria || a.nome_categoria === filtroCategoria;
    const okAtribuicao = filtroAtribuicao === "todos"
      || (filtroAtribuicao === "atribuido"     &&  a.nome_profissional)
      || (filtroAtribuicao === "nao_atribuido" && !a.nome_profissional);
    const q = busca.toLowerCase();
    const okSearch = !q
      || (a.nome_cliente || "").toLowerCase().includes(q)
      || (a.telefone || "").toLowerCase().includes(q)
      || (a.nome_profissional || "").toLowerCase().includes(q)
      || (a.endereco || "").toLowerCase().includes(q);
    return okStatus && okCategoria && okAtribuicao && okSearch;
  });

  const totalFiltrado = filtered.length;
  const temFiltrosAtivos = filtroStatus !== "todos" || filtroCategoria || filtroAtribuicao !== "todos" || busca;

  async function lidarComAtribuir() {
    if (!profissionalSelecionado) return;
    definirAtribuindo(true);
    try {
      await atribuirAgendamento(modalAtribuir.id, profissionalSelecionado);
      await carregarAgendamentos();
      definirModalAtribuir(null);
      definirProfissionalSelecionado("");
    } catch (falha) {
      alert(falha.message);
    } finally {
      definirAtribuindo(false);
    }
  }

  async function lidarComCancelar() {
    if (!modalCancelar) return;
    definirCancelando(true);
    try {
      await cancelarAgendamento(modalCancelar.id, motivoCancelamento || "Cancelado pelo gestor");
      await carregarAgendamentos();
      definirModalCancelar(null);
      definirMotivoCancelamento("");
    } catch (falha) {
      alert(falha.message);
    } finally {
      definirCancelando(false);
    }
  }

  async function lidarComNovoAgendamento(e) {
    e.preventDefault();
    if (!formularioNovo.nome_cliente || !formularioNovo.telefone || !formularioNovo.endereco || !formularioNovo.categoria_id || !formularioNovo.data || !formularioNovo.hora) {
      definirErroNovo("Preencha todos os campos obrigatórios (*).");
      return;
    }
    definirSalvando(true);
    try {
      await criarAgendamento({
        nome_cliente: formularioNovo.nome_cliente,
        telefone: formularioNovo.telefone,
        endereco: formularioNovo.endereco,
        categoria_id: formularioNovo.categoria_id,
        data: formularioNovo.data,
        hora: formularioNovo.hora,
        profissional_id: formularioNovo.profissional_id || null,
        latitude: coordenadasNovo?.lat ?? null,
        longitude: coordenadasNovo?.lng ?? null,
      });
      await carregarAgendamentos();
      definirModalNovo(false);
      definirFormularioNovo({ nome_cliente: "", telefone: "", endereco: "", categoria_id: "", data: "", hora: "", profissional_id: "" });
      definirCoordenadasNovo(null);
      definirErroNovo("");
    } catch (falha) {
      definirErroNovo(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  function nf(field) { return e => definirFormularioNovo(v => ({ ...v, [field]: e.target.value })); }

  function limparFiltros() {
    definirFiltroStatus("todos");
    definirFiltroCategoria("");
    definirFiltroAtribuicao("todos");
    definirBusca("");
  }

  const inputStyle = {
    padding: "7px 11px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)",
    background: "var(--card)", color: "var(--foreground)", fontSize: 13, outline: "none",
    fontFamily: "inherit",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23717182' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
    paddingRight: 28, appearance: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Agendamentos</h2>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {totalFiltrado} resultado{totalFiltrado !== 1 ? "s" : ""}
            {temFiltrosAtivos && " filtrados"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Toggle tabela / mapa */}
          <div style={{ display: "flex", borderRadius: "var(--radius)", border: "1.5px solid var(--border)", overflow: "hidden" }}>
            {([["tabela", Table2, "Tabela"], ["mapa", Map, "Mapa"]]).map(([mode, Icon, label]) => (
              <button key={mode} onClick={() => definirModoVisualizacao(mode)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 13px",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: modoVisualizacao === mode ? 600 : 400,
                background: modoVisualizacao === mode ? "var(--primary)" : "var(--card)",
                color: modoVisualizacao === mode ? "var(--primary-foreground)" : "var(--muted-foreground)",
                transition: "all 0.15s", fontFamily: "inherit",
              }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <Btn variant="primary" onClick={() => { definirModalNovo(true); definirErroNovo(""); }}>
            <Plus size={15} /> Nova Visita
          </Btn>
        </div>
      </div>

      {/* Barra de filtros */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {/* Linha 1: pesquisa por texto */}
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
          <input
            value={busca} onChange={e => definirBusca(e.target.value)}
            placeholder="Pesquisar por cliente, telefone, profissional ou endereço..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px 9px 34px", borderRadius: "var(--radius)",
              border: "1.5px solid var(--border)", background: "var(--input-background)",
              color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Linha 2: selects + limpar */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Categoria */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoria</span>
            <select value={filtroCategoria} onChange={e => definirFiltroCategoria(e.target.value)} style={inputStyle}>
              <option value="">Todas as categorias</option>
              {categoriasUsadas.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Atribuição */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Atribuição</span>
            <select value={filtroAtribuicao} onChange={e => definirFiltroAtribuicao(e.target.value)} style={inputStyle}>
              <option value="todos">Todos</option>
              <option value="atribuido">Com profissional</option>
              <option value="nao_atribuido">Sem profissional</option>
            </select>
          </div>

          {/* Limpar */}
          {temFiltrosAtivos && (
            <button onClick={limparFiltros} style={{
              marginTop: 18, padding: "7px 13px", borderRadius: "var(--radius)",
              border: "1.5px solid var(--border)", background: "transparent",
              color: "var(--muted-foreground)", fontSize: 12, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>

        {/* Linha 3: tabs de status */}
        <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: "var(--radius)", background: "var(--muted)", width: "fit-content", flexWrap: "wrap" }}>
          {statusTabs.map(t => {
            const count = t.key === "todos" ? agendamentos.length : agendamentos.filter(a => a.status === t.key).length;
            return (
              <button key={t.key} onClick={() => definirFiltroStatus(t.key)} style={{
                padding: "5px 11px", borderRadius: "calc(var(--radius) - 2px)",
                border: "none", cursor: "pointer", fontSize: 12,
                fontWeight: filtroStatus === t.key ? 600 : 400,
                background: filtroStatus === t.key ? "var(--card)" : "transparent",
                color: filtroStatus === t.key ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: filtroStatus === t.key ? "0 1px 3px rgba(3,2,19,0.08)" : "none",
                transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                {t.label}
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 99,
                  background: filtroStatus === t.key ? "var(--primary)" : "var(--border)",
                  color: filtroStatus === t.key ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map view */}
      {modoVisualizacao === "mapa" && (
        <MapView
          agendamentos={filtered}
          escuro={escuro}
          onAtribuir={(a) => { definirModalAtribuir(a); definirProfissionalSelecionado(""); }}
          onCancelar={(a) => { definirModalCancelar(a); definirMotivoCancelamento(""); }}
        />
      )}

      {/* Table */}
      {modoVisualizacao === "tabela" && <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
        {estado === "carregando" ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} height={44} />)}
          </div>
        ) : estado === "erro" ? (
          <ErrorState onRetry={carregarAgendamentos} />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhum agendamento encontrado para este filtro." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--secondary)" }}>
                  {["Cliente", "Telefone", "Profissional", "Data/Hora", "Endereço", "Status", "Acções"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", whiteSpace: "nowrap", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px", fontWeight: 500, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar nome={a.nome_cliente} size={28} />
                        {a.nome_cliente}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Phone size={12} /> {a.telefone}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      {a.nome_profissional ? (
                        <span style={{ fontWeight: 500 }}>{a.nome_profissional}</span>
                      ) : (
                        <span style={{
                          fontSize: 12, padding: "2px 8px", borderRadius: 99,
                          background: escuro ? "#1f2937" : "#f3f4f6",
                          color: "var(--muted-foreground)",
                        }}>Não atribuído</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={12} /> {formatarDataHora(a)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-foreground)", maxWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 5, overflow: "hidden" }}>
                        <MapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.endereco}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <Badge status={a.status} escuro={escuro} />
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {(a.status === "pendente" || (a.status === "aceite" && !a.nome_profissional)) && (
                          <Btn variant="ghost" size="sm" onClick={() => { definirModalAtribuir(a); definirProfissionalSelecionado(""); }}>
                            Atribuir
                          </Btn>
                        )}
                        {!["cancelado", "concluido"].includes(a.status) && (
                          <Btn variant="ghost" size="sm"
                            style={{ color: "#d4183d", borderColor: "rgba(212,24,61,0.25)" }}
                            onClick={() => { definirModalCancelar(a); definirMotivoCancelamento(""); }}
                          >
                            Cancelar
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* Assign modal */}
      <Modal
        open={!!modalAtribuir}
        onClose={() => definirModalAtribuir(null)}
        title="Atribuir profissional"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalAtribuir(null)}>Cancelar</Btn>
          <Btn variant="primary" disabled={!profissionalSelecionado || atribuindo} onClick={lidarComAtribuir}>
            {atribuindo ? "Confirmando..." : "Confirmar atribuição"}
          </Btn>
        </>}
      >
        {modalAtribuir && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary */}
            <div style={{ padding: 14, borderRadius: "var(--radius)", background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 13 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div><strong>Cliente:</strong> {modalAtribuir.nome_cliente}</div>
                <div><strong>Telefone:</strong> {modalAtribuir.telefone}</div>
                <div><strong>Categoria:</strong> {modalAtribuir.nome_categoria || "—"}</div>
                <div><strong>Data:</strong> {formatarDataHora(modalAtribuir)}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <strong>Endereço:</strong> {modalAtribuir.endereco}
                </div>
              </div>
            </div>

            {/* Select professional */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Selecionar profissional</label>
              <select
                value={profissionalSelecionado}
                onChange={e => definirProfissionalSelecionado(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px",
                  borderRadius: "var(--radius)", border: "1.5px solid var(--border)",
                  background: "var(--input-background)", color: "var(--foreground)",
                  fontSize: 14, outline: "none", fontFamily: "inherit",
                }}
              >
                <option value="">Escolha um profissional...</option>
                {profissionaisAtivos
                  .filter(p => !modalAtribuir.categoria_id || p.categoria_id === modalAtribuir.categoria_id)
                  .filter(p => profissionalDisponivel(p, agendamentos, modalAtribuir.data, modalAtribuir.hora, modalAtribuir.id))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — {p.nome_categoria} (MT {Number(p.preco_por_hora || 0).toLocaleString("pt-MZ")}/h)</option>
                  ))}
              </select>
            </div>
            {modalAtribuir.categoria_id && profissionaisAtivos
              .filter(p => p.categoria_id === modalAtribuir.categoria_id)
              .filter(p => profissionalDisponivel(p, agendamentos, modalAtribuir.data, modalAtribuir.hora, modalAtribuir.id))
              .length === 0 && (
              <p style={{ fontSize: 12, color: "var(--destructive)", margin: 0 }}>
                Nenhum profissional da categoria "{modalAtribuir.nome_categoria}" está disponível nesse dia/hora (ou já tem outro compromisso).
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal cancelar */}
      <Modal
        open={!!modalCancelar}
        onClose={() => definirModalCancelar(null)}
        title="Cancelar agendamento"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalCancelar(null)}>Voltar</Btn>
          <Btn variant="destructive" disabled={cancelando} onClick={lidarComCancelar}>
            {cancelando ? "A cancelar..." : "Confirmar cancelamento"}
          </Btn>
        </>}
      >
        {modalCancelar && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              padding: 13, borderRadius: "var(--radius)",
              background: "rgba(212,24,61,0.06)", border: "1px solid rgba(212,24,61,0.18)",
              fontSize: 13, display: "flex", flexDirection: "column", gap: 5,
            }}>
              <div><strong>Cliente:</strong> {modalCancelar.nome_cliente}</div>
              <div><strong>Telefone:</strong> {modalCancelar.telefone}</div>
              <div><strong>Data:</strong> {formatarDataHora(modalCancelar)}</div>
              <div><strong>Endereço:</strong> {modalCancelar.endereco}</div>
              {modalCancelar.nome_profissional && <div><strong>Profissional:</strong> {modalCancelar.nome_profissional}</div>}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
              Esta acção não pode ser desfeita. O agendamento passará para o estado <strong>Cancelado</strong>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Motivo do cancelamento (opcional)</label>
              <textarea
                value={motivoCancelamento}
                onChange={e => definirMotivoCancelamento(e.target.value)}
                placeholder="ex: Cliente reagendou, serviço não aprovado, indisponibilidade..."
                rows={3}
                style={{
                  padding: "9px 12px", borderRadius: "var(--radius)",
                  border: "1.5px solid var(--border)", background: "var(--input-background)",
                  color: "var(--foreground)", fontSize: 13, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal nova visita */}
      <Modal
        open={modalNovo}
        onClose={() => { definirModalNovo(false); definirErroNovo(""); }}
        title="Agendar nova visita"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalNovo(false)}>Cancelar</Btn>
          <Btn variant="primary" disabled={salvando} onClick={lidarComNovoAgendamento}>
            {salvando ? "A agendar..." : "Confirmar agendamento"}
          </Btn>
        </>}
      >
        <form onSubmit={lidarComNovoAgendamento} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {/* Cliente */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: -4 }}>
            Dados do cliente
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Nome do cliente *" value={formularioNovo.nome_cliente} onChange={nf("nome_cliente")} placeholder="Nome completo" />
            <Input label="Telefone *" type="tel" value={formularioNovo.telefone} onChange={nf("telefone")} placeholder="+258 8X XXX XXXX" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Input label="Endereço / Localização *" value={formularioNovo.endereco} onChange={nf("endereco")} placeholder="Bairro, rua, número — Cidade" />
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Preenchido automaticamente ao escolher um ponto no mapa abaixo — pode ajustar manualmente.</span>
          </div>

          {/* Serviço */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: -4, marginTop: 4 }}>
            Serviço
          </div>
          <Select
            label="Categoria do serviço *"
            value={formularioNovo.categoria_id}
            onChange={(e) => definirFormularioNovo(v => ({ ...v, categoria_id: e.target.value, profissional_id: "" }))}
            options={categorias.map(c => ({ value: c.id, label: c.nome }))}
            placeholder="Selecione a categoria..."
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Data *" type="date" value={formularioNovo.data} onChange={nf("data")} />
            <Input label="Hora *" type="time" value={formularioNovo.hora} onChange={nf("hora")} />
          </div>

          {/* Profissional */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: -4, marginTop: 4 }}>
            Profissional (opcional)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Atribuir profissional</label>
            <select
              value={formularioNovo.profissional_id}
              onChange={nf("profissional_id")}
              style={{
                width: "100%", padding: "9px 28px 9px 12px",
                borderRadius: "var(--radius)", border: "1.5px solid var(--border)",
                background: "var(--input-background)", color: "var(--foreground)",
                fontSize: 13, outline: "none", fontFamily: "inherit", appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23717182' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              }}
            >
              <option value="">Deixar sem atribuição (ficará Pendente)</option>
              {profissionaisAtivos
                .filter(p => !formularioNovo.categoria_id || p.categoria_id === formularioNovo.categoria_id)
                .filter(p => profissionalDisponivel(p, agendamentos, formularioNovo.data, formularioNovo.hora))
                .map(p => (
                  <option key={p.id} value={p.id}>{p.nome} — {p.nome_categoria} · MT {Number(p.preco_por_hora || 0).toLocaleString("pt-MZ")}/h</option>
                ))}
            </select>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {formularioNovo.data
                ? "Mostrando apenas profissionais disponíveis nesse dia/hora."
                : formularioNovo.categoria_id
                ? "Mostrando apenas profissionais da categoria escolhida acima."
                : "Escolha a categoria do serviço para filtrar os profissionais disponíveis."}
            </span>
          </div>

          {/* Geolocalização */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>
            Geolocalização
          </div>
          <LocationPicker
            value={coordenadasNovo}
            onChange={definirCoordenadasNovo}
            onEnderecoDetectado={(endereco) => definirFormularioNovo((v) => ({ ...v, endereco }))}
          />

          {erroNovo && (
            <div style={{ display: "flex", gap: 8, padding: "9px 12px", borderRadius: "var(--radius)", background: "rgba(212,24,61,0.07)", border: "1px solid rgba(212,24,61,0.2)", fontSize: 13, color: "#d4183d" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {erroNovo}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

// ─── Profissionais Screen ──────────────────────────────────────────────────────

function ProfissionaisScreen({ escuro }) {
  const [estado, definirEstado] = useState("carregando");
  const [erroCarregamento, definirErroCarregamento] = useState("");
  const [busca, definirBusca] = useState("");
  const [filtroCategoria, definirFiltroCategoria] = useState("");
  const [filtroEstado, definirFiltroEstado] = useState("todos"); // todos | ativo | inativo
  const [profissionais, setProfissionais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalCadastro, definirModalCadastro] = useState(false);
  const [modalConfirmacao, definirModalConfirmacao] = useState(null);
  const [menuAberto, definirMenuAberto] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "", categoria_id: "", preco_por_hora: "", experiencia: "", descricao: "", foto: "", competencias: "", disponibilidade: [] });
  const [erroFormulario, definirErroFormulario] = useState("");
  const [processandoFoto, definirProcessandoFoto] = useState(false);

  async function aoEscolherFoto(evento) {
    const ficheiro = evento.target.files?.[0];
    if (!ficheiro) return;
    if (!ficheiro.type.startsWith("image/")) {
      definirErroFormulario("Selecione um ficheiro de imagem válido (JPG, PNG...).");
      return;
    }
    definirProcessandoFoto(true);
    try {
      const base64 = await redimensionarImagem(ficheiro);
      setForm((v) => ({ ...v, foto: base64 }));
      definirErroFormulario("");
    } catch (falha) {
      definirErroFormulario(falha.message);
    } finally {
      definirProcessandoFoto(false);
    }
  }

  async function carregarProfissionais() {
    definirEstado("carregando");
    definirErroCarregamento("");
    try {
      const [respostaProfissionais, respostaCategorias] = await Promise.all([
        getProfissionais(),
        getCategorias(),
      ]);
      setProfissionais(respostaProfissionais.profissionais);
      setCategorias(respostaCategorias);
      definirEstado("carregado");
    } catch (falha) {
      definirErroCarregamento(falha.message);
      definirEstado("erro");
    }
  }

  useEffect(() => { carregarProfissionais(); }, []);

  const categoriasDisponiveisFiltro = ["", ...Array.from(new Set(profissionais.map(p => p.nome_categoria).filter(Boolean)))];

  const temFiltrosAtivos = busca || filtroCategoria || filtroEstado !== "todos";

  const filtered = profissionais.filter(p => {
    const q = busca.toLowerCase();
    const okSearch = !q
      || (p.nome || "").toLowerCase().includes(q)
      || (p.email || "").toLowerCase().includes(q)
      || (p.telefone || "").toLowerCase().includes(q)
      || (p.nome_categoria || "").toLowerCase().includes(q);
    const okCategoria = !filtroCategoria || p.nome_categoria === filtroCategoria;
    const okEstado = filtroEstado === "todos"
      || (filtroEstado === "ativo"   &&  p.ativo)
      || (filtroEstado === "inativo" && !p.ativo);
    return okSearch && okCategoria && okEstado;
  });

  async function lidarComCadastro(e) {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha || !form.categoria_id) {
      definirErroFormulario("Preencha todos os campos obrigatórios (*) antes de continuar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      definirErroFormulario("Formato de e-mail inválido. Exemplo: nome@exemplo.co.mz");
      return;
    }
    definirSalvando(true);
    try {
      await criarProfissional({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        telefone: form.telefone,
        categoria_id: form.categoria_id,
        preco_por_hora: Number(form.preco_por_hora) || 0,
        experiencia: form.experiencia,
        descricao: form.descricao,
        foto: form.foto,
        // texto separado por vírgulas -> array de competências
        competencias: form.competencias.split(",").map((c) => c.trim()).filter(Boolean),
        disponibilidade: form.disponibilidade,
      });
      await carregarProfissionais();
      definirModalCadastro(false);
      setForm({ nome: "", email: "", telefone: "", senha: "", categoria_id: "", preco_por_hora: "", experiencia: "", descricao: "", foto: "", competencias: "", disponibilidade: [] });
      definirErroFormulario("");
    } catch (falha) {
      definirErroFormulario(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  async function lidarComConfirmacao() {
    if (!modalConfirmacao) return;
    definirSalvando(true);
    try {
      if (modalConfirmacao.action === "excluir") {
        await excluirProfissional(modalConfirmacao.prof.id);
      } else {
        await alterarEstadoProfissional(modalConfirmacao.prof.id, !modalConfirmacao.prof.ativo);
      }
      await carregarProfissionais();
      definirModalConfirmacao(null);
    } catch (falha) {
      alert(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  function f(field) { return e => setForm(v => ({ ...v, [field]: e.target.value })); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Profissionais</h2>
        <Btn variant="primary" onClick={() => definirModalCadastro(true)}>
          <Plus size={15} /> Cadastrar profissional
        </Btn>
      </div>

      {/* Barra de filtros */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {/* Pesquisa por texto */}
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
          <input
            value={busca} onChange={e => definirBusca(e.target.value)}
            placeholder="Pesquisar por nome, telefone, e-mail ou categoria..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px 9px 34px", borderRadius: "var(--radius)",
              border: "1.5px solid var(--border)", background: "var(--input-background)",
              color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Selects */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Categoria */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoria de serviço</span>
            <select value={filtroCategoria} onChange={e => definirFiltroCategoria(e.target.value)} style={{
              padding: "7px 28px 7px 10px", borderRadius: "var(--radius)",
              border: "1.5px solid var(--border)", background: "var(--card)",
              color: "var(--foreground)", fontSize: 13, outline: "none",
              fontFamily: "inherit", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23717182' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
            }}>
              <option value="">Todas as categorias</option>
              {categoriasDisponiveisFiltro.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Estado */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</span>
            <select value={filtroEstado} onChange={e => definirFiltroEstado(e.target.value)} style={{
              padding: "7px 28px 7px 10px", borderRadius: "var(--radius)",
              border: "1.5px solid var(--border)", background: "var(--card)",
              color: "var(--foreground)", fontSize: 13, outline: "none",
              fontFamily: "inherit", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23717182' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
            }}>
              <option value="todos">Todos</option>
              <option value="ativo">Activos</option>
              <option value="inativo">Inactivos</option>
            </select>
          </div>

          {/* Contador + limpar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
              {filtered.length} profissional{filtered.length !== 1 ? "is" : ""}
            </span>
            {temFiltrosAtivos && (
              <button onClick={() => { definirBusca(""); definirFiltroCategoria(""); definirFiltroEstado("todos"); }} style={{
                padding: "6px 12px", borderRadius: "var(--radius)",
                border: "1.5px solid var(--border)", background: "transparent",
                color: "var(--muted-foreground)", fontSize: 12, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
              >
                <X size={12} /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {estado === "erro" ? (
        <ErrorState onRetry={carregarProfissionais} />
      ) : estado === "carregando" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 20 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <Skeleton width={44} height={44} style={{ borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="70%" height={13} />
                  <Skeleton width="50%" height={11} style={{ marginTop: 6 }} />
                </div>
              </div>
              <Skeleton height={11} />
              <Skeleton width="60%" height={11} style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="Nenhum profissional encontrado." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{
              background: "var(--card)", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", padding: 20,
              boxShadow: "0 1px 4px rgba(3,2,19,0.04)",
              opacity: p.ativo ? 1 : 0.65,
              position: "relative",
              // opacity < 1 cria um novo contexto de empilhamento — sem isto,
              // o menu suspenso (Ativar/Excluir) fica atrás da camada que
              // fecha o menu ao clicar fora, e os cliques nos botões nunca
              // chegam a disparar (ver overlay "Close menu on outside click").
              zIndex: menuAberto === p.id ? 20 : "auto",
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar nome={p.nome} foto={p.foto} size={42} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{p.nome_categoria}</div>
                  </div>
                </div>
                {/* Menu */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => definirMenuAberto(menuAberto === p.id ? null : p.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4, borderRadius: 6 }}>
                    <MoreVertical size={15} />
                  </button>
                  {menuAberto === p.id && (
                    <div style={{
                      position: "absolute", right: 0, top: "100%", zIndex: 10,
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", boxShadow: "0 4px 16px rgba(3,2,19,0.12)",
                      minWidth: 160, overflow: "hidden",
                    }}>
                      <button
                        onClick={() => { definirModalConfirmacao({ prof: p, action: p.ativo ? "desativar" : "ativar" }); definirMenuAberto(null); }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "10px 14px", background: "none", border: "none",
                          cursor: "pointer", fontSize: 13,
                          color: p.ativo ? "#d4183d" : "#16a34a",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        {p.ativo ? "Desativar profissional" : "Ativar profissional"}
                      </button>
                      <button
                        onClick={() => { definirModalConfirmacao({ prof: p, action: "excluir" }); definirMenuAberto(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left",
                          padding: "10px 14px", background: "none", border: "none",
                          borderTop: "1px solid var(--border)",
                          cursor: "pointer", fontSize: 13, color: "#d4183d", fontFamily: "inherit",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <Trash2 size={13} /> Excluir permanentemente
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12, color: "var(--muted-foreground)" }}>
                {p.telefone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Phone size={11} style={{ flexShrink: 0 }} /> {p.telefone}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>✉</span> {p.email}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)" }}>
                    MT {Number(p.preco_por_hora || 0).toLocaleString("pt-MZ")}/h
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={11} /> {p.experiencia} de experiência
                </div>
              </div>

              {/* Status badge */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                  background: p.ativo ? (escuro ? "#052e16" : "#f0fdf4") : (escuro ? "#1f2937" : "#f3f4f6"),
                  color: p.ativo ? "#16a34a" : "#6b7280",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.ativo ? "#22c55e" : "#9ca3af" }} />
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      <Modal
        open={modalCadastro}
        onClose={() => { definirModalCadastro(false); definirErroFormulario(""); }}
        title="Cadastrar profissional"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalCadastro(false)}>Cancelar</Btn>
          <Btn variant="primary" disabled={salvando} onClick={lidarComCadastro}>
            {salvando ? "Cadastrando..." : "Cadastrar"}
          </Btn>
        </>}
      >
        <form onSubmit={lidarComCadastro} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Nome *" value={form.nome} onChange={f("nome")} placeholder="Nome completo" />
            <Input label="E-mail *" type="email" value={form.email} onChange={f("email")} placeholder="email@exemplo.co.mz" />
          </div>
          <Input label="Telefone" type="tel" value={form.telefone} onChange={f("telefone")} placeholder="+258 8X XXX XXXX" />
          <Input label="Palavra-passe temporária *" type="password" value={form.senha} onChange={f("senha")} placeholder="Mín. 6 caracteres" />
          <p style={{ margin: "-6px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>
            O profissional deverá alterar a palavra-passe no primeiro acesso.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Categoria *" value={form.categoria_id} onChange={f("categoria_id")} options={categorias.map(c => ({ value: c.id, label: c.nome }))} placeholder="Selecione..." />
            <Input label="Preço/hora (MT)" type="number" value={form.preco_por_hora} onChange={f("preco_por_hora")} placeholder="ex: 750" />
          </div>
          <Input label="Experiência" value={form.experiencia} onChange={f("experiencia")} placeholder="ex: 5 anos em instalações eléctricas" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Descrição</label>
            <textarea
              value={form.descricao} onChange={f("descricao")}
              placeholder="Breve descrição do profissional..."
              rows={3}
              style={{
                padding: "9px 12px", borderRadius: "var(--radius)",
                border: "1.5px solid var(--border)", background: "var(--input-background)",
                color: "var(--foreground)", fontSize: 14, outline: "none",
                resize: "vertical", fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Foto do profissional</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {form.foto ? (
                <img src={form.foto} alt="Pré-visualização" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={22} color="var(--muted-foreground)" />
                </div>
              )}
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                padding: "8px 14px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)",
                background: "var(--card)", fontSize: 13, fontWeight: 500,
              }}>
                {processandoFoto ? (
                  <><RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> A processar...</>
                ) : (
                  <>{form.foto ? "Trocar foto" : "Carregar foto"}</>
                )}
                <input type="file" accept="image/*" onChange={aoEscolherFoto} disabled={processandoFoto} style={{ display: "none" }} />
              </label>
              {form.foto && !processandoFoto && (
                <button type="button" onClick={() => setForm(v => ({ ...v, foto: "" }))}
                  style={{ background: "none", border: "none", color: "var(--destructive)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  Remover
                </button>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>JPG ou PNG. A imagem é redimensionada automaticamente.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Competências</label>
            <input
              value={form.competencias}
              onChange={f("competencias")}
              placeholder="ex: Limpeza profunda, Organização, Passar roupas"
              style={{
                padding: "9px 12px", borderRadius: "var(--radius)",
                border: "1.5px solid var(--border)", background: "var(--input-background)",
                color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Separe cada competência por vírgula.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Disponibilidade</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map(dia => {
                const selecionado = form.disponibilidade.includes(dia);
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => setForm(v => ({
                      ...v,
                      disponibilidade: selecionado
                        ? v.disponibilidade.filter(d => d !== dia)
                        : [...v.disponibilidade, dia],
                    }))}
                    style={{
                      padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
                      border: selecionado ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                      background: selecionado ? "var(--primary)" : "var(--card)",
                      color: selecionado ? "var(--primary-foreground)" : "var(--foreground)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>

          {erroFormulario && (
            <div style={{ display: "flex", gap: 8, padding: "9px 12px", borderRadius: "var(--radius)", background: "rgba(212,24,61,0.07)", border: "1px solid rgba(212,24,61,0.2)", fontSize: 13, color: "#d4183d" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {erroFormulario}
            </div>
          )}
        </form>
      </Modal>

      {/* Confirm toggle/excluir modal */}
      <Modal
        open={!!modalConfirmacao}
        onClose={() => definirModalConfirmacao(null)}
        title={
          modalConfirmacao?.action === "excluir" ? "Excluir profissional"
          : modalConfirmacao?.action === "desativar" ? "Desativar profissional"
          : "Ativar profissional"
        }
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalConfirmacao(null)}>Cancelar</Btn>
          <Btn
            variant={modalConfirmacao?.action === "desativar" || modalConfirmacao?.action === "excluir" ? "destructive" : "primary"}
            disabled={salvando}
            onClick={lidarComConfirmacao}
          >
            {salvando ? "Aguarde..." :
              modalConfirmacao?.action === "excluir" ? "Sim, excluir permanentemente"
              : modalConfirmacao?.action === "desativar" ? "Sim, desativar" : "Sim, ativar"}
          </Btn>
        </>}
      >
        {modalConfirmacao && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {modalConfirmacao.action === "excluir"
              ? `Tem a certeza que pretende excluir ${modalConfirmacao.prof.nome} permanentemente? Esta ação não pode ser desfeita. O login dele será removido e os agendamentos antigos ficarão sem profissional atribuído.`
              : modalConfirmacao.action === "desativar"
              ? `Tem a certeza que pretende desactivar ${modalConfirmacao.prof.nome}? Não poderá aceder à aplicação nem receber novos agendamentos.`
              : `Deseja reactivar ${modalConfirmacao.prof.nome}? Voltará a ter acesso à aplicação e poderá receber agendamentos.`
            }
          </p>
        )}
      </Modal>

      {/* Close menu on outside click */}
      {menuAberto !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => definirMenuAberto(null)} />
      )}
    </div>
  );
}

// ─── Gestores (exclusivo do admin) ─────────────────────────────────────────

function GestoresScreen({ escuro }) {
  const [estado, definirEstado] = useState("carregando");
  const [erroCarregamento, definirErroCarregamento] = useState("");
  const [busca, definirBusca] = useState("");
  const [gestores, setGestores] = useState([]);
  const [modalCadastro, definirModalCadastro] = useState(false);
  const [modalEditar, definirModalEditar] = useState(null);
  const [modalConfirmacao, definirModalConfirmacao] = useState(null);
  const [modalResetSenha, definirModalResetSenha] = useState(null);
  const [novaSenha, definirNovaSenha] = useState("");
  const [salvando, definirSalvando] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [erroFormulario, definirErroFormulario] = useState("");

  async function carregarGestores() {
    definirEstado("carregando");
    definirErroCarregamento("");
    try {
      const resposta = await getGestores();
      setGestores(resposta.gestores);
      definirEstado("carregado");
    } catch (falha) {
      definirErroCarregamento(falha.message);
      definirEstado("erro");
    }
  }

  useEffect(() => { carregarGestores(); }, []);

  const filtered = gestores.filter(g => {
    const q = busca.toLowerCase();
    return !q || g.nome.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  });

  function f(field) { return e => setForm(v => ({ ...v, [field]: e.target.value })); }

  async function lidarComCadastro(e) {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) {
      definirErroFormulario("Preencha todos os campos obrigatórios.");
      return;
    }
    definirSalvando(true);
    try {
      await criarGestor(form);
      await carregarGestores();
      definirModalCadastro(false);
      setForm({ nome: "", email: "", senha: "" });
      definirErroFormulario("");
    } catch (falha) {
      definirErroFormulario(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  async function lidarComEditar(e) {
    e.preventDefault();
    definirSalvando(true);
    try {
      await editarGestor(modalEditar.id, { nome: modalEditar.nome, email: modalEditar.email });
      await carregarGestores();
      definirModalEditar(null);
    } catch (falha) {
      alert(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  async function lidarComAlternarEstado() {
    definirSalvando(true);
    try {
      await alterarEstadoGestor(modalConfirmacao.id, !modalConfirmacao.ativo);
      await carregarGestores();
      definirModalConfirmacao(null);
    } catch (falha) {
      alert(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  async function lidarComResetSenha(e) {
    e.preventDefault();
    if (!novaSenha || novaSenha.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    definirSalvando(true);
    try {
      await resetarSenhaGestor(modalResetSenha.id, novaSenha);
      definirModalResetSenha(null);
      definirNovaSenha("");
      alert("Senha redefinida com sucesso. Informe a nova senha ao gestor.");
    } catch (falha) {
      alert(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
          <input
            value={busca} onChange={e => definirBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px 9px 34px", borderRadius: "var(--radius)",
              border: "1.5px solid var(--border)", background: "var(--input-background)",
              color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
        <Btn onClick={() => definirModalCadastro(true)}><Plus size={15} /> Cadastrar gestor</Btn>
      </div>

      <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
        {estado === "carregando" ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3].map(i => <Skeleton key={i} height={44} />)}
          </div>
        ) : estado === "erro" ? (
          <ErrorState onRetry={carregarGestores} />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhum gestor encontrado." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nome", "Email", "Estado", "Criado em", "Ações"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar nome={g.nome} size={26} /> {g.nome}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-foreground)" }}>{g.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: g.ativo ? "rgba(22,163,74,0.12)" : "rgba(212,24,61,0.1)",
                        color: g.ativo ? "#16a34a" : "#d4183d",
                      }}>{g.ativo ? "Ativo" : "Inativo"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                      {new Date(g.criado_em).toLocaleDateString("pt-PT")}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="ghost" size="sm" onClick={() => definirModalEditar({ ...g })}><Pencil size={12} /></Btn>
                        <Btn variant="ghost" size="sm" onClick={() => { definirModalResetSenha(g); definirNovaSenha(""); }}><KeyRound size={12} /></Btn>
                        <Btn variant="ghost" size="sm" onClick={() => definirModalConfirmacao(g)}>
                          {g.ativo ? "Desativar" : "Ativar"}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cadastro */}
      <Modal
        open={modalCadastro}
        onClose={() => definirModalCadastro(false)}
        title="Cadastrar novo gestor"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalCadastro(false)}>Cancelar</Btn>
          <Btn disabled={salvando} onClick={lidarComCadastro}>{salvando ? "A guardar..." : "Cadastrar"}</Btn>
        </>}
      >
        <form onSubmit={lidarComCadastro} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Input label="Nome *" value={form.nome} onChange={f("nome")} placeholder="Nome completo" />
          <Input label="Email *" type="email" value={form.email} onChange={f("email")} placeholder="email@exemplo.co.mz" />
          <Input label="Senha temporária *" type="password" value={form.senha} onChange={f("senha")} placeholder="Mín. 6 caracteres" />
          {erroFormulario && (
            <div style={{ display: "flex", gap: 8, padding: "9px 12px", borderRadius: "var(--radius)", background: "rgba(212,24,61,0.07)", border: "1px solid rgba(212,24,61,0.2)", fontSize: 13, color: "#d4183d" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {erroFormulario}
            </div>
          )}
        </form>
      </Modal>

      {/* Modal editar */}
      <Modal
        open={!!modalEditar}
        onClose={() => definirModalEditar(null)}
        title="Editar gestor"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalEditar(null)}>Cancelar</Btn>
          <Btn disabled={salvando} onClick={lidarComEditar}>{salvando ? "A guardar..." : "Guardar"}</Btn>
        </>}
      >
        {modalEditar && (
          <form onSubmit={lidarComEditar} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <Input label="Nome" value={modalEditar.nome} onChange={e => definirModalEditar(v => ({ ...v, nome: e.target.value }))} />
            <Input label="Email" type="email" value={modalEditar.email} onChange={e => definirModalEditar(v => ({ ...v, email: e.target.value }))} />
          </form>
        )}
      </Modal>

      {/* Modal resetar senha */}
      <Modal
        open={!!modalResetSenha}
        onClose={() => definirModalResetSenha(null)}
        title="Redefinir senha do gestor"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalResetSenha(null)}>Cancelar</Btn>
          <Btn disabled={salvando} onClick={lidarComResetSenha}>{salvando ? "A guardar..." : "Redefinir senha"}</Btn>
        </>}
      >
        {modalResetSenha && (
          <form onSubmit={lidarComResetSenha} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
              Defina uma nova senha temporária para <strong>{modalResetSenha.nome}</strong>. Informe-a diretamente ao gestor.
            </p>
            <Input label="Nova senha *" type="password" value={novaSenha} onChange={e => definirNovaSenha(e.target.value)} placeholder="Mín. 6 caracteres" />
          </form>
        )}
      </Modal>

      {/* Modal confirmar ativar/desativar */}
      <Modal
        open={!!modalConfirmacao}
        onClose={() => definirModalConfirmacao(null)}
        title={modalConfirmacao?.ativo ? "Desativar gestor" : "Ativar gestor"}
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalConfirmacao(null)}>Cancelar</Btn>
          <Btn variant={modalConfirmacao?.ativo ? "destructive" : "primary"} disabled={salvando} onClick={lidarComAlternarEstado}>
            {salvando ? "Aguarde..." : modalConfirmacao?.ativo ? "Sim, desativar" : "Sim, ativar"}
          </Btn>
        </>}
      >
        {modalConfirmacao && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {modalConfirmacao.ativo
              ? `Tem a certeza que pretende desactivar ${modalConfirmacao.nome}? Ele não conseguirá mais aceder ao backoffice.`
              : `Deseja reactivar ${modalConfirmacao.nome}? Voltará a ter acesso ao backoffice.`}
          </p>
        )}
      </Modal>
    </div>
  );
}

// ─── Categorias (exclusivo do admin) ───────────────────────────────────────

const ICONES_DISPONIVEIS = ["home", "droplet", "chef-hat", "leaf", "zap", "paint-bucket", "hammer", "ruler", "wind", "shield", "car", "baby", "shirt"];
const CORES_DISPONIVEIS = ["bg-blue-500", "bg-cyan-500", "bg-orange-500", "bg-green-500", "bg-yellow-500", "bg-pink-500", "bg-stone-500", "bg-amber-700", "bg-sky-500", "bg-slate-600", "bg-indigo-500", "bg-rose-400", "bg-teal-500"];

function CategoriasScreen({ escuro }) {
  const [estado, definirEstado] = useState("carregando");
  const [erroCarregamento, definirErroCarregamento] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [modalForm, definirModalForm] = useState(null); // null | { modo: "criar"|"editar", dados: {...} }
  const [modalRemover, definirModalRemover] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const [erroFormulario, definirErroFormulario] = useState("");

  async function carregarCategorias() {
    definirEstado("carregando");
    definirErroCarregamento("");
    try {
      const resposta = await getCategorias();
      setCategorias(resposta);
      definirEstado("carregado");
    } catch (falha) {
      definirErroCarregamento(falha.message);
      definirEstado("erro");
    }
  }

  useEffect(() => { carregarCategorias(); }, []);

  function abrirCriar() {
    definirErroFormulario("");
    definirModalForm({ modo: "criar", dados: { id: "", nome: "", icone: ICONES_DISPONIVEIS[0], descricao: "", cor: CORES_DISPONIVEIS[0] } });
  }
  function abrirEditar(cat) {
    definirErroFormulario("");
    definirModalForm({ modo: "editar", dados: { ...cat } });
  }

  async function lidarComSalvar(e) {
    e.preventDefault();
    const { modo, dados } = modalForm;
    if (!dados.nome || (modo === "criar" && !dados.id)) {
      definirErroFormulario("Preencha o id e o nome da categoria.");
      return;
    }
    definirSalvando(true);
    try {
      if (modo === "criar") {
        await criarCategoria(dados);
      } else {
        await editarCategoria(dados.id, dados);
      }
      await carregarCategorias();
      definirModalForm(null);
    } catch (falha) {
      definirErroFormulario(falha.message);
    } finally {
      definirSalvando(false);
    }
  }

  async function lidarComRemover() {
    definirSalvando(true);
    try {
      await removerCategoria(modalRemover.id);
      await carregarCategorias();
      definirModalRemover(null);
    } catch (falha) {
      alert(falha.message);
      definirModalRemover(null);
    } finally {
      definirSalvando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    definirModalForm(v => ({ ...v, dados: { ...v.dados, [campo]: valor } }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
          Categorias de serviço disponíveis para os clientes escolherem ao agendar.
        </p>
        <Btn onClick={abrirCriar}><Plus size={15} /> Nova categoria</Btn>
      </div>

      {estado === "carregando" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={90} />)}
        </div>
      ) : estado === "erro" ? (
        <ErrorState onRetry={carregarCategorias} />
      ) : categorias.length === 0 ? (
        <EmptyState message="Nenhuma categoria cadastrada." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {categorias.map(c => (
            <div key={c.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Tag size={16} color="var(--primary-foreground)" />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="ghost" size="sm" onClick={() => abrirEditar(c)}><Pencil size={12} /></Btn>
                  <Btn variant="ghost" size="sm" onClick={() => definirModalRemover(c)}><Trash2 size={12} /></Btn>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nome}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>id: {c.id}</div>
                {c.descricao && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>{c.descricao}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar categoria */}
      <Modal
        open={!!modalForm}
        onClose={() => definirModalForm(null)}
        title={modalForm?.modo === "criar" ? "Nova categoria" : "Editar categoria"}
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalForm(null)}>Cancelar</Btn>
          <Btn disabled={salvando} onClick={lidarComSalvar}>{salvando ? "A guardar..." : "Guardar"}</Btn>
        </>}
      >
        {modalForm && (
          <form onSubmit={lidarComSalvar} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <Input
              label="Id (identificador único) *"
              value={modalForm.dados.id}
              onChange={e => atualizarCampo("id", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="ex: pintor"
              disabled={modalForm.modo === "editar"}
            />
            <Input label="Nome *" value={modalForm.dados.nome} onChange={e => atualizarCampo("nome", e.target.value)} placeholder="ex: Pintor" />
            <Select label="Ícone" value={modalForm.dados.icone} onChange={e => atualizarCampo("icone", e.target.value)} options={ICONES_DISPONIVEIS} />
            <Select label="Cor" value={modalForm.dados.cor} onChange={e => atualizarCampo("cor", e.target.value)} options={CORES_DISPONIVEIS} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Descrição</label>
              <textarea
                value={modalForm.dados.descricao || ""} onChange={e => atualizarCampo("descricao", e.target.value)}
                rows={2}
                style={{
                  padding: "9px 12px", borderRadius: "var(--radius)",
                  border: "1.5px solid var(--border)", background: "var(--input-background)",
                  color: "var(--foreground)", fontSize: 14, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
            </div>
            {erroFormulario && (
              <div style={{ display: "flex", gap: 8, padding: "9px 12px", borderRadius: "var(--radius)", background: "rgba(212,24,61,0.07)", border: "1px solid rgba(212,24,61,0.2)", fontSize: 13, color: "#d4183d" }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {erroFormulario}
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Modal confirmar remoção */}
      <Modal
        open={!!modalRemover}
        onClose={() => definirModalRemover(null)}
        title="Remover categoria"
        footer={<>
          <Btn variant="secondary" onClick={() => definirModalRemover(null)}>Cancelar</Btn>
          <Btn variant="destructive" disabled={salvando} onClick={lidarComRemover}>{salvando ? "Aguarde..." : "Sim, remover"}</Btn>
        </>}
      >
        {modalRemover && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            Tem a certeza que pretende remover a categoria <strong>{modalRemover.nome}</strong>? Só é possível remover categorias que não tenham profissionais ou agendamentos associados.
          </p>
        )}
      </Modal>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // ao recarregar a página, tenta recuperar a sessão guardada no login
  const [utilizador, definirUtilizador] = useState(() => obterUtilizadorGuardado());
  const [tela, definirTela] = useState("dashboard");
  const [menuLateralAberto, definirMenuLateralAberto] = useState(true);
  const [escuro, definirEscuro] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", escuro);
  }, [escuro]);

  function sair() {
    limparSessao();
    definirUtilizador(null);
  }

  if (!utilizador) return <LoginScreen onLogin={definirUtilizador} />;

  const isAdmin = utilizador.papel === "admin";

  const nav = [
    { key: "dashboard",     label: "Dashboard",    icon: LayoutDashboard },
    { key: "agendamentos",  label: "Agendamentos", icon: Calendar        },
    { key: "profissionais", label: "Profissionais",icon: Users           },
    ...(isAdmin ? [
      { key: "gestores",   label: "Gestores",   icon: UserCog },
      { key: "categorias", label: "Categorias", icon: Tag     },
    ] : []),
  ];

  return (
    <>
      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", width: "100%", background: "var(--background)", color: "var(--foreground)", overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{
          width: menuLateralAberto ? 220 : 0,
          minWidth: menuLateralAberto ? 220 : 0,
          overflow: "hidden",
          background: "var(--sidebar)",
          display: "flex", flexDirection: "column",
          transition: "width 0.2s, min-width 0.2s",
          borderRight: "1px solid var(--sidebar-border)",
        }}>
          {/* Logo */}
          <div style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--sidebar-border)",
            display: "flex", alignItems: "center", gap: 10,
            whiteSpace: "nowrap",
          }}>
            <img src="/logo.png" alt="ServCasa" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>ServCasa</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Backoffice</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => definirTela(key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: "var(--radius)", border: "none",
                cursor: "pointer", whiteSpace: "nowrap", textAlign: "left", width: "100%",
                background: tela === key ? "rgba(255,255,255,0.1)" : "transparent",
                color: tela === key ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: 13, fontWeight: tela === key ? 600 : 400,
                transition: "background 0.15s, color 0.15s", fontFamily: "inherit",
              }}
                onMouseEnter={e => { if (tela !== key) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (tela !== key) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid var(--sidebar-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: "var(--radius)", marginBottom: 4 }}>
              <Avatar nome={utilizador.nome} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{utilizador.nome}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  {isAdmin && <ShieldCheck size={11} />}
                  {isAdmin ? "Administrador" : "Gestor"}
                </div>
              </div>
            </div>
            <button onClick={sair} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 12px", borderRadius: "var(--radius)", border: "none",
              cursor: "pointer", background: "transparent",
              color: "rgba(255,255,255,0.4)", fontSize: 13,
              transition: "background 0.15s, color 0.15s", fontFamily: "inherit",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,24,61,0.15)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Topbar */}
          <header style={{
            display: "flex", alignItems: "center", gap: 12, padding: "0 20px",
            height: 56, borderBottom: "1px solid var(--border)",
            background: "var(--card)", flexShrink: 0,
          }}>
            <button onClick={() => definirMenuLateralAberto(v => !v)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted-foreground)", padding: 6, borderRadius: 6,
              display: "flex", alignItems: "center",
            }}>
              {menuLateralAberto ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {nav.find(n => n.key === tela)?.label}
            </div>

            <div style={{ flex: 1 }} />

            {/* Dark mode toggle */}
            <button onClick={() => definirEscuro(v => !v)} style={{
              background: "none", border: "1.5px solid var(--border)", cursor: "pointer",
              color: "var(--muted-foreground)", padding: "5px 10px", borderRadius: "var(--radius)",
              display: "flex", alignItems: "center", gap: 6, fontSize: 12,
            }}>
              {escuro ? <Sun size={14} /> : <Moon size={14} />}
              {escuro ? "Claro" : "Escuro"}
            </button>

            {/* User chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: "var(--radius)", background: "var(--accent)", fontSize: 13 }}>
              <Avatar nome={utilizador.nome} size={24} />
              <span style={{ fontWeight: 500 }}>{utilizador.nome.split(" ")[0]}</span>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
            {tela === "dashboard"     && <DashboardScreen escuro={escuro} />}
            {tela === "agendamentos"  && <AgendamentosScreen escuro={escuro} />}
            {tela === "profissionais" && <ProfissionaisScreen escuro={escuro} utilizador={utilizador} />}
            {tela === "gestores"   && isAdmin && <GestoresScreen escuro={escuro} />}
            {tela === "categorias" && isAdmin && <CategoriasScreen escuro={escuro} />}
          </main>
        </div>
      </div>
    </>
  );
}
