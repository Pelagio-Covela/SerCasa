import { useParams, useSearchParams } from "react-router-dom";
import { CartaoProfissional } from "../components/CartaoProfissional";
import { categorias } from "../data/profissionais";
import { getProfissionais } from "../api";
import { Calendar, Clock, MapPin, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export function ProfissionaisDisponiveis() {
  const { categoriaId } = useParams();
  const [parametrosPesquisa] = useSearchParams();
  const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const categoria = categorias.find((c) => c.id === categoriaId);
  const data = parametrosPesquisa.get("data");
  const hora = parametrosPesquisa.get("hora");
  const duracao = parametrosPesquisa.get("duracao");

  useEffect(() => {
    getProfissionais(categoriaId, data, hora)
      .then(setProfissionaisDisponiveis)
      .finally(() => setCarregando(false));
  }, [categoriaId, data, hora]);

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
      <div className={`${categoria.cor} text-white py-6 px-4`}>
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
                  <div className="font-semibold">{hora} - {duracao}h de duração</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Profissionais Disponíveis</div>
                  <div className="font-semibold">{profissionaisDisponiveis.length} encontrados</div>
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
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap transition-colors font-medium">
              <SlidersHorizontal className="w-4 h-4" />
              Todos os Filtros
            </button>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg whitespace-nowrap transition-colors font-medium">
              Melhor Avaliados
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap transition-colors font-medium">
              Menor Preço
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap transition-colors font-medium">
              Mais Experiência
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profissionais Disponíveis</h2>
          <p className="text-gray-600">Todos estes profissionais estão disponíveis para o horário selecionado</p>
        </div>

        {carregando ? (
          <div className="text-center py-12 text-gray-500">A carregar profissionais...</div>
        ) : profissionaisDisponiveis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionaisDisponiveis.map((profissional) => (
              <CartaoProfissional key={profissional.id} profissional={profissional} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum profissional disponível</h3>
            <p className="text-gray-600 mb-6">Ninguém está disponível nesta categoria para a data e hora escolhidas.</p>
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
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Falar com Suporte
          </button>
        </div>
      </div>
    </div>
  );
}