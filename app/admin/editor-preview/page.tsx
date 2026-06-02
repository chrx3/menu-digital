import { loadLandingConfig } from "@/app/config/loader";
import { loadMenuFromDB } from "@/app/config/menu-loader";
import { PreviewClient } from "./PreviewClient";

export const dynamic = "force-dynamic";

export default async function EditorPreviewPage() {
  const [config, menu] = await Promise.all([
    loadLandingConfig(),
    loadMenuFromDB(),
  ]);

  return (
    <PreviewClient
      initialState={{
        business: config?.business ?? null,
        theme: config?.theme ?? null,
        translations: config?.translations ?? {},
        particleIcons: config?.particleIcons ?? [],
        menu: menu ?? [],
      }}
    />
  );
}
