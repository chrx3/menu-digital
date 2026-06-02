import { loadLandingConfig } from "@/app/config/loader";
import { loadMenuFromDB } from "@/app/config/menu-loader";
import { TemplateEditor } from "@/components/admin/editor/TemplateEditor";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const [config, menu] = await Promise.all([
    loadLandingConfig(),
    loadMenuFromDB(),
  ]);

  if (!config?.business) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No se encontró configuración para el negocio.
      </div>
    );
  }

  // Fill all remaining space; AdminShell disables main scroll on this route.
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TemplateEditor
        initialState={{
          business: config.business,
          theme: config.theme,
          translations: config.translations ?? {},
          particleIcons: config.particleIcons ?? [],
          menu: menu ?? [],
        }}
      />
    </div>
  );
}
