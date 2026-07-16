import { createBrowserRouter } from "react-router-dom";
import { Root } from "./Root";
import { LandingHome } from "./pages/LandingHome";
import { Sobre } from "./pages/Sobre";
import { Contacto } from "./pages/Contacto";
import { Servicos } from "./pages/Servicos";
import { SelecionarDataHora } from "./pages/SelecionarDataHora";
import { ProfissionaisDisponiveis } from "./pages/ProfissionaisDisponiveis";
import { DetalheProfissional } from "./pages/DetalheProfissional";
import { Agendamento } from "./pages/Agendamento";
import { PagamentoServico } from "./pages/PagamentoServico";

export const rotas = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingHome },
      { path: "sobre", Component: Sobre },
      { path: "contacto", Component: Contacto },
      { path: "servicos", Component: Servicos },
      { path: "pagamento/:token", Component: PagamentoServico },
      { path: "categoria/:categoriaId", Component: SelecionarDataHora },
      { path: "categoria/:categoriaId/profissionais", Component: ProfissionaisDisponiveis },
      { path: "profissional/:profissionalId", Component: DetalheProfissional },
      { path: "agendar/:profissionalId", Component: Agendamento },
    ],
  },
]);