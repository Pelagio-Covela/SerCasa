import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Wallet, Landmark, Loader2, Star } from "lucide-react";
import { getFatura, submeterPagamento, submeterAvaliacao } from "../api";

function formatarValor(v) {
  return `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
}

export function PagamentoServico() {
  const { token } = useParams();
  const [fatura, definirFatura] = useState(null);
  const [estado, definirEstado] = useState("carregando"); // carregando | ok | erro
  const [erro, definirErro] = useState("");

  const [metodo, definirMetodo] = useState("carteira_movel");
  const [numeroCarteira, definirNumeroCarteira] = useState("");
  const [banco, definirBanco] = useState("");
  const [conta, definirConta] = useState("");
  const [titular, definirTitular] = useState("");
  const [enviando, definirEnviando] = useState(false);
  const [submetido, definirSubmetido] = useState(false);
  const [erroSubmissao, definirErroSubmissao] = useState("");

  const [notaAvaliacao, definirNotaAvaliacao] = useState(0);
  const [notaEmHover, definirNotaEmHover] = useState(0);
  const [comentarioAvaliacao, definirComentarioAvaliacao] = useState("");
  const [avaliacaoEnviada, definirAvaliacaoEnviada] = useState(false);
  const [enviandoAvaliacao, definirEnviandoAvaliacao] = useState(false);
  const [erroAvaliacao, definirErroAvaliacao] = useState("");

  useEffect(() => {
    getFatura(token)
      .then((dados) => {
        definirFatura(dados);
        definirEstado("ok");
      })
      .catch((falha) => {
        definirErro(falha.message);
        definirEstado("erro");
      });
  }, [token]);

  async function lidarComSubmeter(evento) {
    evento.preventDefault();
    definirErroSubmissao("");

    const detalhes = metodo === "carteira_movel"
      ? { numero: numeroCarteira, titular }
      : { banco, conta, titular };

    if (metodo === "carteira_movel" && (!numeroCarteira.trim() || !titular.trim())) {
      definirErroSubmissao("Preencha o número da carteira e o nome do titular.");
      return;
    }
    if (metodo === "conta_bancaria" && (!banco.trim() || !conta.trim() || !titular.trim())) {
      definirErroSubmissao("Preencha o banco, o número de conta e o nome do titular.");
      return;
    }

    definirEnviando(true);
    try {
      await submeterPagamento(token, metodo, detalhes);
      definirSubmetido(true);
    } catch (falha) {
      definirErroSubmissao(falha.message);
    } finally {
      definirEnviando(false);
    }
  }

  async function lidarComEnviarAvaliacao(evento) {
    evento.preventDefault();
    if (notaAvaliacao < 1) {
      definirErroAvaliacao("Escolha uma classificação de 1 a 5 estrelas.");
      return;
    }
    definirEnviandoAvaliacao(true);
    definirErroAvaliacao("");
    try {
      await submeterAvaliacao(token, notaAvaliacao, comentarioAvaliacao);
      definirAvaliacaoEnviada(true);
    } catch (falha) {
      // se já foi avaliado antes, trata como "já enviado" em vez de mostrar erro
      if (falha.message?.includes("já foi avaliado")) {
        definirAvaliacaoEnviada(true);
      } else {
        definirErroAvaliacao(falha.message);
      }
    } finally {
      definirEnviandoAvaliacao(false);
    }
  }

  if (estado === "carregando") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (estado === "erro") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Fatura não encontrada</h2>
          <p className="text-gray-600 text-sm">{erro}</p>
        </div>
      </div>
    );
  }

  const jaPago = fatura.status_pagamento === "pago";
  const jaSubmetido = submetido || fatura.status_pagamento === "processando";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pagamento do serviço</h1>
          <p className="text-gray-600 text-sm mt-1">ServCasa</p>
        </div>

        {/* Fatura */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Fatura</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Cliente</span><span className="font-medium text-gray-900">{fatura.nome_cliente}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Serviço</span><span className="font-medium text-gray-900">{fatura.nome_categoria}</span></div>
            {fatura.nome_profissional && (
              <div className="flex justify-between"><span className="text-gray-600">Profissional</span><span className="font-medium text-gray-900">{fatura.nome_profissional}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-600">Data</span><span className="font-medium text-gray-900">{new Date(fatura.data).toLocaleDateString("pt-PT", { timeZone: "UTC" })}</span></div>
            {fatura.duracao_minutos != null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Duração</span>
                <span className="font-medium text-gray-900">
                  {fatura.duracao_minutos >= 60 ? `${Math.floor(fatura.duracao_minutos / 60)}h ${fatura.duracao_minutos % 60}min` : `${fatura.duracao_minutos}min`}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total a pagar</span>
            <span className="text-2xl font-bold text-blue-600">{formatarValor(fatura.valor_total)}</span>
          </div>
        </div>

        {/* Estado / formulário */}
        {jaPago ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-green-900 mb-1">Pagamento confirmado</h3>
            <p className="text-green-700 text-sm">Este serviço já está marcado como pago. Obrigado!</p>
          </div>
        ) : jaSubmetido ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold text-blue-900 mb-1">Dados recebidos</h3>
            <p className="text-blue-700 text-sm">Recebemos os seus dados de pagamento. A nossa equipa vai confirmar em breve.</p>
          </div>
        ) : (
          <form onSubmit={lidarComSubmeter} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Como deseja pagar?</h3>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => definirMetodo("carteira_movel")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${metodo === "carteira_movel" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
              >
                <Wallet className={`w-6 h-6 ${metodo === "carteira_movel" ? "text-blue-600" : "text-gray-400"}`} />
                <span className="text-sm font-medium">Carteira Móvel</span>
              </button>
              <button
                type="button"
                onClick={() => definirMetodo("conta_bancaria")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${metodo === "conta_bancaria" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
              >
                <Landmark className={`w-6 h-6 ${metodo === "conta_bancaria" ? "text-blue-600" : "text-gray-400"}`} />
                <span className="text-sm font-medium">Conta Bancária</span>
              </button>
            </div>

            {metodo === "carteira_movel" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Número da carteira (M-Pesa / e-Mola) *</label>
                  <input
                    type="tel" value={numeroCarteira} onChange={(e) => definirNumeroCarteira(e.target.value)}
                    placeholder="+258 8X XXX XXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Nome do titular *</label>
                  <input
                    type="text" value={titular} onChange={(e) => definirTitular(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Banco *</label>
                  <input
                    type="text" value={banco} onChange={(e) => definirBanco(e.target.value)}
                    placeholder="ex: BCI, Millennium bim, Standard Bank..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Número de conta / NIB *</label>
                  <input
                    type="text" value={conta} onChange={(e) => definirConta(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Nome do titular *</label>
                  <input
                    type="text" value={titular} onChange={(e) => definirTitular(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {erroSubmissao && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {erroSubmissao}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60"
            >
              {enviando ? "A enviar..." : "Enviar dados de pagamento"}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Estes dados são usados apenas para a nossa equipa confirmar e processar o seu pagamento.
            </p>
          </form>
        )}

        {/* Avaliação de satisfação — só faz sentido mostrar depois do
            pagamento estar feito/submetido */}
        {(jaPago || jaSubmetido) && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6">
            {avaliacaoEnviada ? (
              <div className="text-center py-2">
                <CheckCircle className="w-9 h-9 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 mb-1">Obrigado pela avaliação!</h3>
                <p className="text-gray-600 text-sm">Ela será publicada no site após revisão da nossa equipa.</p>
              </div>
            ) : (
              <form onSubmit={lidarComEnviarAvaliacao}>
                <h3 className="font-bold text-gray-900 mb-1">Como foi o serviço?</h3>
                <p className="text-gray-500 text-sm mb-4">A sua avaliação ajuda outros clientes a escolher com confiança.</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => definirNotaAvaliacao(valor)}
                      onMouseEnter={() => definirNotaEmHover(valor)}
                      onMouseLeave={() => definirNotaEmHover(0)}
                      className="p-1"
                    >
                      <Star
                        className="w-9 h-9 transition-colors"
                        fill={(notaEmHover || notaAvaliacao) >= valor ? "#facc15" : "none"}
                        color={(notaEmHover || notaAvaliacao) >= valor ? "#facc15" : "#d1d5db"}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comentarioAvaliacao}
                  onChange={(e) => definirComentarioAvaliacao(e.target.value)}
                  rows={3}
                  placeholder="Conte como foi a sua experiência (opcional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                {erroAvaliacao && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {erroAvaliacao}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={enviandoAvaliacao}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-60"
                >
                  {enviandoAvaliacao ? "A enviar..." : "Enviar avaliação"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
