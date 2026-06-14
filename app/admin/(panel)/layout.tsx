import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { listBusinesses } from "@/app/actions/businesses";
import { getBusinessSlug } from "@/app/lib/business-context";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }

  const { businessId, service, user } = ctx;
  const slug = await getBusinessSlug();
  const [{ data: business }, { data: theme }] = await Promise.all([
    service
      .from("businesses")
      .select("name, is_active, slug")
      .eq("id", businessId)
      .maybeSingle(),
    service
      .from("business_themes")
      .select("color_primary, color_primary_text")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  const superAdmin = await isSuperAdmin(user.email);
  const businesses = superAdmin ? (await listBusinesses()).data ?? [] : [];

  return (
    <AdminShell
      businessName={business?.name ?? "Mi negocio"}
      businessSlug={business?.slug ?? slug}
      isActive={business?.is_active ?? false}
      userEmail={user.email ?? null}
      primaryColor={theme?.color_primary ?? null}
      primaryTextColor={theme?.color_primary_text ?? null}
      isSuperAdmin={superAdmin}
      businesses={businesses.map((b) => ({ slug: b.slug, name: b.name }))}
    >
      {children}
    </AdminShell>
  );
}
