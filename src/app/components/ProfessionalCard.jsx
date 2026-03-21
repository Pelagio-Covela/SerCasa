import { Star, DollarSign } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function ProfessionalCard({ professional }) {
  const [searchParams] = useSearchParams();
  
  // Preservar parâmetros de data/hora ao navegar para detalhes
  const params = new URLSearchParams(searchParams);
  const queryString = params.toString();

  return (
    <Link
      to={`/profissional/${professional.id}${queryString ? `?${queryString}` : ''}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:scale-[1.02]"
    >
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <ImageWithFallback
          src={professional.photo}
          alt={professional.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">{professional.rating}</span>
          <span className="text-xs text-gray-600">({professional.reviewCount})</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">{professional.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{professional.experience}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-green-600">
            <DollarSign className="w-5 h-5" />
            <span className="text-lg font-bold">{professional.hourlyRate} MT</span>
            <span className="text-sm text-gray-600">/hora</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {professional.skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
          {professional.skills.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              +{professional.skills.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
