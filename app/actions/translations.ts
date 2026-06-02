"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";

const keySchema = z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._-]+$/);
const valueSchema = z.string().trim().min(1).max(1000);
const localeSchema = z.string().trim().min(2).max(20);

export async function getTranslations(locale = "es-CL") {
  try {
    const validLocale = localeSchema.parse(locale);
    const { businessId, service } = await requireAdmin();
    const { data, error } = await service.from("translations").select("*").eq("business_id", businessId).eq("locale", validLocale).order("key");
    return { data: data ?? [], error: error?.message };
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertTranslation(key: string, value: string, locale = "es-CL") {
  try {
    const { businessId, service } = await requireAdmin();
    const { error } = await service.from("translations").upsert({
      business_id: businessId,
      locale: localeSchema.parse(locale),
      key: keySchema.parse(key),
      value: valueSchema.parse(value),
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id,locale,key" });
    if (error) return { error: error.message, success: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertTranslations(
  entries: { key: string; value: string }[],
  locale = "es-CL",
) {
  try {
    const { businessId, service } = await requireAdmin();
    const validLocale = localeSchema.parse(locale);
    const rows = entries.map((entry) => ({
      business_id: businessId,
      locale: validLocale,
      key: keySchema.parse(entry.key),
      value: valueSchema.parse(entry.value),
      updated_at: new Date().toISOString(),
    }));
    if (!rows.length) return { success: true, error: undefined, count: 0 };
    const { error } = await service
      .from("translations")
      .upsert(rows, { onConflict: "business_id,locale,key" });
    if (error) return { error: error.message, success: undefined, count: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, count: rows.length, error: undefined };
  } catch (error) {
    return { ...actionError(error), count: undefined };
  }
}

export async function deleteTranslation(key: string, locale = "es-CL") {
  try {
    const { businessId, service } = await requireAdmin();
    const { error } = await service.from("translations").delete().eq("business_id", businessId).eq("locale", localeSchema.parse(locale)).eq("key", keySchema.parse(key));
    if (error) return { error: error.message, success: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function seedDefaultTranslations() {
  try {
    const { businessId, service } = await requireAdmin();
    const defaults: Record<string, string> = {
      "search.placeholder": "Buscar en el menú…",
      "search.searching": "Buscando…",
      "search.resultSingular": "producto encontrado",
      "search.resultPlural": "productos encontrados",
      "search.noResults": "No se encontraron productos",
      "search.noResultsHint": "Prueba con otra palabra o revisa la ortografía",
      "cart.title": "Tu Pedido",
      "cart.empty": "Tu carrito está vacío",
      "cart.emptyHint": "Agrega productos para comenzar tu pedido",
      "cart.sendWhatsApp": "Enviar Pedido por WhatsApp",
      "cart.clearCart": "Vaciar carrito",
      "cart.confirmClear": "¿Vaciar carrito?",
      "cart.confirmClearText": "¿Estás seguro de que quieres eliminar todos los productos de tu carrito?",
      "cart.cancel": "Cancelar",
      "cart.confirm": "Vaciar",
      "cart.total": "Total",
      "product.includes": "Incluye:",
      "product.sandwichStyle": "Estilo del sándwich",
      "product.meatType": "Tipo de carne",
      "product.chooseOption": "Elige tu opción",
      "product.promo2x": "Promo 2x:",
      "category.viewing": "Estás viendo",
      "footer.copyright": "© {year} {name}. Todos los derechos reservados",
    };
    const rows = Object.entries(defaults).map(([key, value]) => ({ business_id: businessId, locale: "es-CL", key, value }));
    const { error } = await service.from("translations").upsert(rows, { onConflict: "business_id,locale,key" });
    if (error) return { error: error.message, success: undefined, count: undefined };
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, count: rows.length, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
