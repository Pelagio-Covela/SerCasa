import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { professionals, categories } from "../data/professionals";
import { Star, DollarSign, Calendar, Clock, MapPin, Phone, Mail, Award } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function ProfessionalDetail() {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const professional = professionals.find((p) => p.id === professionalId);

  // Pegar dados dos query params (que vieram da seleção de data/hora)
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const duration = searchParams.get("duration");
  const address = searchParams.get("address");
  const description = searchParams.get("description");

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profissional não encontrado</h2>
          <p className="text-gray-600">O profissional solicitado não existe.</p>
        </div>
      </div>
    );
  }

  // Formatar data para exibição
  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  // Calcular preço total
  const totalPrice = professional.hourlyRate * parseInt(duration || "0");
  const serviceFee = totalPrice * 0.1;
  const finalPrice = totalPrice + serviceFee;

  // Função para ir direto para o pagamento
  const handleBooking = () => {
    // Passar TODOS os dados já preenchidos
    const params = new URLSearchParams({
      date: date || "",
      time: time || "",
      duration: duration || "",
      address: address || "",
      description: description || "",
    });
    navigate(`/agendar/${professional.id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <ImageWithFallback
                  src={professional.photo}
                  alt={professional.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full border-4 border-white">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{professional.name}</h1>
              <p className="text-lg text-blue-100 mb-3">{professional.experience}</p>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{professional.rating}</span>
                  <span className="text-sm">({professional.reviewCount} avaliações)</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-semibold">{professional.hourlyRate} MT/hora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre</h2>
              <p className="text-gray-700 leading-relaxed">{professional.description}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Habilidades</h2>
              <div className="flex flex-wrap gap-3">
                {professional.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disponibilidade</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {professional.availability.map((day) => (
                  <div
                    key={day}
                    className="px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-center font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Avaliações</h2>
              <div className="space-y-4">
                {/* Mock Reviews */}
                {[
                  {
                    name: "João Pedro",
                    rating: 5,
                    date: "Há 2 dias",
                    comment: "Excelente profissional! Muito pontual e cuidadoso com o trabalho.",
                  },
                  {
                    name: "Mariana Silva",
                    rating: 5,
                    date: "Há 1 semana",
                    comment: "Super recomendo! Trabalho impecável e preço justo.",
                  },
                  {
                    name: "Carlos Eduardo",
                    rating: 4,
                    date: "Há 2 semanas",
                    comment: "Bom serviço, resolveu o problema rapidamente.",
                  },
                ].map((review, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{review.name}</span>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dados do Agendamento - SE EXISTIREM */}
            {date && time && duration && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Seu Agendamento
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Data</div>
                    <div className="font-semibold text-gray-900 capitalize">{formattedDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Horário</div>
                    <div className="font-semibold text-gray-900">{time} - {duration}h de duração</div>
                  </div>
                  {address && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Endereço</div>
                      <div className="font-semibold text-gray-900 text-sm">{address}</div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-green-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Valor do serviço</span>
                      <span className="font-semibold text-gray-900">{totalPrice.toFixed(2)} MT</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Taxa de serviço (10%)</span>
                      <span className="font-semibold text-gray-900">{serviceFee.toFixed(2)} MT</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-green-600">{finalPrice.toFixed(2)} MT</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {professional.hourlyRate} MT
                </div>
                <div className="text-gray-600">por hora</div>
              </div>

              <button
                onClick={handleBooking}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl mb-4"
              >
                Agendar Serviço
              </button>

              <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors mb-6">
                Enviar Mensagem
              </button>

              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Responde em até 2 horas</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Agendamento flexível</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Atende sua região</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-4">Informações de Contato</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">(11) 9 8765-4321</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">contato@exemplo.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
