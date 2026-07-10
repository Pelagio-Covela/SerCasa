import { useState } from "react";

// Gera uma cor consistente a partir do nome (mesma lógica usada no Backoffice)
const CORES = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626"];

function corDeFundo(nome) {
  if (!nome) return CORES[0];
  return CORES[nome.charCodeAt(0) % CORES.length];
}

function iniciais(nome) {
  if (!nome) return "?";
  return nome.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

// Mostra a foto do profissional; se não houver foto (ou a imagem falhar ao
// carregar), mostra um círculo/retângulo colorido com as iniciais do nome —
// em vez do ícone de "imagem quebrada" padrão do navegador.
export function AvatarProfissional({ nome, foto, className = "", rounded = true }) {
  const [erro, definirErro] = useState(false);

  if (foto && !erro) {
    return (
      <img
        src={foto}
        alt={nome}
        onError={() => definirErro(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center text-white font-bold ${rounded ? "" : ""} ${className}`}
      style={{ background: corDeFundo(nome) }}
    >
      <span className="select-none">{iniciais(nome)}</span>
    </div>
  );
}
