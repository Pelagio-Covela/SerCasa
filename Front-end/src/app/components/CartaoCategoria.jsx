import { Link } from "react-router-dom";
import { Home, Droplet, ChefHat, Leaf, Zap, PaintBucket, Hammer, Ruler, Wind, Shield, Car, Baby, Shirt } from "lucide-react";
import { corDeFundoCategoria } from "../utils/cores";

export function CartaoCategoria({ categoria }) {
  if (!categoria) return null;

  const obterIcone = () => {
    switch (String(categoria.icone || "").trim().toLowerCase()) {
      case "home":
        return <Home className="w-8 h-8 text-white" />;
      case "droplet":
        return <Droplet className="w-8 h-8 text-white" />;
      case "chef-hat":
        return <ChefHat className="w-8 h-8 text-white" />;
      case "leaf":
        return <Leaf className="w-8 h-8 text-white" />;
      case "zap":
        return <Zap className="w-8 h-8 text-white" />;
      case "paint-bucket":
        return <PaintBucket className="w-8 h-8 text-white" />;
      case "hammer":
        return <Hammer className="w-8 h-8 text-white" />;
      case "ruler":
        return <Ruler className="w-8 h-8 text-white" />;
      case "wind":
        return <Wind className="w-8 h-8 text-white" />;
      case "shield":
        return <Shield className="w-8 h-8 text-white" />;
      case "car":
        return <Car className="w-8 h-8 text-white" />;
      case "baby":
        return <Baby className="w-8 h-8 text-white" />;
      case "shirt":
        return <Shirt className="w-8 h-8 text-white" />;
      default:
        return <Home className="w-8 h-8 text-white" />;
    }
  };

  return (
    <Link to={`/categoria/${categoria.id}`} className="group block h-full">
      <div className="h-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-100 hover:border-blue-200 flex flex-col items-center justify-start">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform flex-shrink-0"
          style={{ background: corDeFundoCategoria(categoria.cor) }}
        >
          {obterIcone()}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 min-h-[3.5rem] flex items-center justify-center">
          {categoria.nome}
        </h3>

        <p className="text-gray-600 text-sm flex-1">
          {categoria.descricao}
        </p>
      </div>
    </Link>
  );
}