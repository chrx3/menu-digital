export interface PreciosSimple {
  [key: string]: number;
}

export type PrecioSandwichOpcion = {
  individual: number;
  promo_2x: number | null;
};

export interface PreciosSandwich {
  lomito: PrecioSandwichOpcion;
  churrasco: PrecioSandwichOpcion;
  mechada: PrecioSandwichOpcion;
}

export interface Producto {
  nombre: string;
  ingredientes?: string[];
  incluye?: string[];
  detalle?: string;
  precios?: PreciosSimple | PreciosSandwich;
  precio?: number;
  /** Ruta en public/, ej: /menu/papas_supremas/cheddar.webp */
  imagen?: string;
}

export interface Categoria {
  id: string;
  titulo: string;
  descripcion: string;
  /** Imagen de la sección en public/ */
  imagen?: string;
  /** Imagen promocional opcional (ej. combos con papas) */
  imagenPromo?: string;
  items: Producto[];
}

export interface CartItem {
  id: string;
  categoriaId: string;
  categoriaTitulo: string;
  productoNombre: string;
  variante: string;
  precio: number;
  promo2x: number | null;
  cantidad: number;
}

export type PrecioVariante = {
  label: string;
  value: string;
  precio: number;
};

function isPreciosSandwich(
  precios: PreciosSimple | PreciosSandwich,
): precios is PreciosSandwich {
  return "lomito" in precios && "churrasco" in precios && "mechada" in precios;
}

function isPreciosSimple(precios: PreciosSimple | PreciosSandwich): precios is PreciosSimple {
  return !isPreciosSandwich(precios);
}

export function getPrecio(producto: Producto, variante: string): number {
  if (producto.precio !== undefined) {
    return producto.precio;
  }

  if (!producto.precios) return 0;

  if (isPreciosSimple(producto.precios)) {
    const precio = producto.precios[variante];
    if (typeof precio === 'number') {
      return precio;
    }
  } else if (isPreciosSandwich(producto.precios)) {
    const opcion = producto.precios[variante as keyof PreciosSandwich];
    if (opcion?.individual != null) {
      return opcion.individual;
    }
  }

  return 0;
}

export function getVariantes(producto: Producto, categoriaId?: string): PrecioVariante[] {
  if (producto.precio !== undefined) {
    return [{ label: 'Precio', value: 'unico', precio: producto.precio }];
  }

  if (!producto.precios) return [];

  const precios = producto.precios;
  const variantes: PrecioVariante[] = [];

  const labels: Record<string, string> = {
    chica: 'Chica',
    grande: 'Grande',
    familiar: 'Familiar',
    pollo: 'Pollo',
    lomito: 'Lomito',
    churrasco: 'Churrasco',
    mechada: 'Mechada',
    vienesa_xl: 'Vienesa XL',
    as_xl: 'As XL',
    individual: 'Individual',
    promo_2x: 'Promo 2x',
  };

  if (categoriaId === 'sandwiches' && isPreciosSandwich(precios)) {
    const ordenCarne: (keyof PreciosSandwich)[] = [
      'lomito',
      'churrasco',
      'mechada',
    ];
    for (const key of ordenCarne) {
      const opcion = precios[key];
      if (opcion) {
        variantes.push({
          label: labels[key] || key,
          value: key,
          precio: opcion.individual,
        });
      }
    }
  } else if (isPreciosSimple(precios)) {
    Object.entries(precios).forEach(([key, value]) => {
      if (typeof value === 'number') {
        variantes.push({
          label: labels[key] || key,
          value: key,
          precio: value,
        });
      }
    });
  }

  return variantes;
}

export function getPromo2x(producto: Producto, variante: string, categoriaId?: string): number | null {
  if (!producto.precios || categoriaId !== 'sandwiches') return null;

  if (!isPreciosSandwich(producto.precios)) return null;

  const opcion = producto.precios[variante as keyof PreciosSandwich];
  if (opcion?.promo_2x != null) {
    return opcion.promo_2x;
  }

  return null;
}
