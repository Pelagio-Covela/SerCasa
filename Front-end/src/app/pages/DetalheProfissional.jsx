import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfissional, getAvaliacoesProfissional } from "../api";
import { Star, Banknote, Calendar, Clock, MapPin, Phone, Mail, Award, MessageCircle } from "lucide-react";
import { AvatarProfissional } from "../components/AvatarProfissional";

export function DetalheProfissional() {
  const { profissionalId } = useParams();
  const navegar = useNavigate();
  const [parametrosPesquisa] = useSearchParams();
  const [profissional, setProfissional] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);

  const data = parametrosPesquisa.get("data") || "";
  const hora = parametrosPesquisa.get("hora") || "";
  const endereco = parametrosPesquisa.get("endereco") || "";
  const descricao = parametrosPesquisa.get("descricao") || "";
  const latitude = parametrosPesquisa.get("latitude") || "";
  const longitude = parametrosPesquisa.get("longitude") || "";

  useEffect(() => {
    getProfissional(profissionalId)
      .then(setProfissional)
      .finally(() => setCarregando(false));
    getAvaliacoesProfissional(profissionalId).then((r) => setAvaliacoes(r.avaliacoes || []));
  }, [profissionalId]);

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-500">A carregar...</div>;
  if (!profissional) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-900">Profissional não encontrado</h2>
    </div>
  );

  const dataFormatada = data
    ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  const aoAgendar = () => {
    const params = new URLSearchParams({
      data: data || "",
      hora: hora || "",
      endereco: endereco || "",
      descricao: descricao || "",
      latitude: latitude || "",
      longitude: longitude || "",
    });
    navegar(`/agendar/${profissional.id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho do perfil */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <AvatarProfissional
                  nome={profissional.nome}
                  foto={profissional.foto}
                  className="text-3xl"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full border-4 border-white">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profissional.nome}</h1>
              <p className="text-lg text-blue-100 mb-3">{profissional.experiencia}</p>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{profissional.avaliacao}</span>
                  <span className="text-sm">({profissional.totalAvaliacoes} avaliações)</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Banknote className="w-5 h-5" />
                  <span className="font-semibold">{profissional.precoPorHora} MT/hora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre</h2>
              <p className="text-gray-700 leading-relaxed">{profissional.descricao}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Valências</h2>
              <div className="flex flex-wrap gap-3">
                {profissional.competencias.map((competencia) => (
                  <span key={competencia} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                    {competencia}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disponibilidade</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {profissional.disponibilidade.map((dia) => (
                  <div key={dia} className="px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-center font-medium">
                    {{ Terca: "Terça", Sabado: "Sábado" }[dia] || dia}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Avaliações</h2>
              {avaliacoes.length === 0 ? (
                <p className="text-gray-500 text-sm">Ainda sem avaliações públicas para este profissional.</p>
              ) : (
                <div className="space-y-4">
                  {avaliacoes.map((avaliacao, indice) => (
                    <div key={indice} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{avaliacao.nome_cliente || "Cliente ServCasa"}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(avaliacao.criado_em).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: avaliacao.nota }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      {avaliacao.comentario && <p className="text-gray-700">{avaliacao.comentario}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barra lateral */}
          <div className="space-y-6">
            {data && hora && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  O seu Agendamento
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Data</div>
                    <div className="font-semibold text-gray-900 capitalize">{dataFormatada}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Horário</div>
                    <div className="font-semibold text-gray-900">{hora}</div>
                  </div>
                  {endereco && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Endereço</div>
                      <div className="font-semibold text-gray-900 text-sm">{endereco}</div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 pt-3 border-t border-green-200">
                    O valor final é calculado com base no tempo real do serviço e enviado por e-mail (com o link de pagamento) assim que o profissional concluir o trabalho.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">{profissional.precoPorHora} MT</div>
                <div className="text-gray-600">por hora</div>
              </div>
              <button
                onClick={aoAgendar}
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
                  <span className="text-sm">Atende a sua zona</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-4">Informações de Contacto</h3>
              <div className="space-y-3">
                <a
                  href="https://wa.link/ye9hma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">Falar no WhatsApp</span>
                </a>
                <a
                  href="mailto:info@digilab.co.mz"
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">info@digilab.co.mz</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}