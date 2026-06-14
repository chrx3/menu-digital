/** Íconos SVG subidos por el negocio — almacenados en Supabase Storage. */

export const CUSTOM_SVG_PREFIX = "custom-svg:";
export const PARTICLE_ICONS_BUCKET = "particle-icons";
export const MAX_PARTICLE_SVG_BYTES = 100 * 1024;

const SAFE_STORAGE_PATH = /^[a-f0-9-]+\/[a-zA-Z0-9._-]+\.svg$/;

export function toCustomSvgStorageName(relativePath: string): string {
  return `${CUSTOM_SVG_PREFIX}${relativePath}`;
}

export function storageNameToCustomSvgPath(
  storageName: string,
): string | null {
  if (!storageName.startsWith(CUSTOM_SVG_PREFIX)) return null;
  const path = storageName.slice(CUSTOM_SVG_PREFIX.length);
  return SAFE_STORAGE_PATH.test(path) ? path : null;
}

export function isCustomSvgParticleName(name: string): boolean {
  return storageNameToCustomSvgPath(name) !== null;
}

export function customSvgPublicUrl(storageName: string): string {
  const path = storageNameToCustomSvgPath(storageName);
  if (!path) return "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${PARTICLE_ICONS_BUCKET}/${path}`;
}

/** Etiqueta legible a partir del nombre de archivo SVG. */
export function formatCustomSvgLabel(fileName: string): string {
  const base = fileName.replace(/\.svg$/i, "").replace(/[-_]+/g, " ").trim();
  if (!base) return "Ícono personalizado";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function sanitizeSvgContent(content: string): string | null {
  const trimmed = content.trim();
  if (!/<svg[\s>]/i.test(trimmed)) return null;

  const sanitized = trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/xlink:href\s*=\s*"(?!#)[^"]*"/gi, 'xlink:href="#"');

  if (!/<svg[\s>]/i.test(sanitized)) return null;
  return sanitized;
}
