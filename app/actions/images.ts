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
const SAFE_FILE_NAME = /^[a-zA-Z0-9._-]+$/;

export async function listImages(bucket?: string) {
  try {
    const { service } = await requireAdmin();
    const targetBucket =
      bucket && BUCKETS.includes(bucket as (typeof BUCKETS)[number])
        ? bucket
        : BUCKETS[0];
    const { data, error } = await service.storage.from(targetBucket).list("", {
      limit: 500,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) return { error: error.message, files: undefined };
    return {
      error: undefined,
      files:
        data?.map((file) => ({
          name: file.name,
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${file.name}`,
          size: file.metadata?.size || 0,
          created: file.created_at || "",
        })) || [],
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return {
        error: "Selecciona una imagen para subir.",
        success: undefined,
        url: undefined,
      };
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        error: "Usa una imagen WebP, JPG, PNG o SVG.",
        success: undefined,
        url: undefined,
      };
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return {
        error: "La imagen debe pesar menos de 5 MB.",
        success: undefined,
        url: undefined,
      };
    }

    const bucket = z
      .enum(BUCKETS)
      .catch(BUCKETS[0])
      .parse(formData.get("bucket"));

    const { service } = await requireAdmin();

    // Replace old image if requested
    const replaceUrl = formData.get("replace_url");
    if (typeof replaceUrl === "string" && replaceUrl.trim()) {
      const oldName = extractFileNameFromUrl(replaceUrl.trim(), bucket);
      if (oldName && SAFE_FILE_NAME.test(oldName)) {
        await service.storage.from(bucket).remove([oldName]);
      }
    }

    const safeBase = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const ext = file.name.endsWith(".svg") ? ".svg" : ".webp";
    const fileName = `${Date.now()}-${safeBase}${ext}`;

    const { error } = await service.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error)
      return { error: error.message, success: undefined, url: undefined };
    revalidatePath("/admin/imagenes");
    return {
      success: true,
      error: undefined,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteImage(name: string, bucket?: string) {
  try {
    const targetBucket = z.enum(BUCKETS).catch(BUCKETS[0]).parse(bucket);
    if (!SAFE_FILE_NAME.test(name))
      return { error: "Nombre de archivo inválido.", success: undefined };
    const { service } = await requireAdmin();
    const { error } = await service.storage.from(targetBucket).remove([name]);
    if (error) return { error: error.message, success: undefined };
    revalidatePath("/admin/imagenes");
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

function extractFileNameFromUrl(
  url: string,
  bucket: string,
): string | undefined {
  try {
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(prefix);
    if (idx === -1) return undefined;
    const name = url.slice(idx + prefix.length);
    if (name.includes("/")) return undefined;
    return decodeURIComponent(name);
  } catch {
    return undefined;
  }
}
