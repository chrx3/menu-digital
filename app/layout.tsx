import type { Metadata, Viewport } from "next";
import { Fredoka, Poppins } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MC Tommy - Menú Digital | Comida Rápida Chilena",
  description:
    "Menú digital interactivo de MC Tommy. Las mejores papas supremas, fajitas, pollo asado, sándwiches y más.",
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fredoka.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-crema text-marron-oscuro">{children}</body>
    </html>
  );
}
