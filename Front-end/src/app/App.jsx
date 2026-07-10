import { RouterProvider } from "react-router-dom";
import { rotas } from "./routes";

export default function App() {
  return <RouterProvider router={rotas} />;
}