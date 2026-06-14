import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_SLUG = "mc-tommy";
const SLUG_HEADER = "x-business-slug";

async function slugFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get(SLUG_HEADER);
}

function slugFromEnv(): string | null {
  const v = process.env.NEXT_PUBLIC_BUSINESS_SLUG;
  return v && v.length > 0 ? v : null;
}

export async function getBusinessSlug(): Promise<string> {
  // ponytail: proxy.ts sets x-business-slug from host. Env var is dev/fallback.
  return (await slugFromHeaders()) || slugFromEnv() || DEFAULT_SLUG;
}

export async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const slug = await getBusinessSlug();
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("No se encontró un negocio activo para el slug configurado.");
  }

  return data.id as string;
}

export async function getBusinessSlugSync(): Promise<string> {
  return getBusinessSlug();
}
