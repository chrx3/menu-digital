/** Genera la ruta WebP esperada para un producto del menú */
export function slugifyProductName(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getProductImagePath(categoriaId: string, productoNombre: string): string {
  return `/menu/${categoriaId}/${slugifyProductName(productoNombre)}.webp`;
}
