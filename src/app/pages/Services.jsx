import { CategoryCard } from "../components/CategoryCard";
import { categories } from "../data/professionals";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export function Services() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Solicitar Serviço</h1>
          <p className="text-lg text-blue-100 mb-6">
            Escolha o tipo de serviço que você precisa
          </p>

          {/* Steps Indicator */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold">Escolha o Serviço</div>
                  <div className="text-sm text-blue-100">Selecione a categoria</div>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold">Data e Horário</div>
                  <div className="text-sm text-blue-100">Quando você precisa</div>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold">Escolha o Profissional</div>
                  <div className="text-sm text-blue-100">Veja disponíveis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Categorias de Serviços</h2>
          <p className="text-gray-600">Selecione o serviço que você deseja contratar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Por que contratar pela ServCasa?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Profissionais Verificados</h4>
                <p className="text-sm text-gray-600">
                  Todos passam por verificação rigorosa de antecedentes e qualificações
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Agendamento Flexível</h4>
                <p className="text-sm text-gray-600">
                  Escolha o melhor dia e horário que funciona para você
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Atendimento Rápido</h4>
                <p className="text-sm text-gray-600">
                  Veja em tempo real os profissionais disponíveis para seu horário
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
