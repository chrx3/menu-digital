import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/app/lib/admin-auth";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { NewBusinessForm } from "@/components/admin/NewBusinessForm";
import { Button } from "@/components/ui/button";
import { ROOT_DOMAIN } from "@/app/lib/domains";

export default async function NewBusinessPage() {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }
  if (!(await isSuperAdmin(ctx.user.email))) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/admin/negocios" />}>
          <ArrowLeft className="mr-1.5 size-3.5" aria-hidden="true" />
          Negocios
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo negocio</h1>
        <p className="text-muted-foreground">
          Crea un menú para un nuevo cliente. Vivirá en{" "}
          <code className="rounded bg-muted px-1">https://&lt;slug&gt;.{ROOT_DOMAIN}</code>.
        </p>
      </div>
      <NewBusinessForm />
    </div>
  );
}
