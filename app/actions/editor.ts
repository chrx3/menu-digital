"use server";

import { revalidatePath } from "next/cache";
import { actionError, requireAdmin } from "@/app/lib/admin-auth";
import { isValidParticleIconName } from "@/app/lib/particle-icons";
import { loadMenuFromDB } from "@/app/config/menu-loader";
import { slugify } from "@/lib/utils";
import type { BusinessConfig, BusinessTheme, ParticleIcon } from "@/app/config/types";
import type { Categoria, PreciosSandwich, PreciosSimple, Producto } from "@/app/types";

interface EditorStateSnapshot {
  business: BusinessConfig;
  theme: BusinessTheme | null;
  translations: Record<string, string>;
  particleIcons: ParticleIcon[];
  hiddenBuiltins?: string[];
  menu: Categoria[];
}

/** Returns the menu (with DB ids) for the editor to refresh after a CRUD op. */
export async function getEditorMenu(): Promise<Categoria[]> {
  await requireAdmin();
  return loadMenuFromDB();
}

function isPreciosSandwich(
  precios: PreciosSimple | PreciosSandwich,
): precios is PreciosSandwich {
  return "lomito" in precios || "churrasco" in precios || "mechada" in precios;
}

function productoToSavePayload(product: Producto, categoryDbId: string) {
  const prices: { option_value: string; precio: number }[] = [];
  const promotions: {
    option_value: string;
    precio: number;
    type?: string;
  }[] = [];

  if (product.precios && isPreciosSandwich(product.precios)) {
    for (const meat of ["lomito", "churrasco", "mechada"] as const) {
      const p = product.precios[meat];
      if (p?.individual != null) {
        prices.push({ option_value: meat, precio: p.individual });
      }
      if (p?.promo_2x != null) {
        promotions.push({
          option_value: meat,
          precio: p.promo_2x,
          type: "promo_2x",
        });
      }
    }
  } else if (product.precios) {
    for (const [option_value, precio] of Object.entries(
      product.precios as PreciosSimple,
    )) {
      if (typeof precio === "number") {
        prices.push({ option_value, precio });
      }
    }
  }

  if (product.promociones) {
    for (const [option_value, precio] of Object.entries(product.promociones)) {
      if (!promotions.some((p) => p.option_value === option_value)) {
        promotions.push({ option_value, precio, type: "promo_2x" });
      }
    }
  }

  return {
    p_category_id: categoryDbId,
    p_nombre: product.nombre,
    p_slug: product.slug || slugify(product.nombre),
    p_imagen: product.imagen || null,
    p_precio_unico: product.precio ?? null,
    p_destacado: product.destacado ?? false,
    p_tiene_estilo: product.tieneEstilo ?? false,
    p_estilo_nombre: product.tieneEstilo ? product.estiloNombre || null : null,
    p_estilo_opciones: product.tieneEstilo ? product.estiloOpciones || null : null,
    p_incluye: product.incluye?.length ? product.incluye : null,
    p_incluye_texto: product.detalle || null,
    p_orden: 0,
    p_is_active: true,
    p_ingredients: product.ingredientes || [],
    p_prices: prices,
    p_promotions: promotions,
  };
}

