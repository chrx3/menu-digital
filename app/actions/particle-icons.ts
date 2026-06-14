"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";
import {
  formatCustomSvgLabel,
  MAX_PARTICLE_SVG_BYTES,
  PARTICLE_ICONS_BUCKET,
  sanitizeSvgContent,
  toCustomSvgStorageName,
} from "@/app/lib/custom-particle-svg";
import {
  AVAILABLE_ICONS,
  HIDDEN_BUILTIN_KEY,
  parseHiddenBuiltins,
  isValidParticleIconName,
} from "@/app/lib/particle-icons";
const DEFAULT_LOCALE = "es-CL";

const particleIconRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine(isValidParticleIconName, "Nombre de ícono no válido"),
  label: z.string().trim().min(1).max(60),
  orden: z.number().int().min(0).max(100),
  is_active: z.boolean(),
});

const hiddenBuiltinsSchema = z
  .array(
    z
      .string()
      .refine(
        (name) => AVAILABLE_ICONS.some((icon) => icon.name === name),
        "Ícono builtin no válido",
      ),
  )
  .max(AVAILABLE_ICONS.length);

async function resolveBusinessLocale(
  service: Awaited<ReturnType<typeof requireAdmin>>["service"],
  businessId: string,
) {
  const { data } = await service
    .from("businesses")
    .select("locale")
    .eq("id", businessId)
    .single();
  return (data?.locale as string | undefined) ?? DEFAULT_LOCALE;
}

export async function getParticleIcons() {
  try {
    const { businessId, service } = await requireAdmin();
    const locale = await resolveBusinessLocale(service, businessId);

    const [iconsResult, hiddenResult] = await Promise.all([
      service
        .from("particle_icons")
        .select("*")
        .eq("business_id", businessId)
        .order("orden"),
      service
        .from("translations")
        .select("value")
        .eq("business_id", businessId)
        .eq("locale", locale)
        .eq("key", HIDDEN_BUILTIN_KEY)
        .maybeSingle(),
    ]);

    if (iconsResult.error) {
      return {
        data: [],
        hiddenBuiltins: [] as string[],
        error: iconsResult.error.message,
      };
    }

    return {
      data: iconsResult.data ?? [],
      hiddenBuiltins: parseHiddenBuiltins(hiddenResult.data?.value),
      error: undefined,
    };
  } catch (error) {
    return { ...actionError(error), data: [], hiddenBuiltins: [] as string[] };
  }
}

export async function uploadParticleSvg(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return {
        error: "Selecciona un archivo SVG.",
        name: undefined,
        label: undefined,
      };
    }

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) {
      return {
        error: "Solo se permiten archivos SVG.",
        name: undefined,
        label: undefined,
      };
    }

    if (file.size <= 0 || file.size > MAX_PARTICLE_SVG_BYTES) {
      return {
        error: "El SVG debe pesar menos de 100 KB.",
        name: undefined,
        label: undefined,
      };
    }

    const raw = await file.text();
    const sanitized = sanitizeSvgContent(raw);
    if (!sanitized) {
      return {
        error: "El archivo no contiene un SVG válido.",
        name: undefined,
        label: undefined,
      };
    }

    const { businessId, service } = await requireAdmin();

    const safeBase = file.name
      .replace(/\.svg$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const fileName = `${Date.now()}-${safeBase || "icono"}.svg`;
    const storagePath = `${businessId}/${fileName}`;

    const { error } = await service.storage
      .from(PARTICLE_ICONS_BUCKET)
      .upload(storagePath, new Blob([sanitized], { type: "image/svg+xml" }), {
        cacheControl: "3600",
        contentType: "image/svg+xml",
        upsert: false,
      });

    if (error) {
      return { error: error.message, name: undefined, label: undefined };
    }

    const label = formatCustomSvgLabel(fileName);
    const name = toCustomSvgStorageName(storagePath);

    revalidatePath("/");
    revalidatePath("/admin");

    return { error: undefined, name, label };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveParticleIcons(
  icons: { name: string; label: string; orden: number; is_active: boolean }[],
  hiddenBuiltins: string[] = [],
) {
  try {
    const { businessId, service } = await requireAdmin();
    const locale = await resolveBusinessLocale(service, businessId);
    const parsed = z.array(particleIconRowSchema).max(30).parse(icons);
    const parsedHidden = hiddenBuiltinsSchema.parse(hiddenBuiltins);

    const rows = parsed.map((icon, index) => ({
      business_id: businessId,
      name: icon.name,
      label: icon.label,
      orden: icon.orden ?? index,
      is_active: icon.is_active,
    }));

    const { error: delError } = await service
      .from("particle_icons")
      .delete()
      .eq("business_id", businessId);
    if (delError) return { error: delError.message, success: undefined };

    if (rows.length > 0) {
      const { error: insError } = await service
        .from("particle_icons")
        .insert(rows);
      if (insError) return { error: insError.message, success: undefined };
    }

    if (parsedHidden.length > 0) {
      const { error: hiddenError } = await service.from("translations").upsert(
        {
          business_id: businessId,
          locale,
          key: HIDDEN_BUILTIN_KEY,
          value: JSON.stringify(parsedHidden),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,locale,key" },
      );
      if (hiddenError) return { error: hiddenError.message, success: undefined };
    } else {
      const { error: hiddenError } = await service
        .from("translations")
        .delete()
        .eq("business_id", businessId)
        .eq("locale", locale)
        .eq("key", HIDDEN_BUILTIN_KEY);
      if (hiddenError) return { error: hiddenError.message, success: undefined };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true as const, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
