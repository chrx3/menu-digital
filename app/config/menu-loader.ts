import { createClient } from "@/lib/supabase/server";
import type { Categoria, Producto, PreciosSimple } from "@/app/types";
import { getBusinessId } from "@/app/lib/business-context";

export async function loadMenuFromDB(): Promise<Categoria[]> {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const { data: categories, error } = await supabase
    .from("categories")
    .select(`*, category_options(*), products(*, product_ingredients(*), product_prices(*), promotions(*))`)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("orden");

  if (error || !categories?.length) return [];
  return categories.map(mapCategoriaFromDB);
}

function mapCategoriaFromDB(cat: Record<string, unknown>): Categoria {
  const items = ((cat.products as Record<string, unknown>[]) || [])
    .filter((product) => product.is_active !== false)
    .sort((a, b) => ((a.orden as number) || 0) - ((b.orden as number) || 0))
    .map(mapProductoFromDB);

  return {
    id: cat.slug as string,
    dbId: (cat.id as string) || undefined,
    titulo: cat.titulo as string,
    descripcion: (cat.descripcion as string) || "",
    imagen: (cat.imagen as string) || undefined,
    tipoPrecio: (cat.tipo_precio as string) || "unico",
    opcionesNombre: (cat.opciones_nombre as string) || undefined,
    etiquetaWhatsApp: (cat.etiqueta_whatsapp as string) || undefined,
    destacado: Boolean(cat.destacado),
    opciones: ((cat.category_options as { label: string; value: string; orden: number }[]) || [])
      .sort((a, b) => (a.orden || 0) - (b.orden || 0)),
    items,
  };
}

function mapProductoFromDB(product: Record<string, unknown>): Producto {
  const prices = product.product_prices as { option_value: string; precio: number }[] | undefined;
  const promos = product.promotions as { option_value: string; precio: number; is_active?: boolean }[] | undefined;
  const ingredients = product.product_ingredients as { nombre: string; orden: number }[] | undefined;
  const ingredientes = (ingredients || [])
    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
    .map((ingredient) => ingredient.nombre);
  const mapped: Producto = {
    id: (product.id as string) || undefined,
    slug: (product.slug as string) || undefined,
    nombre: product.nombre as string,
    imagen: (product.imagen as string) || undefined,
    ingredientes: ingredientes.length ? ingredientes : undefined,
    destacado: Boolean(product.destacado),
    tieneEstilo: Boolean(product.tiene_estilo),
    estiloNombre: (product.estilo_nombre as string) || undefined,
    estiloOpciones: (product.estilo_opciones as { label: string; value: string }[]) || undefined,
  };

  const incluye = product.incluye as string[] | undefined;
  if (incluye?.length) mapped.incluye = incluye;
  if (product.incluye_texto) mapped.detalle = product.incluye_texto as string;

  if (prices?.length) {
    const precios: PreciosSimple = {};
    for (const price of prices) precios[price.option_value] = price.precio;
    mapped.precios = precios;
  } else if (product.precio_unico != null) {
    mapped.precio = product.precio_unico as number;
  }

  if (promos?.length) {
    mapped.promociones = Object.fromEntries(
      promos.filter((promo) => promo.is_active !== false).map((promo) => [promo.option_value, promo.precio]),
    );
  }

  return mapped;
}
