// Tailwind só gera CSS para classes que consegue "ver" escritas por extenso
// no código-fonte, durante a compilação. Como a cor de cada categoria vem
// do banco de dados (definida pelo gestor no backoffice), uma classe
// dinâmica tipo `${categoria.cor}` nunca é detectada pelo Tailwind — e a
// cor simplesmente não aparece (fica transparente/invisível).
//
// Por isso, em qualquer lugar que precise mostrar a cor de uma categoria,
// usamos o valor hexadecimal real via `style`, nunca a classe Tailwind
// diretamente.
export const COR_HEX = {
  "bg-blue-500": "#3b82f6", "bg-cyan-500": "#06b6d4", "bg-orange-500": "#f97316",
  "bg-green-500": "#22c55e", "bg-yellow-500": "#eab308", "bg-pink-500": "#ec4899",
  "bg-stone-500": "#78716c", "bg-amber-700": "#b45309", "bg-sky-500": "#0ea5e9",
  "bg-slate-600": "#475569", "bg-indigo-500": "#6366f1", "bg-rose-400": "#fb7185",
  "bg-teal-500": "#14b8a6",
};

// usada quando a categoria tem uma cor não reconhecida (ex: valor antigo
// inserido antes deste mapeamento existir)
export const COR_PADRAO = "#2563eb";

export function corDeFundoCategoria(cor) {
  return COR_HEX[cor] || COR_PADRAO;
}
