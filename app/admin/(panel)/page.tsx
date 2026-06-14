import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Store,
  FolderTree,
  UtensilsCrossed,
  Image as ImageIcon,
  Languages,
  Palette,
  Eye,
  ExternalLink,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";

export default async function AdminDashboard() {
  const { businessId, service } = await requireAdmin();

  const [businessRes, categoriesRes, translationsRes, themeRes, imagesRes] =
    await Promise.all([
      service
        .from("businesses")
        .select("name, is_active, logo_desktop")
        .eq("id", businessId)
        .single(),
      service
        .from("categories")
        .select("id, titulo, is_active")
        .eq("business_id", businessId),
      service
        .from("translations")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId),
      service
        .from("business_themes")
        .select("id")
        .eq("business_id", businessId)
        .maybeSingle(),
      service.storage.from("products").list(businessId),
    ]);

  const categories = categoriesRes.data ?? [];
  const categoryIds = categories.map((c: { id: string }) => c.id);

  const productsRes = categoryIds.length
    ? await service
        .from("products")
        .select("id, is_active, imagen, category_id")
        .in("category_id", categoryIds)
    : { data: [] as ProductRow[] };
  const products = (productsRes.data ?? []) as ProductRow[];

  const businessName = businessRes.data?.name || "—";
  const isActive = businessRes.data?.is_active ?? false;
  const hasLogo = Boolean(businessRes.data?.logo_desktop);
  const activeCategories = categories.filter((c) => c.is_active).length;
  const totalCategories = categories.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const totalProducts = products.length;
  const translationCount = translationsRes.count ?? 0;
  const hasTheme = Boolean(themeRes.data);
  const totalImages = (imagesRes.data || []).filter(
    (f: { id: string | null }) => f.id && !f.id.endsWith("/"),
  ).length;

  const productsWithoutImage = products.filter((p) => !p.imagen).length;
  const categoriesWithProducts = new Set(
    products.map((p) => p.category_id),
  );
  const emptyCategories = categories.filter(
    (c) => !categoriesWithProducts.has(c.id),
  );

  const checklist = [
    { label: "Logo cargado", done: hasLogo, href: "/admin/negocio" },
    { label: "Al menos 1 categoría", done: totalCategories > 0, href: "/admin/menu" },
    { label: "Al menos 1 producto", done: totalProducts > 0, href: "/admin/menu" },
    { label: "Tema configurado", done: hasTheme, href: "/admin/tema" },
    { label: "Traducciones cargadas", done: translationCount > 0, href: "/admin/traducciones" },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const setupComplete = completed === checklist.length;

  const alerts = [
    !isActive && {
      message: "El negocio está inactivo y no se muestra en la landing.",
      href: "/admin/negocio",
      cta: "Activar negocio",
    },
    productsWithoutImage > 0 && {
      message: `${productsWithoutImage} ${productsWithoutImage === 1 ? "producto" : "productos"} sin imagen.`,
      href: "/admin/menu",
      cta: "Revisar productos",
    },
    emptyCategories.length > 0 && {
      message: `${emptyCategories.length} ${emptyCategories.length === 1 ? "categoría vacía" : "categorías vacías"}: ${emptyCategories.map((c) => c.titulo).join(", ")}.`,
      href: "/admin/menu",
      cta: "Agregar productos",
    },
  ].filter(Boolean) as { message: string; href: string; cta: string }[];

  const stats = [
    { title: "Negocio", description: `${businessName} — ${isActive ? "Activo" : "Inactivo"}`, icon: Store, href: "/admin/negocio" },
    { title: "Categorías", description: `${activeCategories} activas de ${totalCategories}`, icon: FolderTree, href: "/admin/menu" },
    { title: "Productos", description: `${activeProducts} activos de ${totalProducts}`, icon: UtensilsCrossed, href: "/admin/menu" },
    { title: "Imágenes", description: `${totalImages} en almacenamiento`, icon: ImageIcon, href: "/admin/imagenes" },
    { title: "Traducciones", description: `${translationCount} textos de interfaz`, icon: Languages, href: "/admin/traducciones" },
    { title: "Tema", description: hasTheme ? "Configurado" : "Sin configurar", icon: Palette, href: "/admin/tema" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Panel de administración de {businessName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/admin/editor" />}>
            <Eye className="mr-1.5 size-4" aria-hidden="true" />
            Abrir editor
          </Button>
          <Button variant="outline" render={<Link href="/admin/menu" />}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Nuevo producto
          </Button>
          <Button
            variant="outline"
            render={<Link href="/" target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="mr-1.5 size-4" aria-hidden="true" />
            Ver landing
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <Link
              key={alert.message}
              href={alert.href}
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:hover:bg-amber-950"
            >
              <AlertTriangle
                className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <span className="flex-1 text-amber-800 dark:text-amber-200">
                {alert.message}
              </span>
              <span className="shrink-0 font-medium text-amber-700 dark:text-amber-300">
                {alert.cta}
              </span>
            </Link>
          ))}
        </div>
      )}

      {!setupComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completar configuración</CardTitle>
            <CardDescription>
              {completed} de {checklist.length} pasos completados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {checklist.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                {step.done ? (
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
                <span className={step.done ? "text-muted-foreground line-through" : ""}>
                  {step.label}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block">
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface ProductRow {
  id: string;
  is_active: boolean;
  imagen: string | null;
  category_id: string;
}
