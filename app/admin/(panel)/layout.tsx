import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }

  const { businessId, service, user } = ctx;
  const [{ data: business }, { data: theme }] = await Promise.all([
    service
      .from("businesses")
      .select("name, is_active")
      .eq("id", businessId)
      .single(),
    service
      .from("business_themes")
      .select("color_primary, color_primary_text")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  const superAdmin = await isSuperAdmin(user.email);

  return (
    <AdminShell
      businessName={business?.name ?? "Mi negocio"}
      isActive={business?.is_active ?? false}
      userEmail={user.email ?? null}
      primaryColor={theme?.color_primary ?? null}
      primaryTextColor={theme?.color_primary_text ?? null}
      isSuperAdmin={superAdmin}
    >
      {children}
    </AdminShell>
  );
}
