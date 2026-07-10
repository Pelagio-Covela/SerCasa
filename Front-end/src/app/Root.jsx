import { Outlet, useLocation } from "react-router-dom";
import { Cabecalho } from "./components/Cabecalho";

export function Root() {
  const localizacao = useLocation();
  const esconderCabecalho = localizacao.pathname.includes("/agendar/");

  return (
    <div className="min-h-screen bg-gray-50">
      {!esconderCabecalho && <Cabecalho />}
      <Outlet />
    </div>
  );
}