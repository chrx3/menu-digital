import { ThemeEditor } from "@/components/admin/ThemeEditor";
import { LiveThemePreview } from "@/components/admin/LiveThemePreview";
import { getBusinessSlug } from "@/app/lib/business-context";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";

export default async function TemaPage() {
  let ctx: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    ctx = await requireAdmin();
  } catch {
    redirect("/admin/auth/login?error=unauthorized");
  }
  const slug = await getBusinessSlug();
  const service = await ctx.service;
  const { data: theme } = await service
    .from("business_themes")
    .select("*")
    .eq("business_id", ctx.businessId)
    .maybeSingle();
  const { data: business } = await service
    .from("businesses")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  const colors = {
    colorPrimary: theme?.colorPrimary ?? "#f5821f",
    colorPrimaryLight: theme?.colorPrimaryLight ?? "#ffb347",
    colorPrimaryIntense: theme?.colorPrimaryIntense ?? "#e86f0a",
    colorPrimaryText: theme?.colorPrimaryText ?? "#994500",
    colorBackground: theme?.colorBackground ?? "#fff8f0",
    colorBackgroundDark: theme?.colorBackgroundDark ?? "#f5e6d0",
    colorBackgroundDeep: theme?.colorBackgroundDeep ?? "#edd8c0",
    colorTextDark: theme?.colorTextDark ?? "#3d1f00",
    colorTextMedium: theme?.colorTextMedium ?? "#5c3410",
    colorTextLight: theme?.colorTextLight ?? "#7a4a1a",
    colorWhite: theme?.colorWhite ?? "#ffffff",
  };
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tema</h1>
        <p className="text-muted-foreground">Personaliza los colores, tipografía y layout de tu landing</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ThemeEditor />
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <LiveThemePreview
            colors={colors}
            businessName={business?.name ?? "Tu negocio"}
          />
          <p className="text-xs text-muted-foreground">
            El preview muestra el theme actual. Edita los colores y guarda para verlo reflejado. Usa "Auto-ajustar" para una paleta derivada con mejor contraste.
          </p>
        </aside>
      </div>
    </div>
  );
}
