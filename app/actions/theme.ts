"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";
import { PARTICLE_COUNT_DEFAULTS } from "@/app/lib/particle-icons";

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const dimensionSchema = z.string().regex(/^\d+(?:\.\d+)?(?:px|rem)$/);
const themeSchema = z.object({
  color_primary: colorSchema,
  color_primary_light: colorSchema,
  color_primary_intense: colorSchema,
  color_primary_text: colorSchema,
  color_background: colorSchema,
  color_background_dark: colorSchema,
  color_background_deep: colorSchema,
  color_text_dark: colorSchema,
  color_text_medium: colorSchema,
  color_text_light: colorSchema,
  color_white: colorSchema,
  font_heading: z.string().trim().min(1).max(80),
  font_body: z.string().trim().min(1).max(80),
  font_heading_weights: z.array(z.number().int().min(100).max(900)).max(10),
  font_body_weights: z.array(z.number().int().min(100).max(900)).max(10),
  header_height_desktop: dimensionSchema,
  header_height_mobile: dimensionSchema,
  particles_desktop: z.coerce.number().int().min(0).max(150),
  particles_mobile: z.coerce.number().int().min(0).max(80),
  cart_fly_duration: z.coerce.number().min(0).max(3),
  cart_fly_ball_size: z.coerce.number().int().min(16).max(120),
  reduced_motion: z.boolean(),
});

export async function getBusinessTheme() {
  try {
    const { businessId, service } = await requireAdmin();
    const { data, error } = await service.from("business_themes").select("*").eq("business_id", businessId).single();
    if (error || !data) return { error: error?.message || "Tema no encontrado", data: undefined };
    return { data, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateBusinessTheme(formData: FormData) {
  try {
    const { businessId, service } = await requireAdmin();
    const parsed = themeSchema.safeParse({
      color_primary: formData.get("color_primary"),
      color_primary_light: formData.get("color_primary_light"),
      color_primary_intense: formData.get("color_primary_intense"),
      color_primary_text: formData.get("color_primary_text"),
      color_background: formData.get("color_background"),
      color_background_dark: formData.get("color_background_dark"),
      color_background_deep: formData.get("color_background_deep"),
      color_text_dark: formData.get("color_text_dark"),
      color_text_medium: formData.get("color_text_medium"),
      color_text_light: formData.get("color_text_light"),
      color_white: formData.get("color_white"),
      font_heading: formData.get("font_heading"),
      font_body: formData.get("font_body"),
      font_heading_weights: String(formData.get("font_heading_weights")).split(",").map(Number),
      font_body_weights: String(formData.get("font_body_weights")).split(",").map(Number),
      header_height_desktop: formData.get("header_height_desktop"),
      header_height_mobile: formData.get("header_height_mobile"),
      particles_desktop: formData.get("particles_desktop"),
      particles_mobile: formData.get("particles_mobile"),
      cart_fly_duration: formData.get("cart_fly_duration") || 0.7,
      cart_fly_ball_size: formData.get("cart_fly_ball_size") || 44,
      reduced_motion: formData.get("reduced_motion") === "true",
    });
    if (!parsed.success) return { error: "Revisa los valores del tema e inténtalo nuevamente.", success: undefined };
    const { error } = await service.from("business_themes").update(parsed.data).eq("business_id", businessId);
    if (error) return { error: error.message, success: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

const particleCountsSchema = z.object({
  particles_desktop: z.coerce.number().int().min(0).max(150),
  particles_mobile: z.coerce.number().int().min(0).max(80),
});

export async function updateParticleCounts(
  desktop: number,
  mobile: number,
) {
  try {
    const { businessId, service } = await requireAdmin();
    const parsed = particleCountsSchema.safeParse({
      particles_desktop: desktop,
      particles_mobile: mobile,
    });
    if (!parsed.success) {
      return { error: "Cantidad de partículas no válida", success: undefined };
    }
    const { error } = await service
      .from("business_themes")
      .update(parsed.data)
      .eq("business_id", businessId);
    if (error) return { error: error.message, success: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true as const, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

/** Aplica 20/12 partículas (recomendado para rendimiento). */
export async function applyRecommendedParticleCounts() {
  try {
    const { businessId, service } = await requireAdmin();
    const { error } = await service
      .from("business_themes")
      .update({
        particles_desktop: PARTICLE_COUNT_DEFAULTS.desktop,
        particles_mobile: PARTICLE_COUNT_DEFAULTS.mobile,
      })
      .eq("business_id", businessId);
    if (error) return { error: error.message, success: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true as const, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
