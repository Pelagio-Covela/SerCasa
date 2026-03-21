import { Outlet, useLocation } from "react-router";
import { Header } from "./components/Header";

export function Root() {
  const location = useLocation();
  const hideHeader = location.pathname.includes("/agendar/");

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && <Header />}
      <Outlet />
    </div>
  );
}
