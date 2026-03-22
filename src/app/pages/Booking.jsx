import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { professionals } from "../data/professionals";
import { Calendar, Clock, MapPin, CreditCard, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Booking() {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const professional = professionals.find((p) => p.id === professionalId);

  // Pegar dados dos query params (já preenchidos anteriormente)
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const duration = searchParams.get("duration") || "2";
  const address = searchParams.get("address") || "";
  const description = searchParams.get("description") || "";

  const [confirmed, setConfirmed] = useState(false);

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profissional não encontrado</h2>
        </div>
      </div>
    );
  }

  // Calcular preços
  const totalPrice = professional.hourlyRate * parseInt(duration);
  const serviceFee = totalPrice * 0.1;
  const finalPrice = totalPrice + serviceFee;

  // Formatar data
  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui seria enviado para o backend
    setConfirmed(true);
  };

  // Tela de confirmação
  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Agendamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Seu serviço foi agendado com sucesso. Você receberá uma confirmação por email.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">Profissional</p>
            <p className="font-semibold text-gray-900 mb-3">{professional.name}</p>
            <p className="text-sm text-gray-600 mb-1">Data e Hora</p>
            <p className="font-semibold text-gray-900 mb-3">
              {formattedDate} às {time}
            </p>
            <p className="text-sm text-gray-600 mb-1">Duração</p>
            <p className="font-semibold text-gray-900 mb-3">{duration} horas</p>
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-green-600">{finalPrice.toFixed(2)} MT</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Voltar para Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <ImageWithFallback
                src={professional.photo}
                alt={professional.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{professional.name}</h2>
              <p className="text-gray-600">{professional.experience}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{professional.hourlyRate} MT</div>
              <div className="text-sm text-gray-600">por hora</div>
            </div>
          </div>
        </div>

        {/* Resumo do Agendamento */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4 text-xl">Resumo do Agendamento</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">Data e Horário</span>
              </div>
              <p className="text-gray-900 font-medium capitalize">{formattedDate}</p>
              <p className="text-gray-900 font-medium">{time} - {duration}h de duração</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-semibold">Endereço</span>
              </div>
              <p className="text-gray-900 font-medium">{address}</p>
            </div>
          </div>
          {description && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Detalhes do Serviço</p>
              <p className="text-gray-900">{description}</p>
            </div>
          )}
        </div>

        {/* Pagamento */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Pagamento
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Número do Cartão *
              </label>
              <input
                type="text"
                required
                placeholder="0000 0000 0000 0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Validade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MM/AA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">CVV *</label>
                <input
                  type="text"
                  required
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Nome no Cartão *
              </label>
              <input
                type="text"
                required
                placeholder="Nome como aparece no cartão"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Resumo do Pagamento */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Resumo do Pagamento</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Valor por hora:</span>
                  <span>{professional.hourlyRate.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Duração:</span>
                  <span>{duration} horas</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{totalPrice.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxa de serviço (10%):</span>
                  <span>{serviceFee.toFixed(2)} MT</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {finalPrice.toFixed(2)} MT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Pagamento */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              Confirmar Pagamento
            </button>

            <p className="text-xs text-gray-500 text-center">
              Ao confirmar, você concorda com nossos termos de serviço e política de privacidade.
              Seus dados de pagamento são processados de forma segura.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
