import { Target, Heart, Users, Award, TrendingUp, Shield } from "lucide-react";

export function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">Sobre a ServCasa</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Transformamos a forma como os moçambicanos encontram e contratam serviços domiciliares, 
            conectando clientes a profissionais qualificados com segurança e praticidade.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nossa Missão</h2>
              <p className="text-gray-600 leading-relaxed">
                Facilitar a vida das pessoas conectando-as aos melhores profissionais de 
                serviços domiciliares, garantindo qualidade, segurança e confiabilidade em 
                cada contratação.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nossa Visão</h2>
              <p className="text-gray-600 leading-relaxed">
                Ser a plataforma líder em serviços domiciliares em Moçambique, reconhecida pela 
                excelência no atendimento, inovação tecnológica e compromisso com a satisfação 
                de clientes e profissionais.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nossos Valores</h2>
              <p className="text-gray-600 leading-relaxed">
                Transparência, respeito, qualidade, segurança e compromisso com a satisfação. 
                Acreditamos em relações justas e duradouras entre clientes e profissionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Nossa História</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  A ServCasa nasceu em 2020 com a missão de resolver um problema comum em Moçambique: 
                  a dificuldade de encontrar profissionais qualificados e confiáveis para 
                  serviços domiciliares.
                </p>
                <p>
                  Começámos com apenas 5 profissionais em Maputo. Hoje, contamos 
                  com mais de 500 profissionais verificados a atender em todo Moçambique, 
                  tendo realizado mais de 10 mil serviços com índice de satisfação de 98%.
                </p>
                <p>
                  A nossa plataforma utiliza tecnologia de ponta para garantir a melhor 
                  experiência tanto para clientes quanto para profissionais, incluindo 
                  sistema de verificação rigoroso, avaliações em tempo real e pagamento seguro.
                </p>
                <p>
                  Continuamos a crescer e a inovar, sempre focados em proporcionar a melhor 
                  solução em serviços domiciliares do mercado moçambicano.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600">Profissionais Activos</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">10k+</div>
                  <div className="text-gray-600">Serviços Realizados</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                  <div className="text-4xl font-bold text-purple-600 mb-2">10+</div>
                  <div className="text-gray-600">Cidades Atendidas</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                  <div className="text-4xl font-bold text-orange-600 mb-2">4.9</div>
                  <div className="text-gray-600">Avaliação Média</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que nos diferencia
            </h2>
            <p className="text-xl text-gray-600">
              Compromisso com excelência em cada detalhe
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Verificação Rigorosa
              </h3>
              <p className="text-gray-600">
                Todos os profissionais passam por verificação de antecedentes criminais, 
                documentação e qualificações profissionais.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Garantia de Qualidade
              </h3>
              <p className="text-gray-600">
                Se não ficar satisfeito com o serviço, garantimos a reexecução 
                sem custo adicional.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Suporte Dedicado
              </h3>
              <p className="text-gray-600">
                Equipa de suporte disponível 7 dias por semana para o ajudar a si e 
                aos profissionais.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Tecnologia Avançada
              </h3>
              <p className="text-gray-600">
                Plataforma moderna com agendamento inteligente, pagamento seguro e 
                sistema de avaliações.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Valorização Profissional
              </h3>
              <p className="text-gray-600">
                Acreditamos em relações justas e trabalhamos para valorizar o trabalho 
                dos profissionais.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Foco no Cliente
              </h3>
              <p className="text-gray-600">
                A sua satisfação é a nossa prioridade. Trabalhamos constantemente para 
                melhorar a experiência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nossa Equipa</h2>
            <p className="text-xl text-gray-600">
              Profissionais dedicados a trabalhar para si
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Users className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Equipa Multidisciplinar
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A nossa equipa é composta por especialistas em tecnologia, atendimento ao cliente, 
              recursos humanos e gestão de qualidade, todos comprometidos em oferecer a melhor 
              experiência para clientes e profissionais em todo Moçambique.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
