/** Iconify public API — free, no API key. https://iconify.design/docs/api/ */

export const ICONIFY_PREFIX = "iconify:";

/** Colecciones permitidas (licencia/mitigación de abuso en menú público). */
export const ALLOWED_ICONIFY_PREFIXES = new Set([
  "lucide",
  "lucide-lab",
  "mdi",
  "tabler",
  "carbon",
  "ph",
  "heroicons",
  "fluent",
  "fluent-mdi",
  "noto",
  "fa6-solid",
  "fa-solid",
  "bi",
  "bx",
  "bxl",
  "cil",
  "ep",
  "si",
  "hugeicons",
  "iconoir",
  "mage",
  "material-symbols",
]);

export function isAllowedIconifyRef(ref: string): boolean {
  const parsed = parseIconifyRef(ref);
  return parsed !== null && ALLOWED_ICONIFY_PREFIXES.has(parsed.prefix);
}

export function parseIconifyRef(ref: string): { prefix: string; name: string } | null {
  const colon = ref.indexOf(":");
  if (colon <= 0 || colon >= ref.length - 1) return null;
  const prefix = ref.slice(0, colon);
  const name = ref.slice(colon + 1);
  if (!/^[a-z0-9-]+$/i.test(prefix) || !/^[a-z0-9._-]+$/i.test(name)) return null;
  return { prefix, name };
}

export function toIconifyStorageName(ref: string): string {
  return `${ICONIFY_PREFIX}${ref}`;
}

export function storageNameToIconifyRef(storageName: string): string | null {
  if (!storageName.startsWith(ICONIFY_PREFIX)) return null;
  const ref = storageName.slice(ICONIFY_PREFIX.length);
  return parseIconifyRef(ref) ? ref : null;
}

export function isIconifyParticleName(name: string): boolean {
  const ref = storageNameToIconifyRef(name);
  return ref !== null && isAllowedIconifyRef(ref);
}

export function iconifySvgUrl(ref: string): string {
  const parsed = parseIconifyRef(ref);
  if (!parsed) return "";
  return `https://api.iconify.design/${parsed.prefix}/${parsed.name}.svg`;
}

/** Etiqueta legible en español a partir de un ref Iconify (sin slugs técnicos). */
export function formatIconifyLabel(ref: string): string {
  const parsed = parseIconifyRef(ref);
  if (!parsed) return ref;

  const cleaned = parsed.name
    .replace(/[-_]/g, " ")
    .replace(
      /\b(filled|outline|regular|sharp|twotone|solid|line|bold|light|thin)\b/gi,
      "",
    )
    .replace(/\b\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return parsed.name.replace(/-/g, " ");
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export interface IconifySearchResult {
  icons: string[];
  total: number;
}

export async function searchIconify(
  query: string,
  limit = 24,
): Promise<IconifySearchResult> {
  const q = query.trim();
  if (q.length < 2) return { icons: [], total: 0 };

  const safeLimit = Number.isFinite(limit) ? limit : 24;
  const capped = Math.min(Math.max(safeLimit, 1), 32);
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=${capped}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Iconify search failed (${res.status})`);
  }

  const data = (await res.json()) as IconifySearchResult;
  const icons = Array.isArray(data.icons)
    ? data.icons.filter((ref) => isAllowedIconifyRef(ref))
    : [];
  return {
    icons,
    total: typeof data.total === "number" ? data.total : icons.length,
  };
}
