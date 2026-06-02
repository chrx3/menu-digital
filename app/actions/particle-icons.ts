"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";
import { VALID_ICON_NAMES } from "@/app/lib/particle-icons";

const iconSchema = z.object({
  name: z.enum(VALID_ICON_NAMES),
  label: z.string().trim().min(1).max(60),
  orden: z.number().int().min(0).max(100),
  is_active: z.boolean(),
});

export async function getParticleIcons() {
  try {
    const { businessId, service } = await requireAdmin();
    const { data, error } = await service
      .from("particle_icons")
      .select("*")
      .eq("business_id", businessId)
      .order("orden");
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: undefined };
  } catch (error) {
    return { ...actionError(error), data: [] };
  }
}

export async function saveParticleIcons(
  icons: { name: string; label: string; orden: number; is_active: boolean }[],
) {
  try {
    const { businessId, service } = await requireAdmin();
    const parsed = z
      .array(
        z.object({
          name: z.enum(VALID_ICON_NAMES),
          label: z.string().trim().min(1).max(60),
          orden: z.number().int().min(0).max(100),
          is_active: z.boolean(),
        }),
      )
      .max(20)
      .parse(icons);

    const rows = parsed.map((icon, index) => ({
      business_id: businessId,
      name: icon.name,
      label: icon.label,
      orden: icon.orden ?? index,
      is_active: icon.is_active,
    }));

    // Delete existing and insert new — full replace
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

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true as const, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
