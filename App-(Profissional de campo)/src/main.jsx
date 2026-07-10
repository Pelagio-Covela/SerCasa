import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/theme.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")).render(<App />);
