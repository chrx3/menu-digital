import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ExternalLink, Store } from "lucide-react";
import { requireAdmin } from "@/app/lib/admin-auth";
import { isSuperAdmin } from "@/app/lib/super-admin";
import { listBusinesses } from "@/app/actions/businesses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleBusinessActiveButton } from "@/components/admin/ToggleBusinessActiveButton";
import { ROOT_DOMAIN } from "@/app/lib/domains";

export default async function NegociosListPage() {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }
  if (!(await isSuperAdmin(ctx.user.email))) redirect("/admin");

  const { data, error } = await listBusinesses();
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }
  const businesses = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
          <p className="text-muted-foreground">
            Gestiona los menús de cada cliente. Cada uno vive en su propio subdominio.
          </p>
        </div>
        <Button render={<Link href="/admin/negocios/nuevo" />}>
          <Plus className="mr-1.5 size-4" aria-hidden="true" />
          Nuevo negocio
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin negocios</CardTitle>
            <CardDescription>Crea el primero para empezar.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {businesses.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Store className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{b.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          b.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}
                      >
                        {b.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      https://{b.slug}.{ROOT_DOMAIN}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Button variant="outline" size="sm" render={<Link href={`https://${b.slug}.${ROOT_DOMAIN}`} target="_blank" rel="noopener noreferrer" />}>
                    <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                    Ver menú
                  </Button>
                  <Button variant="outline" size="sm" render={<Link href={`https://${b.slug}.${ROOT_DOMAIN}/admin`} target="_blank" rel="noopener noreferrer" />}>
                    <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                    Abrir admin
                  </Button>
                  <ToggleBusinessActiveButton id={b.id} isActive={b.is_active} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        ¿No ves el subdominio del cliente? Recuerda configurar el DNS wildcard{" "}
        <code className="rounded bg-muted px-1">*.{ROOT_DOMAIN}</code> apuntando a tu servidor.
      </p>
    </div>
  );
}
