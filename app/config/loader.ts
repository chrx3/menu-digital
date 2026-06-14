import { createClient, getPublicClient } from "@/lib/supabase/server";
import type { BusinessConfig, BusinessTheme, ParticleIcon } from "./types";
import { getBusinessSlug } from "@/app/lib/business-context";
import { unstable_cache } from "next/cache";

type SupabaseClient = ReturnType<typeof getPublicClient>;

async function loadBusinessConfigWithClient(
  slug: string,
  client: SupabaseClient,
): Promise<BusinessConfig | null> {
  const { data } = await client
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!data) return null;
  return mapBusinessFromDb(data);
}

export async function loadBusinessConfig(): Promise<BusinessConfig | null> {
  const supabase = await createClient();
  return loadBusinessConfigWithClient(await getBusinessSlug(), supabase as SupabaseClient);
}

const loadBusinessConfigCachedFn = unstable_cache(
  async (slug: string) => loadBusinessConfigWithClient(slug, getPublicClient()),
  ["business-config"],
  { revalidate: 60, tags: ["business-config"] },
);

export async function loadBusinessConfigCached(slug?: string) {
  const resolvedSlug = slug ?? (await getBusinessSlug());
  return loadBusinessConfigCachedFn(resolvedSlug);
}

async function loadLandingConfigWithClient(
  slug: string,
  client: SupabaseClient,
) {
  const business = await loadBusinessConfigWithClient(slug, client);
  if (!business?.id) return null;
  const [themeResult, translationsResult, particlesResult] = await Promise.all([
    client
      .from("business_themes")
      .select("*")
      .eq("business_id", business.id)
      .single(),
    client
      .from("translations")
      .select("key, value")
      .eq("business_id", business.id)
      .eq("locale", business.locale),
    client
      .from("particle_icons")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("orden"),
  ]);
  const translations: Record<string, string> = {};
  const translationsData = (translationsResult.data ?? []) as { key: string; value: string }[];
  for (const row of translationsData) {
    translations[row.key] = row.value;
  }
  const particlesData = (particlesResult.data ?? []) as Record<string, unknown>[];
  const particleIcons: ParticleIcon[] = particlesData.map(
    (row) => ({
      id: row.id as string,
      businessId: row.business_id as string,
      name: row.name as string,
      label: row.label as string,
      orden: row.orden as number,
      isActive: row.is_active as boolean,
    }),
  );
  const themeData = themeResult.data as Record<string, unknown> | null;
  return {
    business,
    theme: themeData ? mapThemeFromDb(themeData) : null,
    translations,
    particleIcons,
  };
}

const loadLandingConfigCached = unstable_cache(
  async (slug: string) => loadLandingConfigWithClient(slug, getPublicClient()),
  ["landing-config"],
  { revalidate: 60, tags: ["landing-config"] },
);

export async function loadLandingConfig(slug?: string) {
  const resolvedSlug = slug ?? (await getBusinessSlug());
  return loadLandingConfigCached(resolvedSlug);
}

export async function loadLandingConfigWithAuth() {
  const supabase = await createClient();
  const slug = await getBusinessSlug();
  return loadLandingConfigWithClient(slug, supabase as SupabaseClient);
}

export async function loadBusinessTheme(
  businessId: string,
): Promise<BusinessTheme | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_themes")
    .select("*")
    .eq("business_id", businessId)
    .single();
  if (!data) return null;
  return mapThemeFromDb(data);
}

export async function loadTranslations(
  businessId: string,
  locale = "es-CL",
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("translations")
    .select("key, value")
    .eq("business_id", businessId)
    .eq("locale", locale);
  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    result[row.key] = row.value;
  }
  return result;
}

export async function loadParticleIcons(
  businessId: string,
): Promise<ParticleIcon[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("particle_icons")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("orden");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    businessId: row.business_id as string,
    name: row.name as string,
    label: row.label as string,
    orden: row.orden as number,
    isActive: row.is_active as boolean,
  }));
}

function mapBusinessFromDb(row: Record<string, unknown>): BusinessConfig {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string) || "",
    year: (row.year as number) || 2025,
    locale: (row.locale as string) || "es-CL",
    currency: (row.currency as string) || "CLP",
    lang: (row.lang as string) || "es",
    whatsappNumber: (row.whatsapp_number as string) || "",
    whatsappGreeting: (row.whatsapp_greeting as string) || "",
    phone: (row.phone as string) || "",
    email: (row.email as string) || "",
    address: (row.address as string) || "",
    logoDesktop: (row.logo_desktop as string) || "",
    logoMobile: Array.isArray(row.logo_mobile)
      ? (row.logo_mobile as string[])
      : [],
    logoRotationInterval: (row.logo_rotation_interval as number) || 4000,
    favicon: (row.favicon as string) || "",
    appleIcon: (row.apple_icon as string) || "",
    seoTitle: (row.seo_title as string) || "",
    seoDescription: (row.seo_description as string) || "",
    seoThemeColor: (row.seo_theme_color as string) || "#FFF8F0",
    seoOgImage: (row.seo_og_image as string) || "",
    orderChannels: (row.order_channels as BusinessConfig["orderChannels"]) || {
      whatsapp: true,
      phone: false,
      telegram: false,
    },
    promotionTypes: (row.promotion_types as string[]) || ["promo_2x"],
    isActive: (row.is_active as boolean) || false,
  };
}

function mapThemeFromDb(row: Record<string, unknown>): BusinessTheme {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    colorPrimary: (row.color_primary as string) || "#f5821f",
    colorPrimaryLight: (row.color_primary_light as string) || "#ffb347",
    colorPrimaryIntense: (row.color_primary_intense as string) || "#e86f0a",
    colorPrimaryText: (row.color_primary_text as string) || "#994500",
    colorBackground: (row.color_background as string) || "#fff8f0",
    colorBackgroundDark: (row.color_background_dark as string) || "#f5e6d0",
    colorBackgroundDeep: (row.color_background_deep as string) || "#edd8c0",
    colorTextDark: (row.color_text_dark as string) || "#3d1f00",
    colorTextMedium: (row.color_text_medium as string) || "#5c3410",
    colorTextLight: (row.color_text_light as string) || "#7a4a1a",
    colorWhite: (row.color_white as string) || "#ffffff",
    fontHeading: (row.font_heading as string) || "Fredoka",
    fontHeadingWeights: (row.font_heading_weights as number[]) || [500, 700],
    fontBody: (row.font_body as string) || "Poppins",
    fontBodyWeights: (row.font_body_weights as number[]) || [400, 600],
    headerHeightDesktop: (row.header_height_desktop as string) || "80px",
    headerHeightMobile: (row.header_height_mobile as string) || "72px",
    particlesDesktop: (row.particles_desktop as number) || 20,
    particlesMobile: (row.particles_mobile as number) || 12,
    cartFlyDuration: (row.cart_fly_duration as number) || 0.7,
    cartFlyBallSize: (row.cart_fly_ball_size as number) || 44,
    reducedMotion: (row.reduced_motion as boolean) || false,
  };
}
