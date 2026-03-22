import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { categories } from "../data/professionals";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";

export function SelectDateTime() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === categoryId);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: "2",
    address: "",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Navegar para a página de profissionais disponíveis com TODOS os dados
    const params = new URLSearchParams({
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      address: formData.address,
      description: formData.description || "",
    });
    navigate(
      `/categoria/${categoryId}/profissionais?${params.toString()}`
    );
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h2>
        </div>
      </div>
    );
  }

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${category.color} text-white py-8 px-4`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          <p className="text-lg opacity-90">{category.description}</p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <span className="text-sm font-medium text-gray-900">Serviço</span>
            </div>
            <div className="h-1 flex-1 bg-blue-500 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <span className="text-sm font-medium text-gray-900">Data e Horário</span>
            </div>
            <div className="h-1 flex-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <span className="text-sm font-medium text-gray-600">Profissional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quando você precisa do serviço?
            </h2>
            <p className="text-gray-600">
              Selecione a data, horário e local para encontrar profissionais disponíveis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Date and Time Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <span>Data e Horário</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Data do Serviço *
                  </label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Escolha o melhor dia para você
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Horário de Início *
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="">Selecione um horário</option>
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
                  <p className="text-sm text-gray-500 mt-1">
                    Quando o profissional deve chegar
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <Clock className="w-5 h-5 inline mr-1" />
                  Duração Estimada *
                </label>
                <select
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="3">3 horas</option>
                  <option value="4">4 horas (meio período)</option>
                  <option value="6">6 horas</option>
                  <option value="8">8 horas (dia inteiro)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Você pode ajustar com o profissional depois
                </p>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
                <span>Local do Serviço</span>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Av. Julius Nyerere, 1000, Maputo"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Avenida, rua, número, bairro e cidade
                </p>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Detalhes do Serviço (Opcional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Descreva o que você precisa, detalhes importantes, ou instruções especiais..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Isso ajuda os profissionais a entenderem melhor o serviço
                </p>
              </div>
            </div>

            {/* Summary Box */}
            {formData.date && formData.time && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">Resumo da Solicitação</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(formData.date + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium text-gray-900">{formData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium text-gray-900">{formData.duration} horas</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
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
