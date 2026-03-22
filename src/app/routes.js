import { createBrowserRouter } from "react-router-dom";
import { Root } from "./Root";
import { LandingHome } from "./pages/LandingHome";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Services } from "./pages/Services";
import { SelectDateTime } from "./pages/SelectDateTime";
import { AvailableProfessionals } from "./pages/AvailableProfessionals";
import { ProfessionalDetail } from "./pages/ProfessionalDetail";
import { Booking } from "./pages/Booking";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingHome },
      { path: "sobre", Component: About },
      { path: "contato", Component: Contact },
      { path: "servicos", Component: Services },
      { path: "categoria/:categoryId", Component: SelectDateTime },
      { path: "categoria/:categoryId/profissionais", Component: AvailableProfessionals },
      { path: "profissional/:professionalId", Component: ProfessionalDetail },
      { path: "agendar/:professionalId", Component: Booking },
    ],
  },
]);
