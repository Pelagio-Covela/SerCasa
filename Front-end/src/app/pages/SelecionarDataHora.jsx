import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { categorias } from "../data/profissionais";
import { Calendar, Clock, MapPin, ArrowRight, LocateFixed, Map } from "lucide-react";
import { LocationPicker, obterEnderecoPorCoordenadas } from "../components/LocationPicker";

export function SelecionarDataHora() {
  const { categoriaId } = useParams();
  const navegar = useNavigate();
  const categoria = categorias.find((c) => c.id === categoriaId);

  const [dadosFormulario, definirDadosFormulario] = useState({
    data: "",
    hora: "",
    duracao: "2",
    endereco: "",
    descricao: "",
    latitude: "",
    longitude: "",
  });
  const [mapaAberto, definirMapaAberto] = useState(false);
  const [obtendoLocalizacao, definirObtendoLocalizacao] = useState(false);
  const [localizacaoJaTentada, definirLocalizacaoJaTentada] = useState(false);

  const [precisaoBaixa, definirPrecisaoBaixa] = useState(false);

  // Ao clicar/focar no campo de endereço pela primeira vez (ainda vazio),
  // tenta obter a localização atual do navegador e preencher sozinho.
  // A geolocalização do navegador (sem GPS dedicado) pode ter uma margem de
  // erro grande, por isso pedimos a maior precisão possível e avisamos o
  // cliente para confirmar/ajustar no mapa quando a precisão for baixa.
  function aoFocarEndereco() {
    if (localizacaoJaTentada || dadosFormulario.endereco || !navigator.geolocation) return;
    definirLocalizacaoJaTentada(true);
    definirObtendoLocalizacao(true);
    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const { latitude, longitude, accuracy } = posicao.coords;
        const endereco = await obterEnderecoPorCoordenadas(latitude, longitude);
        definirDadosFormulario((v) => ({ ...v, endereco, latitude, longitude }));
        // accuracy vem em metros; acima de 300m consideramos pouco confiável
        definirPrecisaoBaixa(accuracy > 300);
        definirObtendoLocalizacao(false);
      },
      () => definirObtendoLocalizacao(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function aoConfirmarNoMapa({ endereco, latitude, longitude }) {
    definirDadosFormulario((v) => ({ ...v, endereco, latitude, longitude }));
    definirPrecisaoBaixa(false);
    definirMapaAberto(false);
  }

  const aoSubmeter = (evento) => {
    evento.preventDefault();
    const params = new URLSearchParams({
      data: dadosFormulario.data,
      hora: dadosFormulario.hora,
      duracao: dadosFormulario.duracao,
      endereco: dadosFormulario.endereco,
      descricao: dadosFormulario.descricao || "",
      latitude: dadosFormulario.latitude || "",
      longitude: dadosFormulario.longitude || "",
    });
    navegar(`/categoria/${categoriaId}/profissionais?${params.toString()}`);
  };

  if (!categoria) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h2>
        </div>
      </div>
    );
  }

  const dataMinima = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${categoria.cor} text-white py-8 px-4`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{categoria.nome}</h1>
          <p className="text-lg opacity-90">{categoria.descricao}</p>
        </div>
      </div>

      {/* Indicador de passos */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
              <span className="text-sm font-medium text-gray-900">Serviço</span>
            </div>
            <div className="h-1 flex-1 bg-blue-500 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <span className="text-sm font-medium text-gray-900">Data e Hora</span>
            </div>
            <div className="h-1 flex-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <span className="text-sm font-medium text-gray-600">Profissional</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quando precisa do serviço?</h2>
            <p className="text-gray-600">Selecione a data, a hora e o local para encontrar profissionais disponíveis</p>
          </div>

          <form onSubmit={aoSubmeter} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <span>Data e Hora</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Data do Serviço *</label>
                  <input
                    type="date"
                    required
                    min={dataMinima}
                    value={dadosFormulario.data}
                    onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, data: evento.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">Escolha o dia que lhe for mais conveniente</p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Hora de Início *</label>
                  <select
                    required
                    value={dadosFormulario.hora}
                    onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, hora: evento.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="">Selecione uma hora</option>
                    <option value="06:00">06:00 - Manhã cedo</option>
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00 - Meio-dia</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Hora a que o profissional deve chegar</p>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <Clock className="w-5 h-5 inline mr-1" />
                  Duração Estimada *
                </label>
                <select
                  required
                  value={dadosFormulario.duracao}
                  onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, duracao: evento.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="3">3 horas</option>
                  <option value="4">4 horas (meio período)</option>
                  <option value="6">6 horas</option>
                  <option value="8">8 horas (dia inteiro)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">Poderá ajustar com o profissional depois</p>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
                <span>Local do Serviço</span>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Endereço Completo *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Av. Julius Nyerere, 1000, Maputo"
                    value={dadosFormulario.endereco}
                    onFocus={aoFocarEndereco}
                    onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, endereco: evento.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {obtendoLocalizacao && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm">
                      A localizar...
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    {obtendoLocalizacao
                      ? "A obter a sua localização atual..."
                      : "Preenchido automaticamente pela sua localização — ajuste se necessário"}
                  </p>
                  <button
                    type="button"
                    onClick={() => definirMapaAberto(true)}
                    className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700 whitespace-nowrap ml-3"
                  >
                    <Map className="w-4 h-4" />
                    Escolher no mapa
                  </button>
                </div>
                {precisaoBaixa && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <LocateFixed className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      A localização automática do seu dispositivo pode não ser exata (comum em computadores sem GPS).
                      Confira o endereço acima ou use <strong>"Escolher no mapa"</strong> para marcar o local certo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <LocationPicker
              aberto={mapaAberto}
              aoFechar={() => definirMapaAberto(false)}
              aoConfirmar={aoConfirmarNoMapa}
              posicaoInicial={
                dadosFormulario.latitude && dadosFormulario.longitude
                  ? { lat: dadosFormulario.latitude, lng: dadosFormulario.longitude }
                  : null
              }
            />

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Detalhes do Serviço (Opcional)</label>
                <textarea
                  rows={4}
                  placeholder="Descreva o que precisa, detalhes importantes ou instruções especiais..."
                  value={dadosFormulario.descricao}
                  onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, descricao: evento.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Isto ajuda os profissionais a compreender melhor o serviço</p>
              </div>
            </div>

            {dadosFormulario.data && dadosFormulario.hora && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">Resumo da Solicitação</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-medium text-gray-900">{categoria.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(`${dadosFormulario.data}T00:00:00`).toLocaleDateString("pt-PT", {
                        weekday: "long", day: "2-digit", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-medium text-gray-900">{dadosFormulario.hora}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium text-gray-900">{dadosFormulario.duracao} horas</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Ver Profissionais Disponíveis
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}