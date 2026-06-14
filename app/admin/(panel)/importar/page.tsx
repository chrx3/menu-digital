import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileUp } from "lucide-react";
import { requireAdmin } from "@/app/lib/admin-auth";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { getBusinessSlug } from "@/app/lib/business-context";
import { createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ImportMenuClient } from "@/components/admin/ImportMenuClient";
import { ADMIN_PATH } from "@/app/lib/admin-path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ImportMenuPage() {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }
  const { service, user } = ctx;
  const slug = await getBusinessSlug();
  const { data: business } = await service
    .from("businesses")
    .select("name, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();

  const superAdmin = await isSuperAdmin(user.email);
  if (!business && !superAdmin) {
    redirect(ADMIN_PATH);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
          <ArrowLeft className="mr-1.5 size-3.5" aria-hidden="true" />
          Volver
        </Button>
      </div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileUp className="size-5" aria-hidden="true" />
          Importar menú con IA
        </h1>
        <p className="text-muted-foreground">
          Sube una foto o PDF del menú de{" "}
          <strong>{business?.name ?? "(sin nombre)"}</strong> y la IA lo convierte en categorías y productos listos para revisar.
        </p>
      </div>
      <ImportMenuClient />
    </div>
  );
}
