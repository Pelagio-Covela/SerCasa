import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";

export function Contacto() {
  const [dadosFormulario, definirDadosFormulario] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: "",
  });

  const [foiSubmetido, definirFoiSubmetido] = useState(false);

  const aoSubmeter = async (evento) => {
  evento.preventDefault();
  await enviarContacto({
    nome: dadosFormulario.nome,
    email: dadosFormulario.email,
    mensagem: `[${dadosFormulario.assunto}] ${dadosFormulario.mensagem}`,
  });
  definirFoiSubmetido(true);
  setTimeout(() => {
    definirFoiSubmetido(false);
    definirDadosFormulario({ nome: "", email: "", telefone: "", assunto: "", mensagem: "" });
  }, 3000);
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Secção principal */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">Entre em Contacto</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Estamos aqui para ajudar. Entre em contacto connosco através de qualquer um dos
            canais abaixo ou preencha o formulário.
          </p>
        </div>
      </section>

      {/* Informações de contacto e formulário */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informações de contacto */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Informações de Contacto
                </h2>
                <p className="text-gray-600 mb-6">
                  Pode entrar em contacto connosco através dos seguintes canais:
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Telefone</h3>
                    <p className="text-gray-600">+258 84 000 0000</p>
                    <p className="text-gray-600">+258 82 000 0000</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">E-mail</h3>
                    <p className="text-gray-600">geral@servcasa.co.mz</p>
                    <p className="text-gray-600">suporte@servcasa.co.mz</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Morada</h3>
                    <p className="text-gray-600">
                      Av. Julius Nyerere, 1000
                      <br />
                      Maputo, Moçambique
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Horário de Atendimento</h3>
                    <p className="text-gray-600">
                      Segunda a Sexta: 8h às 18h
                      <br />
                      Sábado: 9h às 13h
                      <br />
                      Domingo: Encerrado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de contacto */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Envie uma Mensagem
                </h2>

                {foiSubmetido ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Mensagem Enviada
                    </h3>
                    <p className="text-gray-600">
                      Obrigado pelo seu contacto. Responderemos em breve.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={aoSubmeter} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={dadosFormulario.nome}
                          onChange={(evento) =>
                            definirDadosFormulario({
                              ...dadosFormulario,
                              nome: evento.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="O seu nome"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={dadosFormulario.email}
                          onChange={(evento) =>
                            definirDadosFormulario({
                              ...dadosFormulario,
                              email: evento.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="oseuemail@exemplo.co.mz"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={dadosFormulario.telefone}
                          onChange={(evento) =>
                            definirDadosFormulario({
                              ...dadosFormulario,
                              telefone: evento.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+258 84 0000 000"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Assunto *
                        </label>
                        <select
                          required
                          value={dadosFormulario.assunto}
                          onChange={(evento) =>
                            definirDadosFormulario({
                              ...dadosFormulario,
                              assunto: evento.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione um assunto</option>
                          <option value="duvidas">Dúvidas sobre serviços</option>
                          <option value="suporte">Suporte técnico</option>
                          <option value="profissional">Quero ser profissional</option>
                          <option value="parceria">Parcerias</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={dadosFormulario.mensagem}
                        onChange={(evento) =>
                          definirDadosFormulario({
                            ...dadosFormulario,
                            mensagem: evento.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Escreva a sua mensagem aqui..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Enviar Mensagem
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perguntas frequentes */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-600">
              Consulte as respostas às dúvidas mais comuns
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                pergunta: "Como funciona a contratação de serviços?",
                resposta:
                  "É simples. Escolha o serviço, selecione a data e o horário, escolha o profissional disponível e confirme o agendamento.",
              },
              {
                pergunta: "Os profissionais são verificados?",
                resposta:
                  "Sim. Todos os profissionais passam por uma verificação rigorosa de antecedentes, documentação e qualificações.",
              },
              {
                pergunta: "Como funciona o pagamento?",
                resposta:
                  "O pagamento é efetuado de forma segura através da plataforma, com diferentes opções como cartão de crédito, débito e M-Pesa.",
              },
              {
                pergunta: "E se eu não ficar satisfeito com o serviço?",
                resposta:
                  "Oferecemos garantia de satisfação. Se não ficar satisfeito, voltamos a realizar o serviço sem custo adicional.",
              },
            ].map((item, indice) => (
              <div
                key={indice}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <h3 className="font-bold text-gray-900 mb-2">{item.pergunta}</h3>
                <p className="text-gray-600">{item.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}