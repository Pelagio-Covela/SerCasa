import { useParams, useSearchParams } from "react-router-dom";
import { CartaoProfissional } from "../components/CartaoProfissional";
import { getProfissionais, getCategoria } from "../api";
import { Calendar, Clock, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { corDeFundoCategoria } from "../utils/cores";

// extrai um número de anos de um texto livre tipo "8 anos de experiência"
function anosDeExperiencia(texto) {
  const match = String(texto || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function ProfissionaisDisponiveis() {
  const { categoriaId } = useParams();
  const [parametrosPesquisa] = useSearchParams();
  const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [categoria, definirCategoria] = useState(null);
  const [carregandoCategoria, definirCarregandoCategoria] = useState(true);

  const [ordenacao, definirOrdenacao] = useState(""); // "avaliacao" | "preco" | "experiencia"
  const [painelFiltrosAberto, definirPainelFiltrosAberto] = useState(false);
  const [precoMaximo, definirPrecoMaximo] = useState("");
  const [avaliacaoMinima, definirAvaliacaoMinima] = useState("");

  const data = parametrosPesquisa.get("data");
  const hora = parametrosPesquisa.get("hora");

  useEffect(() => {
    getCategoria(categoriaId)
      .then(definirCategoria)
      .finally(() => definirCarregandoCategoria(false));
  }, [categoriaId]);

  useEffect(() => {
    getProfissionais(categoriaId, data, hora)
      .then((lista) => setProfissionaisDisponiveis(lista || []))
      .catch(() => setProfissionaisDisponiveis([]))
      .finally(() => setCarregando(false));
  }, [categoriaId, data, hora]);

  const listaFiltrada = useMemo(() => {
    let lista = [...profissionaisDisponiveis];

    if (precoMaximo) {
      lista = lista.filter((p) => Number(p.precoPorHora) <= Number(precoMaximo));
    }
    if (avaliacaoMinima) {
      lista = lista.filter((p) => Number(p.avaliacao || 0) >= Number(avaliacaoMinima));
    }

    if (ordenacao === "avaliacao") {
      lista.sort((a, b) => Number(b.avaliacao || 0) - Number(a.avaliacao || 0));
    } else if (ordenacao === "preco") {
      lista.sort((a, b) => Number(a.precoPorHora || 0) - Number(b.precoPorHora || 0));
    } else if (ordenacao === "experiencia") {
      lista.sort((a, b) => anosDeExperiencia(b.experiencia) - anosDeExperiencia(a.experiencia));
    }

    return lista;
  }, [profissionaisDisponiveis, ordenacao, precoMaximo, avaliacaoMinima]);

  const filtrosAtivos = Boolean(precoMaximo || avaliacaoMinima);

  function limparFiltros() {
    definirPrecoMaximo("");
    definirAvaliacaoMinima("");
  }

  if (carregandoCategoria) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!categoria) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h2>
        </div>
      </div>
    );
  }

  const dataFormatada = data
    ? new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white py-6 px-4" style={{ background: corDeFundoCategoria(categoria.cor) }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{categoria.nome}</h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Data</div>
                  <div className="font-semibold capitalize">{dataFormatada}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Horário</div>
                  <div className="font-semibold">{hora}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Profissionais Disponíveis</div>
                  <div className="font-semibold">{listaFiltrada.length} encontrados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
              <span className="text-sm font-medium text-gray-900">Serviço</span>
            </div>
            <div className="h-1 flex-1 bg-green-500 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
              <span className="text-sm font-medium text-gray-900">Data e Horário</span>
            </div>
            <div className="h-1 flex-1 bg-blue-500 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <span className="text-sm font-medium text-gray-900">Escolher Profissional</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => definirPainelFiltrosAberto((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium ${
                painelFiltrosAberto || filtrosAtivos ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Todos os Filtros
              {filtrosAtivos && <span className="ml-1 bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">•</span>}
            </button>
            <button
              onClick={() => definirOrdenacao(ordenacao === "avaliacao" ? "" : "avaliacao")}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium ${
                ordenacao === "avaliacao" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Melhor Avaliados
            </button>
            <button
              onClick={() => definirOrdenacao(ordenacao === "preco" ? "" : "preco")}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium ${
                ordenacao === "preco" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Menor Preço
            </button>
            <button
              onClick={() => definirOrdenacao(ordenacao === "experiencia" ? "" : "experiencia")}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium ${
                ordenacao === "experiencia" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Mais Experiência
            </button>
          </div>

          {painelFiltrosAberto && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 grid sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço máximo (MT/hora)</label>
                <input
                  type="number" min="0" value={precoMaximo}
                  onChange={(e) => definirPrecoMaximo(e.target.value)}
                  placeholder="Sem limite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação mínima</label>
                <select
                  value={avaliacaoMinima}
                  onChange={(e) => definirAvaliacaoMinima(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Qualquer avaliação</option>
                  <option value="3">3+ estrelas</option>
                  <option value="4">4+ estrelas</option>
                  <option value="4.5">4.5+ estrelas</option>
                </select>
              </div>
              {filtrosAtivos && (
                <button onClick={limparFiltros} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
                  <X className="w-4 h-4" /> Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profissionais Disponíveis</h2>
          <p className="text-gray-600">Todos estes profissionais estão disponíveis para o horário selecionado</p>
        </div>

        {carregando ? (
          <div className="text-center py-12 text-gray-500">A carregar profissionais...</div>
        ) : listaFiltrada.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listaFiltrada.map((profissional) => (
              <CartaoProfissional key={profissional.id} profissional={profissional} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum profissional disponível</h3>
            <p className="text-gray-600 mb-6">
              {filtrosAtivos ? "Nenhum profissional corresponde aos filtros escolhidos." : "Ninguém está disponível nesta categoria para a data e hora escolhidas."}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Escolher Outro Horário
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Não encontrou o que procurava?</h3>
          <p className="text-blue-100 mb-4">Entre em contacto connosco e ajudaremos a encontrar o profissional ideal</p>
          <a
            href="https://wa.link/ye9hma"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Falar com Suporte
          </a>
        </div>
      </div>
    </div>
  );
}