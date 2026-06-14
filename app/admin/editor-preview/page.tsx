import { loadLandingConfigWithAuth } from "@/app/config/loader";
import { loadMenuFromDB } from "@/app/config/menu-loader";
import {
  HIDDEN_BUILTIN_KEY,
  parseHiddenBuiltins,
} from "@/app/lib/particle-icons";
import { PreviewClient } from "./PreviewClient";

export const dynamic = "force-dynamic";

export default async function EditorPreviewPage() {
  const [config, menu] = await Promise.all([
    loadLandingConfigWithAuth(),
    loadMenuFromDB(),
  ]);

  return (
    <PreviewClient
      initialState={{
        business: config?.business ?? null,
        theme: config?.theme ?? null,
        translations: config?.translations ?? {},
        particleIcons: config?.particleIcons ?? [],
        hiddenBuiltins: parseHiddenBuiltins(
          config?.translations?.[HIDDEN_BUILTIN_KEY],
        ),
        menu: menu ?? [],
      }}
    />
  );
}
