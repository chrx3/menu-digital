"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";

const BUCKETS = ["products", "logos"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
]);
// ponytail: name segments may include folder prefixes (businessId/...).
const SAFE_PATH = /^[a-zA-Z0-9._/-]+$/;

function publicUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function listImages(bucket?: string) {
  try {
    const { businessId, service } = await requireAdmin();
    const targetBucket =
      bucket && BUCKETS.includes(bucket as (typeof BUCKETS)[number])
        ? bucket
        : BUCKETS[0];
    // ponytail: list under the per-business prefix. Legacy root files won't show,
    // but BusinessConfigForm keeps working because URLs are stored directly.
    const { data, error } = await service.storage
      .from(targetBucket)
      .list(businessId, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (error) return { error: error.message, files: [] };
    return {
      error: undefined,
      files:
        data?.map((file) => ({
          name: file.name,
          path: `${businessId}/${file.name}`,
          url: publicUrl(targetBucket, `${businessId}/${file.name}`),
          size: file.metadata?.size || 0,
          created: file.created_at || "",
        })) || [],
    };
  } catch (error) {
    return { ...actionError(error), files: [] };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return {
        error: "Selecciona una imagen para subir.",
        success: false,
        url: "",
      };
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        error: "Usa una imagen WebP, JPG, PNG o SVG.",
        success: false,
        url: "",
      };
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return {
        error: "La imagen debe pesar menos de 5 MB.",
        success: false,
        url: "",
      };
    }

    const bucket = z
      .enum(BUCKETS)
      .catch(BUCKETS[0])
      .parse(formData.get("bucket"));

    const { businessId, service } = await requireAdmin();

    // Replace old image if requested. accept full URLs and bare paths.
    const replaceUrl = formData.get("replace_url");
    if (typeof replaceUrl === "string" && replaceUrl.trim()) {
      const oldPath = extractPathFromUrl(replaceUrl.trim(), bucket);
      if (oldPath && SAFE_PATH.test(oldPath)) {
        await service.storage.from(bucket).remove([oldPath]);
      }
    }

    const safeBase = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const ext = file.name.endsWith(".svg") ? ".svg" : ".webp";
    const path = `${businessId}/${Date.now()}-${safeBase}${ext}`;

    const { error } = await service.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error)
      return { error: error.message, success: false, url: "" };
    revalidatePath("/admin/imagenes");
    return {
      success: true,
      error: undefined,
      url: publicUrl(bucket, path),
    };
  } catch (error) {
    return { ...actionError(error), success: false, url: "" };
  }
}

export async function deleteImage(name: string, bucket?: string) {
  try {
    const targetBucket = z.enum(BUCKETS).catch(BUCKETS[0]).parse(bucket);
    const { businessId, service } = await requireAdmin();
    // ponytail: accept "name" (legacy root) or "businessId/name" (new). Always scope to this business.
    const path = name.includes("/") ? name : `${businessId}/${name}`;
    if (!SAFE_PATH.test(path))
      return { error: "Nombre de archivo inválido.", success: false };
    const { error } = await service.storage.from(targetBucket).remove([path]);
    if (error) return { error: error.message, success: false };
    revalidatePath("/admin/imagenes");
    return { success: true, error: undefined };
  } catch (error) {
    return { ...actionError(error), success: false };
  }
}

function extractPathFromUrl(
  url: string,
  bucket: string,
): string | undefined {
  try {
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(prefix);
    if (idx === -1) return undefined;
    const path = url.slice(idx + prefix.length);
    return decodeURIComponent(path);
  } catch {
    return undefined;
  }
}
