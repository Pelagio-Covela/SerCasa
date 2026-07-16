import { Outlet, useLocation } from "react-router-dom";
import { Cabecalho } from "./components/Cabecalho";
import { Rodape } from "./components/Rodape";

export function Root() {
  const localizacao = useLocation();
  const esconderCabecalho = localizacao.pathname.includes("/agendar/");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!esconderCabecalho && <Cabecalho />}
      <div className="flex-1">
        <Outlet />
      </div>
      <Rodape />
    </div>
  );
}