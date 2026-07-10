import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Cabecalho() {
  const localizacao = useLocation();
  const [menuMovelAberto, definirMenuMovelAberto] = useState(false);

  const itensNavegacao = [
    { caminho: "/", etiqueta: "Início" },
    { caminho: "/servicos", etiqueta: "Serviços" },
    { caminho: "/sobre", etiqueta: "Sobre" },
    { caminho: "/contacto", etiqueta: "Contacto" },
  ];

  const estaAtivo = (caminho) => {
    if (caminho === "/") {
      return localizacao.pathname === "/";
    }
    return localizacao.pathname.startsWith(caminho);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logótipo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ServCasa" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ServCasa</h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                Serviços Domiciliários
              </p>
            </div>
          </Link>

          {/* Navegação desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {itensNavegacao.map((item) => (
              <Link
                key={item.caminho}
                to={item.caminho}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  estaAtivo(item.caminho)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.etiqueta}
              </Link>
            ))}
          </nav>

          {/* Botão principal */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/servicos"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            >
              Solicitar Serviço
            </Link>
          </div>

          {/* Botão menu móvel */}
          <button
            onClick={() => definirMenuMovelAberto(!menuMovelAberto)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {menuMovelAberto ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Navegação móvel */}
        {menuMovelAberto && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              {itensNavegacao.map((item) => (
                <Link
                  key={item.caminho}
                  to={item.caminho}
                  onClick={() => definirMenuMovelAberto(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    estaAtivo(item.caminho)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.etiqueta}
                </Link>
              ))}
              <Link
                to="/servicos"
                onClick={() => definirMenuMovelAberto(false)}
                className="mt-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-center"
              >
                Solicitar Serviço
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}