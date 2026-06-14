"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin-auth";
import { importMenuSchema, type ImportMenu } from "@/app/lib/import-menu-schema";

function refreshMenu() {
  revalidatePath("/");
  revalidatePath("/admin");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let s = base || "item";
  if (!taken.has(s)) {
    taken.add(s);
    return s;
  }
  let i = 2;
  while (taken.has(`${s}-${i}`)) i++;
  const out = `${s}-${i}`;
  taken.add(out);
  return out;
}

export async function applyImportedMenu(rawJson: unknown) {
  try {
    const { businessId, service } = await requireAdmin();
    const parsed = importMenuSchema.safeParse(rawJson);
    if (!parsed.success) {
      return {
        error: "JSON inválido: " + parsed.error.issues[0]?.message,
        data: undefined,
      };
    }
    const { categories } = parsed.data;

    // Collect existing slugs to avoid collisions within this business.
    const [{ data: existingCats }, { data: existingProducts }] = await Promise.all([
      service.from("categories").select("slug").eq("business_id", businessId),
      service.from("products").select("slug, categories!inner(business_id)").eq("categories.business_id", businessId),
    ]);
    const takenCats = new Set((existingCats ?? []).map((c) => c.slug as string));
    const takenProds = new Set((existingProducts ?? []).map((p) => p.slug as string));

    let createdCats = 0;
    let createdProds = 0;

    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      const catSlug = uniqueSlug(c.slug ?? slugify(c.titulo), takenCats);

      const { data: cat, error: catError } = await service
        .from("categories")
        .insert({
          business_id: businessId,
          slug: catSlug,
          titulo: c.titulo,
          descripcion: c.descripcion || null,
          tipo_precio: c.tipo_precio || "unico",
          opciones_nombre: c.opciones_nombre || null,
          etiqueta_whatsapp: c.etiqueta_whatsapp || null,
          destacado: c.destacado ?? false,
          orden: i,
          is_active: true,
        })
        .select("id")
        .single();
      if (catError || !cat) {
        return {
          error: `Categoría "${c.titulo}": ${catError?.message ?? "sin id"}`,
          data: { createdCats, createdProds },
        };
      }
      createdCats++;

      // Category options if tipo_precio != unico
      if (c.tipo_precio !== "unico" && c.productos.length > 0) {
        const allOpts = new Set<string>();
        for (const p of c.productos) for (const o of p.opciones ?? []) allOpts.add(o.value);
        const opts = Array.from(allOpts).map((value, idx) => {
          const sample = c.productos
            .flatMap((p) => p.opciones ?? [])
            .find((o) => o.value === value);
          return {
            category_id: cat.id,
            value,
            label: sample?.label ?? value,
            orden: idx,
          };
        });
        if (opts.length > 0) {
          await service.from("category_options").insert(opts);
        }
      }

      // Products
      for (let j = 0; j < c.productos.length; j++) {
        const p = c.productos[j];
        const productSlug = uniqueSlug(p.slug ?? slugify(p.nombre), takenProds);

        const { data: prod, error: prodError } = await service
          .from("products")
          .insert({
            category_id: cat.id,
            slug: productSlug,
            nombre: p.nombre,
            imagen: p.imagen || null,
            precio_unico: p.precio ?? null,
            destacado: p.destacado ?? false,
            tiene_estilo: false,
            estilo_nombre: null,
            estilo_opciones: null,
            incluye: p.incluye?.length ? p.incluye : null,
            incluye_texto: p.incluye_texto || null,
            orden: j,
            is_active: true,
          })
          .select("id")
          .single();
        if (prodError || !prod) {
          return {
            error: `Producto "${p.nombre}": ${prodError?.message ?? "sin id"}`,
            data: { createdCats, createdProds },
          };
        }
        createdProds++;

        if (p.ingredientes?.length) {
          await service
            .from("product_ingredients")
            .insert(
              p.ingredientes.map((nombre, idx) => ({
                product_id: prod.id,
                nombre,
                orden: idx,
              })),
            );
        }

        if (p.opciones?.length) {
          await service
            .from("product_prices")
            .insert(
              p.opciones.map((o, idx) => ({
                product_id: prod.id,
                option_value: o.value,
                precio: o.price,
                orden: idx,
              })),
            );
        }

        if (p.promociones?.length) {
          await service.from("promotions").insert(
            p.promociones.map((promo) => ({
              product_id: prod.id,
              type: "promo_2x",
              label: `Promo 2x ${promo.label}`,
              option_value: promo.value,
              precio: promo.price,
              is_active: true,
            })),
          );
        }
      }
    }

    refreshMenu();
    return { data: { createdCats, createdProds } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido", data: undefined };
  }
}
