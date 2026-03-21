import { useParams, useSearchParams } from "react-router";
import { ProfessionalCard } from "../components/ProfessionalCard";
import { professionals, categories } from "../data/professionals";
import { Calendar, Clock, MapPin, Filter, SlidersHorizontal } from "lucide-react";

export function AvailableProfessionals() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  
  const category = categories.find((c) => c.id === categoryId);
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const duration = searchParams.get("duration");

  // Filtrar profissionais por categoria e "disponibilidade"
  // Em produção, isso seria uma chamada ao backend com os parâmetros de data/hora
  const availableProfessionals = professionals.filter(
    (p) => p.category === categoryId
  );

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h2>
        </div>
      </div>
    );
  }

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with selected info */}
      <div className={`${category.color} text-white py-6 px-4`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{category.name}</h1>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Data</div>
                  <div className="font-semibold capitalize">{formattedDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Horário</div>
                  <div className="font-semibold">{time} - {duration}h de duração</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <div>
                  <div className="text-white/80 text-xs">Profissionais Disponíveis</div>
                  <div className="font-semibold">{availableProfessionals.length} encontrados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <span className="text-sm font-medium text-gray-900">Serviço</span>
            </div>
            <div className="h-1 flex-1 bg-green-500 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <span className="text-sm font-medium text-gray-900">Data e Horário</span>
            </div>
            <div className="h-1 flex-1 bg-blue-500 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <span className="text-sm font-medium text-gray-900">Escolher Profissional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
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

      {/* Professionals List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Profissionais Disponíveis
          </h2>
          <p className="text-gray-600">
            Todos estes profissionais estão disponíveis para o horário selecionado
          </p>
        </div>

        {availableProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProfessionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum profissional disponível
            </h3>
            <p className="text-gray-600 mb-6">
              Não encontramos profissionais disponíveis para este horário.
              <br />
              Tente selecionar outra data ou horário.
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

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Não encontrou o que procurava?</h3>
          <p className="text-blue-100 mb-4">
            Entre em contato conosco e ajudaremos a encontrar o profissional ideal para você
          </p>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Falar com Suporte
          </button>
        </div>
      </div>
    </div>
  );
}
