import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui seria integrado com o backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">Entre em Contacto</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Estamos aqui para ajudar! Entre em contacto connosco através de qualquer um dos 
            canais abaixo ou preencha o formulário.
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
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
                      Av. Julius Nyerere, 1000<br />
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
                      Segunda a Sexta: 8h às 18h<br />
                      Sábado: 9h às 13h<br />
                      Domingo: Fechado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Envie uma Mensagem
                </h2>

                {submitted ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Mensagem Enviada!
                    </h3>
                    <p className="text-gray-600">
                      Obrigado pelo contacto. Responderemos em breve!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="seuemail@exemplo.co.mz"
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
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccione um assunto</option>
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
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-600">
              Confira as respostas para as dúvidas mais comuns
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Como funciona a contratação de serviços?",
                a: "É simples! Escolha o serviço, seleccione data e horário, escolha o profissional disponível e confirme o agendamento.",
              },
              {
                q: "Os profissionais são verificados?",
                a: "Sim! Todos os profissionais passam por verificação rigorosa de antecedentes, documentação e qualificações.",
              },
              {
                q: "Como funciona o pagamento?",
                a: "O pagamento é feito de forma segura através da plataforma, com diversas opções como cartão de crédito, débito e M-Pesa.",
              },
              {
                q: "E se eu não ficar satisfeito com o serviço?",
                a: "Oferecemos garantia de satisfação. Se não ficar satisfeito, refazemos o serviço sem custo adicional.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
