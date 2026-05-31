/** Imágenes WebP en public/ — secciones y productos */

export const CATEGORY_IMAGES: Record<string, string> = {
  papas_supremas: "/papacheddar.webp",
  fajitas: "/fajita.webp",
  pollo_asado: "/pollo-asado.webp",
  sandwiches: "/churrasco.webp",
  vienesas_y_ases: "/as-italiano-Photoroom.webp",
  snacks: "/empanadas.webp",
};

/** Banner extra para combos con papas (sección Pollo Asado) */
export const CATEGORY_PROMO_IMAGES: Partial<Record<string, string>> = {
  pollo_asado: "/pollo-asado-papas.webp",
};

const productKey = (categoriaId: string, nombre: string) =>
  `${categoriaId}::${nombre}`;

const PRODUCT_IMAGES: Record<string, string> = {
  // Papas Supremas (solo fotos de papas; el resto usa CATEGORY papacheddar)
  [productKey("papas_supremas", "Cheddar")]: "/papacheddar.webp",
  [productKey("papas_supremas", "Chorrillana")]: "/chorillana.webp",
  [productKey("papas_supremas", "Italiana")]: "/papacheddar.webp",
  [productKey("papas_supremas", "Chacarera")]: "/papacheddar.webp",
  [productKey("papas_supremas", "Mexicana")]: "/papacheddar.webp",
  [productKey("papas_supremas", "Napolitana")]: "/papacheddar.webp",

  // Fajitas (todas con foto de fajita; chacarero.webp es solo sándwich)
  [productKey("fajitas", "Italiana")]: "/fajita.webp",
  [productKey("fajitas", "Clásica")]: "/fajita.webp",
  [productKey("fajitas", "Chacarera")]: "/fajita.webp",
  [productKey("fajitas", "Mexicana")]: "/fajita.webp",
  [productKey("fajitas", "Napolitana")]: "/fajita.webp",
  [productKey("fajitas", "A lo Pobre")]: "/fajita.webp",

  // Pollo asado
  [productKey("pollo_asado", "01. Pollo Entero")]: "/pollo-asado.webp",
  [productKey("pollo_asado", "02. 1/2 Pollo")]: "/pollo-asado.webp",
  [productKey("pollo_asado", "03. Pollo Entero + Caja de Papas")]:
    "/pollo-asado-papas.webp",
  [productKey("pollo_asado", "04. Pollo Entero + C. Papas + Bebida 2 Lt")]:
    "/pollo-asado-papas.webp",
  [productKey("pollo_asado", "05. 1/2 Pollo + Papa Mediana")]:
    "/pollo-asado-papas.webp",
  [productKey("pollo_asado", "06. 1/2 Pollo + Papa Grande")]:
    "/pollo-asado-papas.webp",
  [productKey("pollo_asado", "07. 1/2 Pollo + Caja de Papas")]:
    "/pollo-asado-papas.webp",
  [productKey("pollo_asado", "08. 1/4 Pollo Tuto + Papas (Colación)")]:
    "/pollo-asado-papas.webp",
  [productKey("pollo_asado", "09. 1/4 Pollo Pechuga + Papas (Colación)")]:
    "/pollo-asado-papas.webp",

  // Sándwiches (solo fotos de sándwich: churrasco, chacarero, Barros-Luco)
  [productKey("sandwiches", "Completo ó Italiano")]: "/churrasco.webp",
  [productKey("sandwiches", "Luco")]: "/Barros-Luco-.webp",
  [productKey("sandwiches", "Chacarera")]: "/chacarero.webp",
  [productKey("sandwiches", "Solo Carne")]: "/churrasco.webp",
  [productKey("sandwiches", "Brasileño")]: "/churrasco.webp",
  [productKey("sandwiches", "Dinámico")]: "/churrasco.webp",
  [productKey("sandwiches", "Napolitano")]: "/churrasco.webp",
  [productKey("sandwiches", "A lo Pobre")]: "/churrasco.webp",

  // Vienesas y Ases XL (hot dog / completo — as-italiano; sin sándwich Luco ni chacarero)
  [productKey("vienesas_y_ases", "Completo")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Italiano")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Luco")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Sola")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Chacarera")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Dinámico")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Brasileño")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "Napolitano")]: "/as-italiano-Photoroom.webp",
  [productKey("vienesas_y_ases", "A lo Pobre")]: "/as-italiano-Photoroom.webp",

  // Snacks
  [productKey("snacks", "Empanadas de Queso (3 unidades)")]: "/empanadas.webp",
  [productKey("snacks", "10 Nuggets de Pollo")]: "/nuggets.webp",
  [productKey("snacks", "18 Nuggets de Pollo")]: "/nuggets.webp",
  [productKey("snacks", "3 Sopaipillas")]: "/sopaipillas.webp",
  [productKey("snacks", "7 Sopaipillas")]: "/sopaipillas.webp",
  [productKey("snacks", "Boxkid")]: "/nuggets.webp",
};

export function resolveProductImage(
  categoriaId: string,
  productoNombre: string,
): string | undefined {
  const specific = PRODUCT_IMAGES[productKey(categoriaId, productoNombre)];
  if (specific) return specific;
  return CATEGORY_IMAGES[categoriaId];
}

export function getCategoryImage(categoriaId: string): string | undefined {
  return CATEGORY_IMAGES[categoriaId];
}

export function getCategoryPromoImage(
  categoriaId: string,
): string | undefined {
  return CATEGORY_PROMO_IMAGES[categoriaId];
}

export type SectionSlide = { src: string; alt: string };

/** Imágenes únicas de la sección, en orden de aparición en el menú */
export function buildSectionSlides(
  categoriaId: string,
  items: { nombre: string }[],
): SectionSlide[] {
  const seen = new Set<string>();
  const slides: SectionSlide[] = [];

  for (const item of items) {
    const src = resolveProductImage(categoriaId, item.nombre);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    slides.push({ src, alt: item.nombre });
  }

  const fallback = CATEGORY_IMAGES[categoriaId];
  if (slides.length === 0 && fallback) {
    slides.push({ src: fallback, alt: "Menú" });
  }

  const promo = CATEGORY_PROMO_IMAGES[categoriaId];
  if (promo && !seen.has(promo)) {
    slides.push({ src: promo, alt: "Combos y promos" });
  }

  return slides;
}

export function getSlideSrcForProduct(
  categoriaId: string,
  productoNombre: string,
): string | undefined {
  return resolveProductImage(categoriaId, productoNombre);
}
