import type { Metadata, Viewport } from "next";
import { Fredoka, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { loadBusinessConfigCached } from "@/app/config/loader";
import { getBusinessSlug } from "@/app/lib/business-context";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadBusinessConfigCached(await getBusinessSlug()).catch(() => null);
  return {
    title: config?.seoTitle || "Menu Landing | Menú Digital",
    description: config?.seoDescription || "Menú digital interactivo.",
    openGraph: config?.seoOgImage ? { images: [config.seoOgImage] } : undefined,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const config = await loadBusinessConfigCached(await getBusinessSlug()).catch(() => null);
  return { themeColor: config?.seoThemeColor || "#FFF8F0", colorScheme: "light" };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={cn("h-full", "antialiased", fredoka.variable, poppins.variable)}
    >
      <body className="min-h-full bg-crema text-marron-oscuro">{children}</body>
    </html>
  );
}
