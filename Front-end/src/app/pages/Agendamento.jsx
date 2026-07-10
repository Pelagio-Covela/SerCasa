import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProfissional, criarAgendamento } from "../api";
import { Calendar, Clock, MapPin, CreditCard, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Agendamento() {
  const { profissionalId } = useParams();
  const navegar = useNavigate();
  const [parametrosPesquisa] = useSearchParams();
  const [profissional, setProfissional] = useState(null);
  const [confirmado, definirConfirmado] = useState(false);
  const [nomeCliente, definirNomeCliente] = useState("");
  const [telefone, definirTelefone] = useState("");
  const [erroEnvio, definirErroEnvio] = useState("");
  const [enviando, definirEnviando] = useState(false);

  const data = parametrosPesquisa.get("data") || "";
  const hora = parametrosPesquisa.get("hora") || "";
  const duracao = parametrosPesquisa.get("duracao") || "2";
  const endereco = parametrosPesquisa.get("endereco") || "";
  const descricao = parametrosPesquisa.get("descricao") || "";
  const latitude = parametrosPesquisa.get("latitude") || "";
  const longitude = parametrosPesquisa.get("longitude") || "";

  useEffect(() => {
    getProfissional(profissionalId).then(setProfissional);
  }, [profissionalId]);

  if (!profissional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profissional não encontrado</h2>
        </div>
      </div>
    );
  }

  const totalServico = profissional.precoPorHora * parseInt(duracao);
  const taxaServico = totalServico * 0.1;
  const precoFinal = totalServico + taxaServico;

  const dataFormatada = data
    ? new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  const aoSubmeter = async (evento) => {
    evento.preventDefault();
    definirErroEnvio("");

    if (!nomeCliente.trim() || !telefone.trim()) {
      definirErroEnvio("Preencha o seu nome e telefone de contacto antes de continuar.");
      return;
    }

    definirEnviando(true);
    try {
      await criarAgendamento({
        profissional_id: profissionalId,
        nome_cliente: nomeCliente,
        telefone,
        data,
        hora,
        endereco,
        descricao,
        latitude: latitude || null,
        longitude: longitude || null,
      });
      definirConfirmado(true);
    } catch (falha) {
      definirErroEnvio(falha.message || "Erro ao confirmar o agendamento. Tente novamente.");
    } finally {
      definirEnviando(false);
    }
  };

  if (confirmado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Agendamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            O seu serviço foi agendado com sucesso. Receberá uma confirmação por e-mail.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">Profissional</p>
            <p className="font-semibold text-gray-900 mb-3">{profissional.nome}</p>
            <p className="text-sm text-gray-600 mb-1">Data e Hora</p>
            <p className="font-semibold text-gray-900 mb-3">{dataFormatada} às {hora}</p>
            <p className="text-sm text-gray-600 mb-1">Duração</p>
            <p className="font-semibold text-gray-900 mb-3">{duracao} horas</p>
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-green-600">{precoFinal.toFixed(2)} MT</p>
          </div>
          <button
            onClick={() => navegar("/")}
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
        {/* Cabeçalho */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <ImageWithFallback
                src={profissional.foto}
                alt={profissional.nome}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profissional.nome}</h2>
              <p className="text-gray-600">{profissional.experiencia}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{profissional.precoPorHora} MT</div>
              <div className="text-sm text-gray-600">por hora</div>
            </div>
          </div>
        </div>

        {/* Resumo do agendamento */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4 text-xl">Resumo do Agendamento</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">Data e Horário</span>
              </div>
              <p className="text-gray-900 font-medium capitalize">{dataFormatada}</p>
              <p className="text-gray-900 font-medium">{hora} - {duracao}h de duração</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-semibold">Endereço</span>
              </div>
              <p className="text-gray-900 font-medium">{endereco}</p>
            </div>
          </div>
          {descricao && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Detalhes do Serviço</p>
              <p className="text-gray-900">{descricao}</p>
            </div>
          )}
        </div>

        {/* Dados de contacto */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Dados de Contacto</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Nome completo *</label>
              <input
                type="text"
                required
                value={nomeCliente}
                onChange={(e) => definirNomeCliente(e.target.value)}
                placeholder="O seu nome"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Telefone *</label>
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => definirTelefone(e.target.value)}
                placeholder="+258 8X XXX XXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Estes dados são usados pelo profissional e pela equipa da ServCasa para entrar em contacto sobre a sua visita.
          </p>
        </div>

        {/* Pagamento */}
        <form onSubmit={aoSubmeter} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Pagamento
          </h3>
          {erroEnvio && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {erroEnvio}
            </div>
          )}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Número do Cartão *</label>
              <input
                type="text"
                required
                placeholder="0000 0000 0000 0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Validade *</label>
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
              <label className="block text-gray-700 font-semibold mb-2">Nome no Cartão *</label>
              <input
                type="text"
                required
                placeholder="Nome como aparece no cartão"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Resumo do pagamento */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Resumo do Pagamento</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Valor por hora:</span>
                  <span>{profissional.precoPorHora.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Duração:</span>
                  <span>{duracao} horas</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{totalServico.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxa de serviço (10%):</span>
                  <span>{taxaServico.toFixed(2)} MT</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{precoFinal.toFixed(2)} MT</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {enviando ? "A confirmar..." : "Confirmar Pagamento"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Ao confirmar, concorda com os nossos termos de serviço e política de privacidade.
              Os seus dados de pagamento são processados de forma segura.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}