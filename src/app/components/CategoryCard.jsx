import { Home, Droplet, ChefHat, Leaf, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap = {
  home: Home,
  droplet: Droplet,
  "chef-hat": ChefHat,
  leaf: Leaf,
  zap: Zap,
};

export function CategoryCard({ id, name, icon, description, color }) {
  const Icon = iconMap[icon];

  return (
    <Link
      to={`/categoria/${id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:scale-105"
    >
      <div className={`${color} p-6 flex items-center justify-center`}>
        {Icon && <Icon className="w-12 h-12 text-white" strokeWidth={2} />}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
