import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle } from "lucide-react";

export function Rodape() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Marca */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="ServCasa" className="w-10 h-10 rounded-lg" />
              <span className="text-white font-bold text-lg">ServCasa</span>
            </Link>
            <p className="text-sm text-gray-400">
              A plataforma que liga você aos melhores profissionais de serviços domésticos em Moçambique.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Início</Link></li>
              <li><Link to="/servicos" className="hover:text-white transition-colors">Serviços</Link></li>
              <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre</Link></li>
              <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categorias</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/servicos" className="hover:text-white transition-colors">Profissional Doméstico</Link></li>
              <li><Link to="/servicos" className="hover:text-white transition-colors">Canalizador</Link></li>
              <li><Link to="/servicos" className="hover:text-white transition-colors">Eletricista</Link></li>
              <li><Link to="/servicos" className="hover:text-white transition-colors">Ver todas</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <a href="https://wa.link/ye9hma" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Falar no WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:info@digilab.co.mz" className="hover:text-white transition-colors">info@digilab.co.mz</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Maputo, Moçambique</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {anoAtual} ServCasa. Todos os direitos reservados.</p>
          <p>Desenvolvido por Digilab, Lda</p>
        </div>
      </div>
    </footer>
  );
}
