"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/app/lib/super-admin";
import { actionError } from "@/app/lib/admin-auth";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+$/, "Slug inválido (solo a-z y 0-9, sin guiones).");

const createSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
});

export async function listBusinesses() {
  try {
    const { service } = await requireSuperAdmin();
    const { data, error } = await service
      .from("businesses")
      .select("id, slug, name, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message, data: undefined };
    return { data: data ?? [] };
  } catch (e) {
    return { ...actionError(e), data: undefined };
  }
}

export async function createBusiness(formData: FormData) {
  try {
    const { service } = await requireSuperAdmin();
    const parsed = createSchema.safeParse({
      slug: String(formData.get("slug") ?? "").toLowerCase(),
      name: String(formData.get("name") ?? ""),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { error: issue?.message ?? "Datos inválidos." };
    }

    const { data: existing } = await service
      .from("businesses")
      .select("id")
      .eq("slug", parsed.data.slug)
      .maybeSingle();
    if (existing) return { error: "Ya existe un negocio con ese slug." };

    const { data, error } = await service
      .from("businesses")
      .insert({ slug: parsed.data.slug, name: parsed.data.name, is_active: true })
      .select("id, slug, name, is_active, created_at")
      .single();
    if (error || !data) return { error: error?.message ?? "No se pudo crear." };

    // ponytail: seed defaults so the new business renders something usable.
    await service.from("business_themes").insert({ business_id: data.id });
    await service
      .from("translations")
      .insert(
        SEED_TRANSLATIONS.map((t) => ({
          business_id: data.id,
          locale: "es-CL",
          key: t.key,
          value: t.value,
        })),
      );

    revalidatePath("/admin/negocios");
    return { data };
  } catch (e) {
    return { ...actionError(e), data: undefined };
  }
}

export async function toggleBusinessActive(id: string, isActive: boolean) {
  try {
    const { service } = await requireSuperAdmin();
    const { error } = await service
      .from("businesses")
      .update({ is_active: isActive })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/negocios");
    return { data: { ok: true } };
  } catch (e) {
    return { ...actionError(e), data: undefined };
  }
}

export async function deleteBusiness(id: string) {
  try {
    const { service } = await requireSuperAdmin();
    // ponytail: soft delete only. Hard delete would cascade categories/products/storage — bail.
    const { error } = await service
      .from("businesses")
      .update({ is_active: false })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/negocios");
    return { data: { ok: true } };
  } catch (e) {
    return { ...actionError(e), data: undefined };
  }
}

const SEED_TRANSLATIONS = [
  { key: "hero.subtitle", value: "Bienvenido" },
  { key: "menu.title", value: "Nuestro Menú" },
  { key: "cart.title", value: "Tu Pedido" },
  { key: "cart.empty", value: "Aún no has agregado productos." },
  { key: "cta.add", value: "Agregar" },
  { key: "cta.order", value: "Pedir por WhatsApp" },
  { key: "footer.contact", value: "Contacto" },
  { key: "footer.address", value: "Dirección" },
];
