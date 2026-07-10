import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, LocateFixed, Check } from "lucide-react";

// Corrige o ícone padrão do Leaflet (não carrega sozinho no Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Converte coordenadas num endereço legível usando o Nominatim (OpenStreetMap)
export async function obterEnderecoPorCoordenadas(lat, lng) {
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

// Escuta cliques no mapa para mover o pin
function CliqueNoMapa({ aoClicar }) {
  useMapEvents({
    click(evento) {
      aoClicar(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

// Modal com mapa para o cliente escolher a localização exata do serviço
export function LocationPicker({ aberto, aoFechar, aoConfirmar, posicaoInicial }) {
  const centroMaputo = { lat: -25.9692, lng: 32.5732 };
  const centroInicial = posicaoInicial || centroMaputo;
  const [posicao, definirPosicao] = useState(centroInicial);
  const [enderecoPreview, definirEnderecoPreview] = useState("");
  const [carregandoEndereco, definirCarregandoEndereco] = useState(false);

  // Sempre que o modal abre, recentraliza no que já foi detectado até então
  // (em vez de voltar sempre para Maputo) e já busca o endereço dessa posição,
  // para o botão "Confirmar" não ficar bloqueado à espera de um clique no mapa.
  useEffect(() => {
    if (!aberto) return;
    const inicio = posicaoInicial || centroMaputo;
    definirPosicao(inicio);
    aoMoverPin(inicio.lat, inicio.lng);
  }, [aberto]);

  async function aoMoverPin(lat, lng) {
    definirPosicao({ lat, lng });
    definirCarregandoEndereco(true);
    const endereco = await obterEnderecoPorCoordenadas(lat, lng);
    definirEnderecoPreview(endereco);
    definirCarregandoEndereco(false);
  }

  function usarLocalizacaoAtual() {
    if (!navigator.geolocation) return;
    definirCarregandoEndereco(true);
    navigator.geolocation.getCurrentPosition(
      (posicaoAtual) => {
        aoMoverPin(posicaoAtual.coords.latitude, posicaoAtual.coords.longitude);
      },
      () => definirCarregandoEndereco(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Escolher localização no mapa</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-80">
          <MapContainer center={centroInicial} zoom={13} style={{ width: "100%", height: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker
              position={posicao}
              draggable
              eventHandlers={{
                dragend: (evento) => {
                  const { lat, lng } = evento.target.getLatLng();
                  aoMoverPin(lat, lng);
                },
              }}
            />
            <CliqueNoMapa aoClicar={aoMoverPin} />
          </MapContainer>
        </div>

        <div className="p-6 space-y-4">
          <button
            type="button"
            onClick={usarLocalizacaoAtual}
            className="flex items-center gap-2 text-blue-600 font-medium text-sm hover:text-blue-700"
          >
            <LocateFixed className="w-4 h-4" />
            Usar a minha localização atual
          </button>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 min-h-[44px] flex items-center">
            {carregandoEndereco ? "A obter endereço..." : enderecoPreview || "Clique no mapa ou arraste o pin para escolher o local"}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={aoFechar}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!enderecoPreview || carregandoEndereco}
              onClick={() => aoConfirmar({ endereco: enderecoPreview, latitude: posicao.lat, longitude: posicao.lng })}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar localização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
