"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { ACTIVE_BUSINESS_COOKIE } from "@/app/lib/business-context";

const SLUG_RE = /^[a-z0-9]+$/;

export async function setActiveBusinessSlug(slug: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email ?? null;
  if (!email) return { error: "Sin sesión." };
  if (!(await isSuperAdmin(email))) return { error: "Sin permisos." };

  const clean = String(slug ?? "").toLowerCase();
  if (!SLUG_RE.test(clean)) return { error: "Slug inválido." };

  const service = await createServiceClient();
  const { data, error } = await service
    .from("businesses")
    .select("id")
    .eq("slug", clean)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Negocio no encontrado." };

  const c = await cookies();
  c.set(ACTIVE_BUSINESS_COOKIE, clean, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/admin", "layout");
  return { data: { slug: clean } };
}

export async function clearActiveBusinessSlug() {
  const c = await cookies();
  c.delete(ACTIVE_BUSINESS_COOKIE);
  revalidatePath("/admin", "layout");
  return { data: { ok: true } };
}
