import { loadLandingConfig } from "@/app/config/loader";
import { loadMenuFromDB } from "@/app/config/menu-loader";
import MenuLandingClient from "@/app/components/MenuLandingClient";

export const revalidate = 60;

export default async function Home() {
  let menu;
  let config;
  try {
    [menu, config] = await Promise.all([loadMenuFromDB(), loadLandingConfig()]);
  } catch (err) {
    console.error("Failed to load landing config or menu:", err);
    menu = undefined;
    config = undefined;
  }
  return <MenuLandingClient config={config || undefined} menu={menu} />;
}