export async function saveEditorState(state: EditorStateSnapshot) {
  try {
    const { businessId, service, supabase } = await requireAdmin();
    const errors: string[] = [];

    // 1. Save business config
    const { error: bizErr } = await service
      .from("businesses")
      .update({
        name: state.business.name,
        description: state.business.description,
        year: state.business.year,
        whatsapp_number: state.business.whatsappNumber,
        whatsapp_greeting: state.business.whatsappGreeting,
        logo_desktop: state.business.logoDesktop,
        logo_mobile: state.business.logoMobile,
        logo_rotation_interval: state.business.logoRotationInterval,
        phone: state.business.phone,
        email: state.business.email,
        address: state.business.address,
        seo_title: state.business.seoTitle,
        seo_description: state.business.seoDescription,
        seo_theme_color: state.business.seoThemeColor,
        seo_og_image: state.business.seoOgImage,
        order_channels: state.business.orderChannels,
        is_active: state.business.isActive,
      })
      .eq("id", businessId);

    if (bizErr) errors.push(`Negocio: ${bizErr.message}`);

    // 2. Save theme
    if (state.theme) {
      const { error: themeErr } = await service
        .from("business_themes")
        .update({
          color_primary: state.theme.colorPrimary,
          color_primary_light: state.theme.colorPrimaryLight,
          color_primary_intense: state.theme.colorPrimaryIntense,
          color_primary_text: state.theme.colorPrimaryText,
          color_background: state.theme.colorBackground,
          color_background_dark: state.theme.colorBackgroundDark,
          color_background_deep: state.theme.colorBackgroundDeep,
          color_text_dark: state.theme.colorTextDark,
          color_text_medium: state.theme.colorTextMedium,
          color_text_light: state.theme.colorTextLight,
          color_white: state.theme.colorWhite,
          font_heading: state.theme.fontHeading,
          font_body: state.theme.fontBody,
          header_height_desktop: state.theme.headerHeightDesktop,
          header_height_mobile: state.theme.headerHeightMobile,
          particles_desktop: state.theme.particlesDesktop,
          particles_mobile: state.theme.particlesMobile,
          cart_fly_duration: state.theme.cartFlyDuration,
          cart_fly_ball_size: state.theme.cartFlyBallSize,
          reduced_motion: state.theme.reducedMotion,
        })
        .eq("business_id", businessId);

      if (themeErr) errors.push(`Tema: ${themeErr.message}`);
    }

    // 3. Save translations
    for (const [key, value] of Object.entries(state.translations)) {
      const { error: transErr } = await service
        .from("translations")
        .upsert(
          {
            business_id: businessId,
            locale: state.business.locale || "es-CL",
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,locale,key" },
        );
      if (transErr) errors.push(`Traducción "${key}": ${transErr.message}`);
    }

    // 4. Save particle icons (full replace, atomic via DB function)
    const hiddenSet = new Set(state.hiddenBuiltins ?? []);
    const activeIcons = state.particleIcons
      .filter(
        (i) =>
          i.isActive &&
          !hiddenSet.has(i.name) &&
          isValidParticleIconName(i.name) &&
          i.label.trim().length > 0 &&
          i.label.length <= 60,
      )
      .slice(0, 30)
      .map((i, idx) => ({
        business_id: businessId,
        name: i.name,
        label: i.label.trim(),
        orden: idx,
        is_active: true,
      }));

    const { error: iconsErr } = await supabase.rpc(
      "replace_particle_icons_transaction",
      {
        p_business_id: businessId,
        p_icons: activeIcons,
      },
    );
    if (iconsErr) errors.push(`Partículas: ${iconsErr.message}`);

    // 5. Save categories with full config + options
    for (const cat of state.menu) {
      if (!cat.dbId) continue;

      const { error: catErr } = await service
        .from("categories")
        .update({
          titulo: cat.titulo,
          descripcion: cat.descripcion || "",
          imagen: cat.imagen || null,
          tipo_precio: cat.tipoPrecio || "unico",
          opciones_nombre: cat.opcionesNombre || null,
          etiqueta_whatsapp: cat.etiquetaWhatsApp || null,
          destacado: cat.destacado ?? false,
        })
        .eq("id", cat.dbId)
        .eq("business_id", businessId);

      if (catErr) errors.push(`Categoría "${cat.titulo}": ${catErr.message}`);

      if (cat.opciones?.length) {
        const { error: optErr } = await supabase.rpc(
          "replace_category_options_transaction",
          {
            p_category_id: cat.dbId,
            p_options: cat.opciones.map((opt, idx) => ({
              label: opt.label,
              value: opt.value,
              orden: opt.orden ?? idx,
            })),
          },
        );
        if (optErr)
          errors.push(
            `Opciones de "${cat.titulo}": ${optErr.message}`,
          );
      }

      // 6. Save products with full config (prices, ingredients, promos)
      for (const product of cat.items) {
        let productId = product.id;

        if (!productId) {
          const slug =
            product.slug ||
            slugify(product.nombre);
          const { data: productRow } = await service
            .from("products")
            .select("id")
            .eq("category_id", cat.dbId)
            .eq("slug", slug)
            .maybeSingle();
          productId = productRow?.id;
        }

        if (!productId) continue;

        const payload = productoToSavePayload(product, cat.dbId);
        const { error: prodErr } = await supabase.rpc(
          "save_product_transaction",
          { p_id: productId, ...payload },
        );
        if (prodErr)
          errors.push(`Producto "${product.nombre}": ${prodErr.message}`);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");

    if (errors.length > 0) {
      return {
        success: false,
        error: `Guardado con errores: ${errors.join(" | ")}`,
      };
    }

    return { success: true, error: undefined };
  } catch (error) {
    return actionError(error);
  }
}
