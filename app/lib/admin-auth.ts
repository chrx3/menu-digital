import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBusinessSlug } from "@/app/lib/business-context";

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
  const { data: business, error: businessError } = await service
    .from("businesses")
    .select("id")
    .eq("slug", getBusinessSlug())
    .single();

  if (businessError || !business) {
    throw new Error("No se encontró el negocio configurado.");
  }

  const { data: membership, error: membershipError } = await service
    .from("business_users")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("No tienes permisos de administrador para este negocio.");
  }

  return { businessId: business.id as string, service, supabase, user };
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

  return {
    error: message,
    data: undefined,
    files: undefined,
    success: undefined,
    id: undefined,
    url: undefined,
    count: undefined,
  };
}
