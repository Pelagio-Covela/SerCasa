import { Link } from "react-router-dom";
import { Home, Shield, Clock, Star, CheckCircle, ArrowRight, Phone, Mail, MapPin } from "lucide-react";

export function LandingHome() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Serviços Domiciliares com Qualidade e Segurança
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Conectamos você aos melhores profissionais para cuidar da sua casa. 
                Rápido, seguro e confiável.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/servicos"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Solicitar Serviço
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/sobre"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center"
                >
                  Saiba Mais
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">500+</div>
                    <div className="text-blue-100">Profissionais</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">10k+</div>
                    <div className="text-blue-100">Serviços</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">4.9</div>
                    <div className="text-blue-100">Avaliação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">98%</div>
                    <div className="text-blue-100">Satisfação</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a ServCasa?
            </h2>
            <p className="text-xl text-gray-600">
              Oferecemos a melhor experiência em contratação de serviços domiciliares
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Profissionais Verificados
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Todos os profissionais passam por rigorosa verificação de antecedentes, 
                documentação e qualificações antes de ingressar na plataforma.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Agendamento Flexível
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Escolha o melhor horário para você. Nossos profissionais estão disponíveis 
                de segunda a domingo, inclusive feriados.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Qualidade Garantida
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sistema de avaliação em tempo real e garantia de satisfação. 
                Se não ficar satisfeito, refazemos o serviço sem custo adicional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nossos Serviços
            </h2>
            <p className="text-xl text-gray-600">
              Cobertura completa para todas as necessidades da sua casa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Empregada Doméstica", icon: "🏠", color: "blue" },
              { name: "Encanador", icon: "🔧", color: "cyan" },
              { name: "Cozinheiro", icon: "👨‍🍳", color: "orange" },
              { name: "Jardineiro", icon: "🌱", color: "green" },
              { name: "Eletricista", icon: "⚡", color: "yellow" },
              { name: "Outros Serviços", icon: "✨", color: "purple" },
            ].map((service) => (
              <div
                key={service.name}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              Ver Todos os Serviços
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona?
            </h2>
            <p className="text-xl text-gray-600">
              Solicitar um serviço nunca foi tão fácil
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Escolha o Serviço",
                description: "Selecione o tipo de serviço que você precisa",
              },
              {
                step: "2",
                title: "Data e Horário",
                description: "Escolha quando você quer que o serviço seja realizado",
              },
              {
                step: "3",
                title: "Escolha o Profissional",
                description: "Veja profissionais disponíveis e escolha o melhor",
              },
              {
                step: "4",
                title: "Confirme o Agendamento",
                description: "Finalize e aguarde a confirmação",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Oliveira",
                text: "Excelente serviço! Contratei uma empregada doméstica e fiquei muito satisfeita. Profissional pontual e cuidadosa.",
                rating: 5,
              },
              {
                name: "João Santos",
                text: "O encanador resolveu meu problema rapidamente. Plataforma muito fácil de usar e profissionais qualificados.",
                rating: 5,
              },
              {
                name: "Ana Paula",
                text: "Recomendo! Já utilizei vários serviços e sempre tive ótimas experiências. Segurança e qualidade garantidas.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-bold text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para contratar um serviço?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de clientes satisfeitos e encontre o profissional ideal hoje mesmo
          </p>
          <Link
            to="/servicos"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Sobre a ServCasa</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
                <p>
                  A ServCasa nasceu com a missão de transformar a forma como os moçambicanos 
                  encontram e contratam serviços domiciliares. Sabemos como pode ser difícil 
                  encontrar profissionais qualificados e confiáveis.
                </p>
                <p>
                  Por isso, criámos uma plataforma moderna que conecta clientes a profissionais 
                  verificados em Maputo e em todo Moçambique, garantindo segurança, qualidade 
                  e transparência em cada serviço.
                </p>
                <p>
                  Todos os nossos profissionais passam por verificação rigorosa de documentação 
                  e antecedentes, para que possa contratar com total confiança.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Profissionais</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">10k+</div>
                  <div className="text-sm text-gray-600">Serviços</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">4.9★</div>
                  <div className="text-sm text-gray-600">Avaliação</div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
                >
                  Ver mais
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-6 text-center shadow-md">
                  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Segurança</h3>
                  <p className="text-sm text-gray-600">Profissionais verificados</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-md">
                  <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Rapidez</h3>
                  <p className="text-sm text-gray-600">Agendamento fácil</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-md">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Qualidade</h3>
                  <p className="text-sm text-gray-600">Serviço garantido</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-md">
                  <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Confiança</h3>
                  <p className="text-sm text-gray-600">98% satisfação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contactos Section */}
      <section id="contactos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contacto</h2>
            <p className="text-xl text-gray-600">
              Estamos aqui para ajudar. Fale connosco!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-xl">Telefone</h3>
              <p className="text-gray-600 mb-1">+258 84 000 0000</p>
              <p className="text-gray-600">+258 82 000 0000</p>
              <p className="text-sm text-gray-500 mt-3">
                Segunda a Sexta: 8h às 18h
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-xl">E-mail</h3>
              <p className="text-gray-600 mb-1">geral@servcasa.co.mz</p>
              <p className="text-gray-600">suporte@servcasa.co.mz</p>
              <p className="text-sm text-gray-500 mt-3">
                Resposta em até 24 horas
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-xl">Localização</h3>
              <p className="text-gray-600">
                Av. Julius Nyerere, 1000<br />
                Maputo, Moçambique
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Visite-nos!
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              Enviar Mensagem
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

