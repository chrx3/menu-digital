import { createClient } from "@/lib/supabase/server";

const DEFAULT_SLUG = "mc-tommy";

export function getBusinessSlug(): string {
  return process.env.NEXT_PUBLIC_BUSINESS_SLUG || DEFAULT_SLUG;
}

export async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", getBusinessSlug())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("No se encontró un negocio activo para el slug configurado.");
  }

  return data.id as string;
}

export function getBusinessSlugSync(): string {
  return process.env.NEXT_PUBLIC_BUSINESS_SLUG || DEFAULT_SLUG;
}
