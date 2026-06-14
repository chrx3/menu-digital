import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_SLUG = "mctommy";
const SLUG_HEADER = "x-business-slug";
const SLUG_COOKIE = "active_business_slug";

async function slugFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get(SLUG_HEADER);
}

async function slugFromCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(SLUG_COOKIE)?.value || null;
}

function slugFromEnv(): string | null {
  const v = process.env.NEXT_PUBLIC_BUSINESS_SLUG;
  return v && v.length > 0 ? v : null;
}

export async function getBusinessSlug(): Promise<string> {
  // ponytail: precedence — host header (proxy), cookie (super-admin override),
  // env var (dev fallback), then default. Cookie wins over env so the panel
  // can switch businesses without re-deploy.
  return (
    (await slugFromHeaders()) ||
    (await slugFromCookie()) ||
    slugFromEnv() ||
    DEFAULT_SLUG
  );
}

export async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const slug = await getBusinessSlug();
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error("No se encontró un negocio activo para el slug configurado.");
  }

  if (data) return data.id as string;

  // ponytail: super-admin panel with no valid selection — fall back to first active business.
  const { data: fallback } = await supabase
    .from("businesses")
    .select("id")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!fallback) throw new Error("No hay negocios activos.");
  return fallback.id as string;
}

export async function getBusinessSlugSync(): Promise<string> {
  return getBusinessSlug();
}

export const ACTIVE_BUSINESS_COOKIE = SLUG_COOKIE;
