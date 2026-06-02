"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";

const idSchema = z.string().min(1).max(36);
const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/),
  titulo: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(240),
  tipo_precio: z.enum(["unico", "tamano", "proteina"]),
  opciones_nombre: z.string().trim().max(80),
  etiqueta_whatsapp: z.string().trim().max(100),
  orden: z.number().int().min(0).max(1000),
  destacado: z.boolean(),
  is_active: z.boolean().optional(),
});
const optionSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/),
  orden: z.number().int().min(0).max(1000),
});

function refreshMenu() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getCategories() {
  try {
    const { businessId, service } = await requireAdmin();
    const { data, error } = await service
      .from("categories")
      .select("*, category_options(*)")
      .eq("business_id", businessId)
      .order("orden");
    return { data: data ?? [], error: error?.message };
  } catch (error) {
    return actionError(error);
  }
}

export async function createCategory(input: z.input<typeof categorySchema>) {
  try {
    const data = categorySchema.parse(input);
    const { businessId, service } = await requireAdmin();
    const { data: category, error } = await service
      .from("categories")
      .insert({
        business_id: businessId,
        ...data,
        opciones_nombre: data.opciones_nombre || null,
        is_active: true,
      })
      .select("id")
      .single();
    if (error)
      return { error: error.message, success: undefined, id: undefined };
    refreshMenu();
    return { success: true, id: category?.id as string, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCategory(
  id: string,
  input: z.input<typeof categorySchema>,
) {
  try {
    idSchema.parse(id);
    const data = categorySchema.extend({ is_active: z.boolean() }).parse(input);
    const { businessId, service } = await requireAdmin();
    const { error } = await service
      .from("categories")
      .update({ ...data, opciones_nombre: data.opciones_nombre || null })
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) return { error: error.message, success: undefined };
    refreshMenu();
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCategory(id: string) {
  try {
    idSchema.parse(id);
    const { businessId, service } = await requireAdmin();
    const { error } = await service
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) return { error: error.message, success: undefined };
    refreshMenu();
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function reorderCategories(orderedIds: string[]) {
  try {
    const ids = z.array(idSchema).max(200).parse(orderedIds);
    const { businessId, supabase } = await requireAdmin();
    const { error } = await supabase.rpc("reorder_categories_transaction", {
      p_business_id: businessId,
      p_ids: ids,
    });
    if (error) return { error: error.message, success: undefined };
    refreshMenu();
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveCategoryOptions(
  categoryId: string,
  input: z.input<typeof optionSchema>[],
) {
  try {
    idSchema.parse(categoryId);
    const options = z.array(optionSchema).max(100).parse(input);
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc(
      "replace_category_options_transaction",
      {
        p_category_id: categoryId,
        p_options: options,
      },
    );
    if (error) return { error: error.message, success: undefined };
    refreshMenu();
    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
