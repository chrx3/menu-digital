import type { CartItem } from "../types";
import { formatSandwichDisplayName } from "./sandwich-options";

export interface WhatsAppConfig {
  businessName: string;
  greeting: string;
}

const VARIANTES_OMITIDAS = new Set(["Precio", "Precio único", "unico"]);

function formatVariante(variante: string): string {
  if (!variante || VARIANTES_OMITIDAS.has(variante)) return "";
  return ` (${variante})`;
}

export function formatCartItemDisplayName(item: CartItem): string {
  const variante = formatVariante(item.variante);
  const tipo = item.categoriaTitulo;

  switch (item.categoriaId) {
    case "papas_supremas":
    case "fajitas":
      return `${tipo} ${item.productoNombre}${variante}`;
    case "pollo_asado":
      return `${item.productoNombre}`;
    case "sandwiches":
      return formatSandwichDisplayName(item.productoNombre, item.variante);
    case "vienesas_y_ases":
      return `${item.productoNombre}${variante}`;
    case "snacks":
      return `${item.productoNombre}`;
    default:
      return `${tipo}: ${item.productoNombre}${variante}`;
  }
}

export function formatCartItemPriceText(item: CartItem, locale = "es-CL"): string {
  if (item.promo2x && item.cantidad >= 2) {
    const pairs = Math.floor(item.cantidad / 2);
    const remainder = item.cantidad % 2;
    const pairPrice = item.promo2x;
    if (remainder === 0) {
      return `Promo 2x $${pairPrice.toLocaleString(locale)} (${pairs} ${pairs === 1 ? "par" : "pares"})`;
    }
    return `Promo 2x $${pairPrice.toLocaleString(locale)} (${pairs} ${pairs === 1 ? "par" : "pares"}) + 1 individual $${item.precio.toLocaleString(locale)}`;
  }

  const subtotal = item.precio * item.cantidad;
  if (item.cantidad === 1) {
    return `$${item.precio.toLocaleString(locale)}`;
  }
  return `$${item.precio.toLocaleString(locale)} c/u · Subtotal $${subtotal.toLocaleString(locale)}`;
}

export function formatCartItemWhatsAppLine(item: CartItem, locale = "es-CL"): string {
  const nombre = formatCartItemDisplayName(item);
  const precio = formatCartItemPriceText(item, locale);
  return `• ${item.cantidad}x ${nombre} — ${precio}`;
}

export function formatWhatsAppOrder(
  items: CartItem[],
  total: number,
  config?: WhatsAppConfig,
  locale = "es-CL",
): string {
  const name = config?.businessName || "el restaurante";
  if (items.length === 0) {
    return config?.greeting || `¡Hola! Quiero hacer un pedido en ${name}.`;
  }

  const lineas = items.map((i) => formatCartItemWhatsAppLine(i, locale)).join("\n");

  const greeting = config?.greeting?.replace(
    "{name}",
    config.businessName,
  ) || `¡Hola! Quiero hacer un pedido en *${name}*`;

  return `${greeting}:\n\n${lineas}\n\n*Total: $${total.toLocaleString(locale)}*`;
}
