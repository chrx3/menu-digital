import type { CartItem } from "../types";
import { formatSandwichDisplayName } from "./sandwich-options";

/** Etiqueta corta del tipo de plato para el mensaje de pedido */
const TIPO_PLATO: Record<string, string> = {
  papas_supremas: "Papa Suprema",
  fajitas: "Fajita",
  pollo_asado: "Pollo Asado",
  sandwiches: "Sándwich",
  vienesas_y_ases: "Vienesa / As",
  snacks: "Extra",
};

const VARIANTES_OMITIDAS = new Set(["Precio", "Precio único", "unico"]);

function formatVariante(variante: string): string {
  if (!variante || VARIANTES_OMITIDAS.has(variante)) return "";
  return ` (${variante})`;
}

/** Nombre legible del ítem para WhatsApp (incluye tipo: papa, fajita, etc.) */
export function formatCartItemDisplayName(item: CartItem): string {
  const variante = formatVariante(item.variante);
  const tipo = TIPO_PLATO[item.categoriaId] ?? item.categoriaTitulo;

  switch (item.categoriaId) {
    case "papas_supremas":
    case "fajitas":
      return `${tipo} ${item.productoNombre}${variante}`;
    case "pollo_asado":
      return `${tipo}: ${item.productoNombre}`;
    case "sandwiches":
      return formatSandwichDisplayName(item.productoNombre, item.variante);
    case "vienesas_y_ases":
      return `${tipo}: ${item.productoNombre}${variante}`;
    case "snacks":
      return `${item.productoNombre}`;
    default:
      return `${item.categoriaTitulo}: ${item.productoNombre}${variante}`;
  }
}

export function formatCartItemPriceText(item: CartItem): string {
  if (item.promo2x && item.cantidad >= 2) {
    const pairs = Math.floor(item.cantidad / 2);
    const remainder = item.cantidad % 2;
    const pairPrice = item.promo2x;
    if (remainder === 0) {
      return `Promo 2x $${pairPrice.toLocaleString("es-CL")} (${pairs} ${pairs === 1 ? "par" : "pares"})`;
    }
    return `Promo 2x $${pairPrice.toLocaleString("es-CL")} (${pairs} ${pairs === 1 ? "par" : "pares"}) + 1 individual $${item.precio.toLocaleString("es-CL")}`;
  }

  const subtotal = item.precio * item.cantidad;
  if (item.cantidad === 1) {
    return `$${item.precio.toLocaleString("es-CL")}`;
  }
  return `$${item.precio.toLocaleString("es-CL")} c/u · Subtotal $${subtotal.toLocaleString("es-CL")}`;
}

export function formatCartItemWhatsAppLine(item: CartItem): string {
  const nombre = formatCartItemDisplayName(item);
  const precio = formatCartItemPriceText(item);
  return `• ${item.cantidad}x ${nombre} — ${precio}`;
}

export function formatWhatsAppOrder(
  items: CartItem[],
  total: number,
): string {
  if (items.length === 0) {
    return "¡Hola! Quiero hacer un pedido en MC Tommy.";
  }

  const lineas = items.map(formatCartItemWhatsAppLine).join("\n");

  return `¡Hola! Quiero hacer un pedido en *MC Tommy*:\n\n${lineas}\n\n*Total: $${total.toLocaleString("es-CL")}*`;
}
