"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";

const idSchema = z.string().min(1).max(36);
const childPriceSchema = z.object({
  option_value: z.string().trim().min(1).max(80),
  precio: z.number().finite().nonnegative(),
});
const promotionSchema = childPriceSchema.extend({
  type: z.string().trim().max(40).optional(),
  precio: z.number().finite().nonnegative().nullable(),
});
const productSchema = z.object({
  category_id: idSchema,
  nombre: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_-]+$/),
  imagen: z.string().trim().max(1000),
  precio_unico: z.number().finite().nonnegative().nullable(),
  destacado: z.boolean(),
  tiene_estilo: z.boolean(),
  estilo_nombre: z.string().trim().max(100),
  estilo_opciones: z.array(z.record(z.string(), z.unknown())).max(20),
  incluye: z.array(z.string().trim().min(1).max(100)).max(30),
  incluye_texto: z.string().trim().max(240),
  orden: z.number().int().min(0).max(1000),
  is_active: z.boolean().optional(),
  ingredients: z.array(z.string().trim().min(1).max(100)).max(50),
  prices: z.array(childPriceSchema).max(100),
  promotions: z.array(promotionSchema).max(100),
});

function refreshMenu() {
  revalidatePath("/");
  revalidatePath("/admin");
}

async function categoryBelongsToBusiness(
  categoryId: string,
  businessId: string,
) {
  const { service } = await requireAdmin();
  const { data } = await service
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

export async function getProductsByCategory(categoryId: string) {
  try {
    idSchema.parse(categoryId);
    const { businessId, service } = await requireAdmin();
    if (!(await categoryBelongsToBusiness(categoryId, businessId)))
      return { error: "Categoría inválida.", data: [] };
    const { data, error } = await service
      .from("products")
      .select("*, product_ingredients(*), product_prices(*), promotions(*)")
      .eq("category_id", categoryId)
      .order("orden");
    return { data: data ?? [], error: error?.message };
  } catch (error) {
    return { ...actionError(error), data: [] };
  }
}

async function saveProduct(
  id: string | null,
  input: z.input<typeof productSchema>,
) {
  const data = productSchema.parse(input);
  const { supabase } = await requireAdmin();
  const { data: productId, error } = await supabase.rpc(
    "save_product_transaction",
    {
      p_id: id,
      p_category_id: data.category_id,
      p_nombre: data.nombre,
      p_slug: data.slug,
      p_imagen: data.imagen || null,
      p_precio_unico: data.precio_unico,
      p_destacado: data.destacado,
      p_tiene_estilo: data.tiene_estilo,
      p_estilo_nombre: data.tiene_estilo ? data.estilo_nombre || null : null,
      p_estilo_opciones: data.tiene_estilo ? data.estilo_opciones : null,
      p_incluye: data.incluye.length ? data.incluye : null,
      p_incluye_texto: data.incluye_texto || null,
      p_orden: data.orden,
      p_is_active: data.is_active ?? true,
      p_ingredients: data.ingredients,
      p_prices: data.prices,
      p_promotions: data.promotions.filter((promo) => promo.precio != null),
    },
  );
  if (error) return { error: error.message, success: undefined, id: undefined };
  refreshMenu();
  return { success: true, id: productId as string, error: undefined };
}

export async function createProduct(input: z.input<typeof productSchema>) {
  try {
    return await saveProduct(null, input);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateProduct(
  id: string,
  input: z.input<typeof productSchema>,
) {
  try {
    idSchema.parse(id);
    return await saveProduct(id, input);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteProduct(id: string) {
  try {
    idSchema.parse(id);
    const { businessId, service } = await requireAdmin();
    const { data: product } = await service
      .from("products")
      .select("id, categories!inner(business_id)")
      .eq("id", id)
      .eq("categories.business_id", businessId)
      .maybeSingle();
    if (!product) return { error: "Producto inválido.", success: undefined };
    const { error } = await service.from("products").delete().eq("id", id);
    if (error) return { error: error.message, success: undefined };
    refreshMenu();
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
