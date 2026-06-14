import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";

function superAdminEmails(): string[] {
  // ponytail: comma-separated env var. Add yours. No DB table needed for v1.
  const v = process.env.SUPER_ADMIN_EMAILS ?? "";
  return v.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function isSuperAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return superAdminEmails().includes(email.toLowerCase());
}

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Debes iniciar sesión para continuar.");
  }

  if (!(await isSuperAdmin(user.email))) {
    throw new Error("No tienes permisos de super-administrador.");
  }

  const service = await createServiceClient();
  return { service, supabase, user };
}
