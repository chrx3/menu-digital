import { Categoria, Producto } from "../types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Distancia de Levenshtein para tolerar typos */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }

  return row[b.length];
}

function maxDistance(wordLength: number): number {
  if (wordLength <= 2) return 0;
  if (wordLength <= 4) return 1;
  if (wordLength <= 7) return 2;
  return 3;
}

function fuzzyWordMatch(queryWord: string, target: string): boolean {
  if (!queryWord) return true;
  if (target.includes(queryWord)) return true;

  const tokens = target.split(/[\s,/()+.-]+/).filter(Boolean);
  const maxDist = maxDistance(queryWord.length);

  for (const token of tokens) {
    if (token.includes(queryWord)) return true;
    if (queryWord.includes(token) && token.length >= 3) return true;
    if (levenshtein(queryWord, token) <= maxDist) return true;
    if (token.length >= 4 && levenshtein(queryWord, token.slice(0, queryWord.length + 1)) <= maxDist) {
      return true;
    }
  }

  if (levenshtein(queryWord, target) <= maxDist + 1) return true;

  return false;
}

function productSearchText(categoria: Categoria, producto: Producto): string {
  return normalize(
    [
      producto.nombre,
      categoria.titulo,
      categoria.descripcion,
      ...(producto.ingredientes ?? []),
      ...(producto.incluye ?? []),
      producto.detalle ?? "",
    ].join(" "),
  );
}

function matchesQuery(categoria: Categoria, producto: Producto, query: string): boolean {
  const haystack = productSearchText(categoria, producto);
  const words = normalize(query).split(/\s+/).filter(Boolean);

  if (words.length === 0) return true;

  return words.every((word) => fuzzyWordMatch(word, haystack));
}

export function filterMenuBySearch(
  menu: Categoria[],
  query: string,
): Categoria[] {
  const trimmed = query.trim();
  if (!trimmed) return menu;

  return menu
    .map((categoria) => ({
      ...categoria,
      items: categoria.items.filter((item) =>
        matchesQuery(categoria, item, trimmed),
      ),
    }))
    .filter((categoria) => categoria.items.length > 0);
}
