import { loadLandingConfig } from "@/app/config/loader";
import { loadMenuFromDB } from "@/app/config/menu-loader";
import MenuLandingClient from "@/app/components/MenuLandingClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  let menu;
  let config;
  try {
    [menu, config] = await Promise.all([loadMenuFromDB(), loadLandingConfig()]);
  } catch {
    menu = undefined;
    config = undefined;
  }
  return <MenuLandingClient config={config || undefined} menu={menu} />;
}
