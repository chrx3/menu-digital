/**
 * Client-side image utilities: WebP conversion, resizing, validation.
 * These functions run in the browser and do NOT use "use server".
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
] as const;

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1200; // px
export const WEBP_QUALITY = 0.85;

export interface ConversionResult {
  file: File;
  originalName: string;
  originalSize: number;
  convertedSize: number;
  width: number;
  height: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateImageFile(file: File): ValidationError | undefined {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { field: "type", message: "Usa una imagen WebP, JPG, PNG o SVG." };
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return { field: "size", message: `La imagen debe pesar menos de ${MAX_IMAGE_SIZE_MB} MB.` };
  }
  return undefined;
}

/**
 * Convert any supported image to WebP, resize if needed, and return a new File.
 * SVGs are returned as-is since they can't be rasterized here cleanly.
 */
export async function convertToWebP(file: File): Promise<ConversionResult> {
  if (file.type === "image/svg+xml" || file.type === "image/webp") {
    // SVG and WebP pass through untouched
    return {
      file,
      originalName: file.name,
      originalSize: file.size,
      convertedSize: file.size,
      width: 0,
      height: 0,
    };
  }

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;

  // Resize if exceeds max dimension
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas para convertir la imagen.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );
  if (!blob) throw new Error("No se pudo convertir la imagen a WebP.");

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const convertedFile = new File([blob], `${baseName}.webp`, { type: "image/webp" });

  return {
    file: convertedFile,
    originalName: file.name,
    originalSize: file.size,
    convertedSize: convertedFile.size,
    width,
    height,
  };
}

/**
 * Extract the file name from a Supabase Storage public URL.
 * Returns undefined if the URL doesn't look like a Storage URL.
 */
export function extractStorageFileName(url: string, bucket: string): string | undefined {
  try {
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(prefix);
    if (idx === -1) return undefined;
    const name = url.slice(idx + prefix.length);
    // Must not contain path traversal
    if (name.includes("/") || name.includes("\\")) return undefined;
    return decodeURIComponent(name);
  } catch {
    return undefined;
  }
}
