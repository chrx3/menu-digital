import type { Producto } from "../types";

export const SANDWICH_COMPLETO_O_ITALIANO = "Completo ó Italiano";

export type SandwichEstilo = "completo" | "italiano";

export const SANDWICH_ESTILO_OPTIONS: {
  label: string;
  value: SandwichEstilo;
}[] = [
  { label: "Italiano", value: "italiano" },
  { label: "Completo", value: "completo" },
];

export function isSandwichEstiloCombo(
  producto: Producto,
  categoriaId: string,
): boolean {
  return (
    categoriaId === "sandwiches" && producto.nombre === SANDWICH_COMPLETO_O_ITALIANO
  );
}

export function estiloSandwichLabel(estilo: SandwichEstilo): string {
  return estilo === "completo" ? "Completo" : "Italiano";
}

/** Texto guardado en el carrito: "Completo · Lomito" o "Chacarera · Mechada" */
export function buildSandwichCartVariante(
  producto: Producto,
  categoriaId: string,
  estilo: SandwichEstilo | null,
  carneLabel: string,
): string {
  if (isSandwichEstiloCombo(producto, categoriaId) && estilo) {
    return `${estiloSandwichLabel(estilo)} · ${carneLabel}`;
  }
  return carneLabel;
}

/** Línea legible para WhatsApp */
export function formatSandwichDisplayName(
  productoNombre: string,
  variante: string,
): string {
  const parts = variante.split(" · ").map((s) => s.trim());
  if (parts.length === 2) {
    const [estilo, carne] = parts;
    return `Sándwich ${estilo} (${carne})`;
  }
  return `Sándwich ${productoNombre} (${variante})`;
}
