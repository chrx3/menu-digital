import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBusinessSlug } from "@/app/lib/business-context";
import { isSuperAdmin } from "@/app/lib/super-admin";

// ponytail: super_admin bypasses business membership check. Useful for
// app.chrsx3.com where there's no business context.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Debes iniciar sesión para continuar.");
  }

  const service = await createServiceClient();
  const slug = await getBusinessSlug();
  const { data: business, error: businessError } = await service
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (businessError) {
    throw new Error("No se encontró el negocio configurado.");
  }

  if (business) {
    const { data: membership, error: membershipError } = await service
      .from("business_users")
      .select("role")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (membershipError) {
      throw new Error("Error al verificar permisos.");
    }

    if (membership) {
      return { businessId: business.id as string, service, supabase, user };
    }
  }

  // No business context or no membership. Super-admin fallback.
  if (await isSuperAdmin(user.email)) {
    const { data: anyBusiness } = await service
      .from("businesses")
      .select("id")
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    return {
      businessId: anyBusiness?.id ?? "",
      service,
      supabase,
      user,
    };
  }

  throw new Error("No tienes permisos de administrador para este negocio.");
}

export function actionError(error: unknown) {
  let message = "No se pudo completar la operación.";

  if (error instanceof Error) {
    // Zod v4 serializa los issues como JSON en error.message
    if (error.name === "ZodError") {
      try {
        const issues = JSON.parse(error.message) as Array<{
          message: string;
          path: (string | number)[];
          format?: string;
        }>;
        if (Array.isArray(issues) && issues.length > 0) {
          const first = issues[0];
          const field = first.path.length ? first.path.join(".") : null;
          if (first.format === "uuid") {
            message = field
              ? `El campo "${field}" debe ser un ID válido.`
              : "Se requiere un identificador (ID) válido.";
          } else {
            message = field
              ? `Revisa el campo "${field}": ${first.message}`
              : first.message;
          }
        }
      } catch {
        message = error.message;
      }
    } else {
      message = error.message;
    }
  }

  // Mantener la misma forma que los returns de éxito para que TS
  // pueda hacer narrowing con `if (result.error) ... else ...` en consumidores.
  return {
    error: message,
    data: undefined,
    files: undefined,
    success: undefined,
    id: undefined,
    url: undefined,
    name: undefined,
    label: undefined,
    count: undefined,
  };
}
