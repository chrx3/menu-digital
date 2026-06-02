/**
 * Seed Supabase with all hardcoded content (images, business config, categories, products).
 *
 * Usage:
 *   node scripts/seed-supabase.mjs
 *
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Load .env.local manually (Node 22 doesn't have built-in dotenv in ESM)
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ No .env.local found at", envPath);
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUSINESS_ID = "a0000000-0000-0000-0000-000000000001";
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ── Image mappings ──────────────────────────────────────────────────

const PRODUCT_IMAGES = {
  "papas_supremas::Cheddar": "papacheddar.webp",
  "papas_supremas::Chorrillana": "chorillana.webp",
  "papas_supremas::Italiana": "papacheddar.webp",
  "papas_supremas::Chacarera": "papacheddar.webp",
  "papas_supremas::Mexicana": "papacheddar.webp",
  "papas_supremas::Napolitana": "papacheddar.webp",

  "fajitas::Italiana": "fajita.webp",
  "fajitas::Clásica": "fajita.webp",
  "fajitas::Chacarera": "fajita.webp",
  "fajitas::Mexicana": "fajita.webp",
  "fajitas::Napolitana": "fajita.webp",
  "fajitas::A lo Pobre": "fajita.webp",

  "pollo_asado::01. Pollo Entero": "pollo-asado.webp",
  "pollo_asado::02. 1/2 Pollo": "pollo-asado.webp",
  "pollo_asado::03. Pollo Entero + Caja de Papas": "pollo-asado-papas.webp",
  "pollo_asado::04. Pollo Entero + C. Papas + Bebida 2 Lt": "pollo-asado-papas.webp",
  "pollo_asado::05. 1/2 Pollo + Papa Mediana": "pollo-asado-papas.webp",
  "pollo_asado::06. 1/2 Pollo + Papa Grande": "pollo-asado-papas.webp",
  "pollo_asado::07. 1/2 Pollo + Caja de Papas": "pollo-asado-papas.webp",
  "pollo_asado::08. 1/4 Pollo Tuto + Papas (Colación)": "pollo-asado-papas.webp",
  "pollo_asado::09. 1/4 Pollo Pechuga + Papas (Colación)": "pollo-asado-papas.webp",

  "sandwiches::Completo ó Italiano": "churrasco.webp",
  "sandwiches::Luco": "Barros-Luco-.webp",
  "sandwiches::Chacarera": "chacarero.webp",
  "sandwiches::Solo Carne": "churrasco.webp",
  "sandwiches::Brasileño": "churrasco.webp",
  "sandwiches::Dinámico": "churrasco.webp",
  "sandwiches::Napolitano": "churrasco.webp",
  "sandwiches::A lo Pobre": "churrasco.webp",

  "vienesas_y_ases::Sola": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Completo": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Italiano": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Luco": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Chacarera": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Dinámico": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Brasileño": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::Napolitano": "as-italiano-Photoroom.webp",
  "vienesas_y_ases::A lo Pobre": "as-italiano-Photoroom.webp",

  "snacks::Empanadas de Queso (3 unidades)": "empanadas.webp",
  "snacks::10 Nuggets de Pollo": "nuggets.webp",
  "snacks::18 Nuggets de Pollo": "nuggets.webp",
  "snacks::3 Sopaipillas": "sopaipillas.webp",
  "snacks::7 Sopaipillas": "sopaipillas.webp",
  "snacks::Boxkid": "nuggets.webp",
};

const CATEGORY_IMAGES = {
  papas_supremas: "papacheddar.webp",
  fajitas: "fajita.webp",
  pollo_asado: "pollo-asado.webp",
  sandwiches: "churrasco.webp",
  vienesas_y_ases: "as-italiano-Photoroom.webp",
  snacks: "empanadas.webp",
};

const LOGO_FILES = ["mctommy.webp", "mctommy1.webp", "mctommy2.webp", "mctommy-icon.png"];

// ── Step 1: Ensure buckets ───────────────────────────────────────────

async function ensureBuckets() {
  console.log("\n📦 Step 1: Ensuring storage buckets...");

  for (const bucket of ["products", "logos"]) {
    const { data, error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error && !error.message.includes("already exists")) {
      console.error(`  ❌ Failed to create bucket "${bucket}":`, error.message);
    } else {
      console.log(`  ✅ Bucket "${bucket}" ready (public)`);
    }
  }
}

// ── Step 2: Upload images ────────────────────────────────────────────

async function uploadImages() {
  console.log("\n🖼️  Step 2: Uploading images...");
  const publicDir = join(ROOT, "public");

  // Collect all unique files to upload
  const filesToUpload = new Set([
    ...Object.values(PRODUCT_IMAGES),
    ...Object.values(CATEGORY_IMAGES),
    ...LOGO_FILES,
  ]);

  for (const filename of filesToUpload) {
    const filePath = join(publicDir, filename);
    if (!existsSync(filePath)) {
      console.warn(`  ⚠️  File not found: ${filename}`);
      continue;
    }

    const ext = extname(filename).slice(1);
    const contentType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/webp";
    const bucket = LOGO_FILES.includes(filename) ? "logos" : "products";
    const storagePath = filename;

    const fileBuffer = readFileSync(filePath);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: "86400",
      });

    if (error) {
      console.error(`  ❌ Upload failed: ${filename}`, error.message);
    } else {
      console.log(`  ✅ ${filename} → ${bucket}/${storagePath}`);
    }
  }
}

// ── Step 3: Update business config with image URLs ───────────────────

async function updateBusinessConfig() {
  console.log("\n🏢 Step 3: Updating business config with logo URLs...");

  const logoDesktop = `${PUBLIC_URL}/storage/v1/object/public/logos/mctommy.webp`;
  const logoMobile = [
    `${PUBLIC_URL}/storage/v1/object/public/logos/mctommy1.webp`,
    `${PUBLIC_URL}/storage/v1/object/public/logos/mctommy2.webp`,
  ];
  const favicon = `${PUBLIC_URL}/storage/v1/object/public/logos/mctommy-icon.png`;
  const appleIcon = `${PUBLIC_URL}/storage/v1/object/public/logos/mctommy-icon.png`;

  const { error } = await supabase
    .from("businesses")
    .update({
      logo_desktop: logoDesktop,
      logo_mobile: logoMobile,
      favicon: favicon,
      apple_icon: appleIcon,
    })
    .eq("id", BUSINESS_ID);

  if (error) {
    console.error("  ❌ Failed to update business:", error.message);
  } else {
    console.log("  ✅ Business logos updated");
    console.log(`     Desktop: ${logoDesktop}`);
    console.log(`     Mobile:  ${JSON.stringify(logoMobile)}`);
    console.log(`     Favicon: ${favicon}`);
  }
}

// ── Step 4: Update category images ───────────────────────────────────

async function updateCategoryImages() {
  console.log("\n📂 Step 4: Updating category images...");

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("business_id", BUSINESS_ID);

  if (error || !categories) {
    console.error("  ❌ Failed to fetch categories:", error?.message);
    return;
  }

  for (const cat of categories) {
    const filename = CATEGORY_IMAGES[cat.slug];
    if (!filename) {
      console.log(`  ⏭️  No image for category "${cat.slug}"`);
      continue;
    }

    const imageUrl = `${PUBLIC_URL}/storage/v1/object/public/products/${filename}`;
    const { error: updateError } = await supabase
      .from("categories")
      .update({ imagen: imageUrl })
      .eq("id", cat.id);

    if (updateError) {
      console.error(`  ❌ Failed to update category "${cat.slug}":`, updateError.message);
    } else {
      console.log(`  ✅ Category "${cat.slug}" → ${filename}`);
    }
  }
}

// ── Step 5: Update product images ────────────────────────────────────

async function updateProductImages() {
  console.log("\n🍔 Step 5: Updating product images...");

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("business_id", BUSINESS_ID);

  if (catError || !categories) {
    console.error("  ❌ Failed to fetch categories:", catError?.message);
    return;
  }

  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, nombre, category_id, categories(slug)")
    .eq("categories.business_id", BUSINESS_ID);

  if (prodError || !products) {
    console.error("  ❌ Failed to fetch products:", prodError?.message);
    return;
  }

  let updated = 0;
  for (const prod of products) {
    const catSlug = prod.categories?.slug;
    if (!catSlug) continue;

    const key = `${catSlug}::${prod.nombre}`;
    const filename = PRODUCT_IMAGES[key];
    if (!filename) continue;

    const imageUrl = `${PUBLIC_URL}/storage/v1/object/public/products/${filename}`;
    const { error: updateError } = await supabase
      .from("products")
      .update({ imagen: imageUrl })
      .eq("id", prod.id);

    if (updateError) {
      console.error(`  ❌ Failed to update product "${prod.nombre}":`, updateError.message);
    } else {
      updated++;
    }
  }
  console.log(`  ✅ Updated ${updated} product images`);
}

// ── Run all steps ────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Supabase with MC Tommy content...\n");

  await ensureBuckets();
  await uploadImages();
  await updateBusinessConfig();
  await updateCategoryImages();
  await updateProductImages();

  console.log("\n✨ Seed complete! All hardcoded content is now in Supabase.");
  console.log("   Next step: refactor the app to remove fallback data.");
}

main().catch(console.error);
