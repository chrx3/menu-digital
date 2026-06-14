"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";

const orderChannelsSchema = z.object({
  whatsapp: z.boolean(),
  phone: z.boolean(),
  telegram: z.boolean(),
});

const businessSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240),
  year: z.coerce.number().int().min(2000).max(2200),
  locale: z.string().trim().min(2).max(20),
  currency: z.string().trim().min(3).max(3),
  lang: z.string().trim().min(2).max(10),
  whatsapp_number: z.string().trim().regex(/^\d{8,15}$/),
  whatsapp_greeting: z.string().trim().min(1).max(500),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().max(160).optional().default(""),
  address: z.string().trim().max(240).optional().default(""),
  logo_desktop: z.string().trim().max(1000),
  logo_mobile: z.array(z.string().trim().max(1000)).max(10),
  logo_rotation_interval: z.coerce.number().int().min(1000).max(60000),
  seo_title: z.string().trim().max(160),
  seo_description: z.string().trim().max(320),
  order_channels: orderChannelsSchema,
});

export async function getBusinessConfig() {
  try {
    const { businessId, service } = await requireAdmin();
    const { data, error } = await service
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error || !data)
      return { error: error?.message || "Negocio no encontrado", data: undefined };
    // Normaliza campos jsonb que el cliente espera como arrays/objetos
    return {
      data: {
        ...data,
        logo_mobile: Array.isArray(data.logo_mobile) ? data.logo_mobile : [],
        order_channels:
          data.order_channels && typeof data.order_channels === "object"
            ? data.order_channels
            : { whatsapp: true, phone: false, telegram: false },
        promotion_types: Array.isArray(data.promotion_types)
          ? data.promotion_types
          : ["promo_2x"],
      },
      error: undefined,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateBusinessConfig(formData: FormData) {
  try {
    const { businessId, service } = await requireAdmin();
    const parsed = businessSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      year: formData.get("year"),
      locale: formData.get("locale"),
      currency: formData.get("currency"),
      lang: formData.get("lang"),
      whatsapp_number: formData.get("whatsapp_number"),
      whatsapp_greeting: formData.get("whatsapp_greeting"),
      phone: formData.get("phone") ?? "",
      email: formData.get("email") ?? "",
      address: formData.get("address") ?? "",
      logo_desktop: formData.get("logo_desktop"),
      logo_mobile: JSON.parse(String(formData.get("logo_mobile") || "[]")),
      logo_rotation_interval: formData.get("logo_rotation_interval"),
      seo_title: formData.get("seo_title"),
      seo_description: formData.get("seo_description"),
      order_channels: JSON.parse(String(formData.get("order_channels") || "{}")),
    });

    if (!parsed.success) return { error: "Revisa los datos del negocio e inténtalo nuevamente.", success: undefined };

    const { error } = await service
      .from("businesses")
      .update(parsed.data)
      .eq("id", businessId);

    if (error) return { error: error.message, success: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
