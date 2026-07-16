import { useState } from "react";
import { Search, Calendar, Clock, MapPin, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { getMeusAgendamentos } from "../api";

const STATUS_LABEL = {
  pendente: { texto: "Pendente", cor: "bg-amber-100 text-amber-700" },
  aceite: { texto: "Confirmado", cor: "bg-blue-100 text-blue-700" },
  em_execucao: { texto: "Em execução", cor: "bg-indigo-100 text-indigo-700" },
  concluido: { texto: "Concluído", cor: "bg-green-100 text-green-700" },
  cancelado: { texto: "Cancelado", cor: "bg-red-100 text-red-700" },
};

function formatarValor(v) {
  return `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
}

export function MeusAgendamentos() {
  const [telefone, definirTelefone] = useState("");
  const [resultado, definirResultado] = useState(null);
  const [carregando, definirCarregando] = useState(false);
  const [erro, definirErro] = useState("");

  async function lidarComBusca(evento) {
    evento.preventDefault();
    if (!telefone.trim()) return;
    definirCarregando(true);
    definirErro("");
    try {
      const dados = await getMeusAgendamentos(telefone);
      definirResultado(dados);
    } catch (falha) {
      definirErro(falha.message || "Erro ao consultar. Tente novamente.");
      definirResultado(null);
    } finally {
      definirCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Meus Agendamentos</h1>
          <p className="text-blue-100">
            Consulte os seus serviços e contas a pagar usando o número de telefone do agendamento.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <form onSubmit={lidarComBusca} className="bg-white rounded-xl shadow-lg p-4 flex gap-3 border border-gray-100">
          <input
            type="tel"
            value={telefone}
            onChange={(e) => definirTelefone(e.target.value)}
            placeholder="Nº de telefone usado no agendamento (ex: +258 84 123 4567)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={carregando}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {carregando ? "A procurar..." : "Consultar"}
          </button>
        </form>

        {erro && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}
      </div>

      {resultado && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Resumo de contas a pagar */}
          {resultado.contasAPagar > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-900 font-bold text-lg">
                    Conta a pagar: {formatarValor(resultado.totalAPagar)}
                  </p>
                  <p className="text-amber-700 text-sm">
                    {resultado.contasAPagar} serviço(s) concluído(s) com pagamento pendente.
                    O pagamento é feito diretamente à ServCasa.
                  </p>
                </div>
              </div>
            </div>
          ) : resultado.total > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-2 text-green-800 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Não tem nenhuma conta pendente. Tudo em dia!
            </div>
          ) : null}

          {resultado.total === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-gray-600">Confirme se digitou o mesmo número usado ao agendar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resultado.agendamentos.map((a) => {
                const st = STATUS_LABEL[a.status] || STATUS_LABEL.pendente;
                const aPagar = a.status === "concluido" && a.status_pagamento === "pendente";
                return (
                  <div key={a.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{a.nome_categoria || "Serviço"}</h3>
                        {a.nome_profissional && (
                          <p className="text-sm text-gray-600">com {a.nome_profissional}</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${st.cor}`}>
                        {st.texto}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(a.data).toLocaleDateString("pt-PT", { timeZone: "UTC" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {(a.hora || "").slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {a.endereco}
                      </span>
                    </div>

                    {a.status === "concluido" && a.valor_total != null && (
                      <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${aPagar ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
                        <div>
                          <p className={`text-xs font-semibold uppercase ${aPagar ? "text-amber-600" : "text-green-600"}`}>
                            {aPagar ? "Valor a pagar" : "Valor pago"}
                          </p>
                          <p className={`text-lg font-bold ${aPagar ? "text-amber-800" : "text-green-800"}`}>
                            {formatarValor(a.valor_total)}
                          </p>
                        </div>
                        {a.duracao_minutos != null && (
                          <p className="text-xs text-gray-500">
                            {a.duracao_minutos >= 60
                              ? `${Math.floor(a.duracao_minutos / 60)}h ${a.duracao_minutos % 60}min`
                              : `${a.duracao_minutos}min`} de serviço
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
