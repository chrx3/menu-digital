import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdmin } from "@/app/lib/admin-auth";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { listBusinesses } from "@/app/actions/businesses";
import { getBusinessSlug, ACTIVE_BUSINESS_COOKIE } from "@/app/lib/business-context";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }

  const { service, user } = ctx;
  const slug = await getBusinessSlug();

  // ponytail: validate the cookie-selected slug. If stale/invalid, clear it.
  const c = await cookies();
  const cookieSlug = c.get(ACTIVE_BUSINESS_COOKIE)?.value;
  if (cookieSlug) {
    const { data: exists } = await service
      .from("businesses")
      .select("id")
      .eq("slug", cookieSlug)
      .eq("is_active", true)
      .maybeSingle();
    if (!exists) {
      c.delete(ACTIVE_BUSINESS_COOKIE);
    }
  }

  // ponytail: look up the business by the resolved slug (cookie > env > default),
  // not by ctx.businessId (which falls back to the first active business).
  const { data: business } = await service
    .from("businesses")
    .select("id, name, is_active, slug")
    .eq("slug", slug)
    .maybeSingle();
  const businessId = business?.id ?? ctx.businessId;

  const { data: theme } = await service
    .from("business_themes")
    .select("color_primary, color_primary_text")
    .eq("business_id", businessId)
    .maybeSingle();

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
