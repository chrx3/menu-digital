# Plan de Implementación — Modo Admin con Next.js + Supabase

## Stack Tecnológico Definitivo

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Framework | **Next.js 16** (App Router) | Fullstack: SSR, API routes, Server Actions |
| Base de datos | **Supabase** (Postgres) | DB, Auth, Storage, Realtime |
| ORM | **Supabase JS Client** | Queries tipadas con el client |
| UI Admin | **shadcn/ui** + Tailwind v4 | Componentes admin consistentes |
| Forms | **React Hook Form** + **Zod** | Validación y manejo de formularios |
| Auth | **Supabase Auth** | Email/password, middleware |
| Imágenes | **Supabase Storage** | Upload y CDN de imágenes |
| Despliegue | **Vercel** | Deploy automático, ISR, Edge |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│                                                      │
│  ┌──────────────┐        ┌──────────────────────┐   │
│  │  / (landing) │        │  /admin/* (protected) │   │
│  │  Server Comp │        │  Client Components    │   │
│  │  ISR/SSR     │        │  Dashboard, CRUD      │   │
│  └──────┬───────┘        └──────────┬───────────┘   │
│         │                           │                │
│         │    Server Actions         │                │
│         └───────────┬───────────────┘                │
│                     │                                │
└─────────────────────┼────────────────────────────────┘
                      │
              ┌───────▼───────┐
              │   Supabase    │
              │  ┌─────────┐  │
              │  │ Postgres│  │
              │  │ Auth    │  │
              │  │ Storage │  │
              │  │ Realtime│  │
              │  └─────────┘  │
              └───────────────┘
```

### Flujo de datos

```
Admin guarda cambios → Server Action → Supabase DB
                                         │
                                         │ revalidatePath("/")
                                         ▼
Landing (ISR/SSR) ← Lee config de DB ← Supabase DB
```

El admin modifica datos via **Server Actions** que invalidan la cache de la landing page usando `revalidatePath()``. La landing sirve como **Server Component** que lee la configuración desde Supabase en cada request (o con ISR `revalidate`).

---

## Estructura de Archivos Propuesta

```
app/
├── layout.tsx                    # Root layout (lee config de negocio)
├── globals.css
├── page.tsx                      # Landing (Server Component, lee de DB)
├── types.ts
│
├── (landing)/                    # Route group para landing pública
│   ├── layout.tsx                # Layout con navbar, footer público
│   └── page.tsx                  # Se mueve aquí el page actual
│
├── admin/                        # Rutas protegidas del admin
│   ├── layout.tsx                # Layout admin con sidebar
│   ├── page.tsx                  # Dashboard
│   ├── negocio/
│   │   └── page.tsx              # Config negocio (nombre, contacto, logos)
│   ├── tema/
│   │   └── page.tsx              # Config colores, fuentes
│   ├── menu/
│   │   ├── page.tsx              # Lista categorías y productos
│   │   ├── categorias/
│   │   │   ├── page.tsx          # CRUD categorías
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Editar categoría
│   │   └── productos/
│   │       ├── page.tsx          # CRUD productos
│   │       └── [id]/
│   │           └── page.tsx      # Editar producto
│   ├── traducciones/
│   │   └── page.tsx              # Editor de i18n
│   ├── imagenes/
│   │   └── page.tsx              # Gestor de imágenes (upload)
│   └── auth/
│       ├── login/
│       │   └── page.tsx          # Login page
│       └── callback/
│           └── route.ts          # Auth callback
│
├── api/
│   └── revalidate/
│       └── route.ts              # Webhook para revalidar cache
│
├── components/
│   ├── landing/                  # Componentes de la landing (actuales)
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── MenuSection.tsx
│   │   ├── ProductCard.tsx
│   │   ├── Cart.tsx
│   │   ├── ...etc
│   │
│   ├── admin/                    # Componentes del admin
│   │   ├── AdminSidebar.tsx
│   │   ├── CategoryForm.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ThemeEditor.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── TranslationEditor.tsx
│   │   ├── BusinessConfigForm.tsx
│   │   └── ...etc
│   │
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ...etc
│
├── data/
│   ├── menu.ts                   # (temporal) fallback a hardcoded
│   └── asset-map.ts              # (temporal) fallback a hardcoded
│
├── config/
│   ├── business.ts               # Config centralizada (lee de DB o fallback)
│   └── translations.ts          # Traducciones (lee de DB o fallback)
│
├── hooks/                        # Hooks actuales + nuevos
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   ├── server.ts             # Supabase server client
│   │   └── admin.ts              # Admin-specific queries
│   ├── product-image.ts
│   ├── sandwich-options.ts
│   ├── search-menu.ts
│   └── whatsapp-order.ts
│
└── actions/                      # Server Actions
    ├── business.ts               # CRUD negocio
    ├── categories.ts             # CRUD categorías
    ├── products.ts               # CRUD productos
    ├── theme.ts                  # CRUD tema
    ├── translations.ts           # CRUD traducciones
    ├── images.ts                  # Upload/delete imágenes
    └── auth.ts                   # Login/logout
```

---

## Schema de Base de Datos (Supabase/Postgres)

```sql
-- =====================================================
-- TABLA: businesses (configuración del negocio)
-- =====================================================
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,              -- "mc-tommy", "otro-negocio"
  name TEXT NOT NULL,                      -- "MC Tommy"
  description TEXT,                        -- "Comida Rápida Chilena"
  year INT DEFAULT 2025,
  locale TEXT DEFAULT 'es-CL',
  currency TEXT DEFAULT 'CLP',
  lang TEXT DEFAULT 'es',
  
  -- Contacto
  whatsapp_number TEXT,                     -- "56963725018"
  whatsapp_greeting TEXT,                   -- "¡Hola! Quiero hacer un pedido en {name}."
  phone TEXT,
  email TEXT,
  address TEXT,
  
  -- Logos
  logo_desktop TEXT,                        -- URL en Storage
  logo_mobile JSONB,                        -- ["url1", "url2"]
  logo_rotation_interval INT DEFAULT 4000,
  favicon TEXT,
  apple_icon TEXT,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_theme_color TEXT DEFAULT '#FFF8F0',
  seo_og_image TEXT,
  
  -- Canales de pedido
  order_channels JSONB DEFAULT '{"whatsapp": true, "phone": false, "telegram": false}',
  
  -- Promociones habilitadas
  promotion_types JSONB DEFAULT '["promo_2x"]',
  
  -- Activo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLA: business_themes (colores y tipografía)
-- =====================================================
CREATE TABLE business_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Colores
  color_primary TEXT DEFAULT '#f5821f',
  color_primary_light TEXT DEFAULT '#ffb347',
  color_primary_intense TEXT DEFAULT '#e86f0a',
  color_primary_text TEXT DEFAULT '#994500',
  color_background TEXT DEFAULT '#fff8f0',
  color_background_dark TEXT DEFAULT '#f5e6d0',
  color_background_deep TEXT DEFAULT '#edd8c0',
  color_text_dark TEXT DEFAULT '#3d1f00',
  color_text_medium TEXT DEFAULT '#5c3410',
  color_text_light TEXT DEFAULT '#7a4a1a',
  color_white TEXT DEFAULT '#ffffff',
  
  -- Tipografía
  font_heading TEXT DEFAULT 'Fredoka',
  font_heading_weights INT[] DEFAULT '{400,500,600,700}',
  font_body TEXT DEFAULT 'Poppins',
  font_body_weights INT[] DEFAULT '{300,400,500,600,700}',
  
  -- Layout
  header_height_desktop TEXT DEFAULT '80px',
  header_height_mobile TEXT DEFAULT '72px',
  particles_desktop INT DEFAULT 42,
  particles_mobile INT DEFAULT 22,
  
  -- Animaciones
  cart_fly_duration FLOAT DEFAULT 0.7,
  cart_fly_ball_size INT DEFAULT 44,
  reduced_motion BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLA: translations (i18n por negocio)
-- =====================================================
CREATE TABLE translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  locale TEXT DEFAULT 'es-CL',
  key TEXT NOT NULL,                        -- "hero.title", "cart.empty", etc.
  value TEXT NOT NULL,                      -- "MC Tommy", "Tu carrito está vacío"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, locale, key)
);

-- =====================================================
-- TABLA: categories (categorías del menú)
-- =====================================================
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,                       -- "papas_supremas"
  titulo TEXT NOT NULL,                     -- "Papas Supremas"
  descripcion TEXT,                         -- "Base de papas fritas y carne"
  imagen TEXT,                              -- URL Storage o path /public
  
  -- Tipo de precio
  tipo_precio TEXT DEFAULT 'unico',         -- "tamano", "proteina", "unico"
  opciones_nombre TEXT,                      -- "Tamaño", "Proteína", null
  
  -- Orden
  orden INT DEFAULT 0,
  destacado BOOLEAN DEFAULT false,
  
  -- Etiqueta para WhatsApp
  etiqueta_whatsapp TEXT,                   -- "Papa Suprema"
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, slug)
);

-- =====================================================
-- TABLA: category_options (variantes por categoría)
-- =====================================================
CREATE TABLE category_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,                      -- "Chica", "Grande", "Pollo", etc.
  value TEXT NOT NULL,                      -- "chica", "grande", "pollo", etc.
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLA: products (productos del menú)
-- =====================================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,                     -- "Cheddar"
  slug TEXT NOT NULL,                       -- "cheddar"
  descripcion TEXT,                         -- Descripción larga
  
  -- Imagen
  imagen TEXT,                              -- URL Storage o path
  
  -- Precio único (cuando tipo_precio = "unico")
  precio_unico INT,                         -- 4500
  
  -- Destacado
  destacado BOOLEAN DEFAULT false,
  
  -- Para sandwiches con estilo completo/italiano
  tiene_estilo BOOLEAN DEFAULT false,
  estilo_nombre TEXT,                        -- "Completo ó Italiano"
  estilo_opciones JSONB,                    -- [{"label":"Italiano","value":"italiano"},{"label":"Completo","value":"completo"}]
  
  -- Para combos (pollo asado)
  incluye JSONB,                            -- ["Pollo entero", "Caja de papas completas"]
  incluye_texto TEXT,                       -- "Pollo entero + Caja de papas"
  
  -- Orden
  orden INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- =====================================================
-- TABLA: product_ingredients
-- =====================================================
CREATE TABLE product_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,                     -- "Tomate", "Palta", "Mayo"
  orden INT DEFAULT 0
);

-- =====================================================
-- TABLA: product_prices (precios por variante)
-- =====================================================
CREATE TABLE product_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  option_value TEXT NOT NULL,               -- "chica", "grande", "pollo", "lomito"
  precio INT NOT NULL,                      -- 4500, 7900
  orden INT DEFAULT 0
);

-- =====================================================
-- TABLA: promotions (promociones)
-- =====================================================
CREATE TABLE promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'promo_2x',             -- "promo_2x", "descuento", etc.
  label TEXT DEFAULT 'Promo 2x',
  
  -- Precios promo por variante (null = no aplica)
  option_value TEXT,                         -- "lomito", "churrasco", null
  precio INT,                                -- Precio promo (2x total, no individual)
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLA: particle_icons (íconos de fondo)
-- =====================================================
CREATE TABLE particle_icons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                       -- "burger", "fries"
  svg_path TEXT NOT NULL,                   -- SVG path data
  orden INT DEFAULT 0
);

-- =====================================================
-- TABLA: hero_features (badges del hero/footer)
-- =====================================================
CREATE TABLE hero_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  icon TEXT NOT NULL,                       -- "truck", "chef", "flame"
  label TEXT NOT NULL,                      -- "Entrega Rápida"
  orden INT DEFAULT 0
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_categories_business ON categories(business_id);
CREATE INDEX idx_categories_order ON categories(business_id, orden);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_order ON products(category_id, orden);
CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX idx_promotions_product ON promotions(product_id);
CREATE INDEX idx_translations_business_locale ON translations(business_id, locale);
CREATE INDEX idx_category_options_category ON category_options(category_id);
CREATE INDEX idx_hero_features_business ON hero_features(business_id, orden);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE particle_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_features ENABLE ROW LEVEL SECURITY;

-- Público: puede leer datos del negocio activo
CREATE POLICY "Public read active business" ON businesses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read theme" ON business_themes
  FOR SELECT USING (true);

CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read options" ON category_options
  FOR SELECT USING (true);

CREATE POLICY "Public read products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read ingredients" ON product_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Public read prices" ON product_prices
  FOR SELECT USING (true);

CREATE POLICY "Public read promotions" ON promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read translations" ON translations
  FOR SELECT USING (true);

CREATE POLICY "Public read particles" ON particle_icons
  FOR SELECT USING (true);

CREATE POLICY "Public read features" ON hero_features
  FOR SELECT USING (true);

-- Admin: puede hacer todo (usando auth.uid)
CREATE POLICY "Admin full access business" ON businesses
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM business_users WHERE business_id = id AND role = 'admin'
  ));

-- Similar policies para todas las tablas...
-- (Se definirán con más detalle en implementación)

-- =====================================================
-- TABLA: business_users (autenticación)
-- =====================================================
CREATE TABLE business_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'admin',                -- "admin", "editor"
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, user_id)
);
```

---

## Autenticación y Middleware

### Middleware (`middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... */ } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/auth/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/((?!auth).*)'],
}
```

---

## Configuración Central (`app/config/business.ts`)

La landing leerá configuración de dos fuentes:
1. **Supabase** (primaria, si hay conexión)
2. **Fallback hardcoded** (si no hay datos o hay error)

```typescript
// app/config/business.ts

export interface BusinessConfig {
  name: string
  description: string
  year: number
  locale: string
  currency: string
  lang: string
  whatsapp: {
    number: string
    greeting: string
  }
  logos: {
    desktop: string
    mobile: string[]
    mobileRotationInterval: number
  }
  seo: {
    title: string
    description: string
    themeColor: string
    ogImage: string
  }
  theme: {
    colors: {
      primary: string
      primaryLight: string
      primaryIntense: string
      primaryText: string
      background: string
      backgroundDark: string
      backgroundDeep: string
      textDark: string
      textMedium: string
      textLight: string
      white: string
    }
    fonts: {
      heading: string
      headingWeights: number[]
      body: string
      bodyWeights: number[]
    }
    layout: {
      headerHeightDesktop: string
      headerHeightMobile: string
      particlesDesktop: number
      particlesMobile: number
    }
  }
  orderChannels: {
    whatsapp: boolean
    phone: boolean
    telegram: boolean
  }
  promotionTypes: string[]
}

// Fallback hardcoded (datos actuales de MC Tommy)
export const fallbackConfig: BusinessConfig = {
  name: "MC Tommy",
  description: "Comida Rápida Chilena",
  // ... todos los valores actuales
}
```

### Server Component - Landing

```typescript
// app/(landing)/page.tsx
import { createClient } from '@/lib/supabase/server'
import { fallbackConfig } from '@/config/business'
import { MenuLanding } from '@/components/landing/MenuLanding'

export const revalidate = 300 // ISR: revalidar cada 5 minutos

export default async function HomePage() {
  const supabase = createClient()
  
  // Intentar leer config de DB, fallback a hardcoded
  const { data: business } = await supabase
    .from('businesses')
    .select('*, business_themes(*)')
    .eq('slug', 'mc-tommy')
    .eq('is_active', true)
    .single()

  const config = business ? mapDbToConfig(business) : fallbackConfig

  // Leer menú de DB
  const { data: categories } = await supabase
    .from('categories')
    .select('*, category_options(*), products(*, product_ingredients(*), product_prices(*), promotions(*))')
    .eq('business_id', business?.id)
    .eq('is_active', true)
    .order('orden')

  const menu = categories?.length ? mapDbToMenu(categories) : fallbackMenu

  return <MenuLanding config={config} menu={menu} />
}
```

### Server Action - Guardar cambios

```typescript
// app/actions/business.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBusinessConfig(data: Partial<BusinessConfig>) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('businesses')
    .update(mapConfigToDb(data))
    .eq('slug', 'mc-tommy')

  if (error) throw new Error(error.message)

  // Invalidar cache de la landing
  revalidatePath('/')
  revalidatePath('/admin')
}
```

---

## Pantallas del Admin

### Dashboard (`/admin`)
- Resumen del negocio: nombre, estado, cantidad de productos
- Últimas modificaciones
- Links rápidos a cada sección

### Config Negocio (`/admin/negocio`)
- Nombre, descripción, año
- WhatsApp número y saludo
- teléfono, email, dirección
- Subida de logos (desktop, mobile)
- SEO: título, descripción, OG image

### Tema (`/admin/tema`)
- **Color picker** para cada color del palette
- Preview en tiempo real
- Selector de fuentes (lista de Google Fonts)
- Configuración de layout (header height, partículas)
- Toggle de animaciones

### Menú (`/admin/menu`)
- Vista de categorías con drag & drop para reordenar
- CRUD de categorías
- CRUD de productos dentro de cada categoría
- Formulario de producto con:
  - Nombre, slug, descripción
  - Ingredientes (lista dinámica)
  - Tipo de precio (único, por tamaño, por proteína)
  - Precios por variante
  - Imagen (upload)
  - Toggle destacado
  - Estilo sandwich (si aplica)
  - Incluye (si aplica)
  - Promociones

### Traducciones (`/admin/traducciones`)
- Editor de diccionario por clave
- Agrupado por sección (hero, search, cart, product, category, footer)
- Preview de dónde se usa cada traducción

### Imágenes (`/admin/imagenes`)
- Galería de todas las imágenes en Storage
- Upload múltiple
- Asignación a categorías y productos
- Imágenes no usadas (limpieza)

### Auth (`/admin/auth/login`)
- Login con email/password (Supabase Auth)
- Logout

---

## Fases de Implementación

### Fase 1: Fundamentos (Semana 1-2)

| Tarea | Detalle |
|-------|---------|
| Setup Supabase | Crear proyecto, tablas, RLS policies |
| Supabase client | Config `lib/supabase/client.ts` y `server.ts` |
| Auth básico | Middleware + login page + session check |
| Layout admin | Sidebar, navegación, shell responsivo |
| shadcn/ui setup | Instalar componentes base necesarios |

### Fase 2: Configuración del Negocio (Semana 3)

| Tarea | Detalle |
|-------|---------|
| Admin negocio | CRUD nombre, contacto, logos, SEO |
| Admin tema | Color picker + preview en tiempo real |
| Admin traducciones | Editor de strings i18n |
| Server Actions | Actions para business, theme, translations |
| Refactor landing | Landing lee config de DB con fallback |

### Fase 3: Gestión de Menú (Semana 4-5)

| Tarea | Detalle |
|-------|---------|
| Admin categorías | CRUD + reordenar + imágenes |
| Admin productos | CRUD completo con variantes e ingredientes |
| Admin promociones | CRUD de promos por producto |
| Admin imágenes | Upload a Supabase Storage, galería |
| Refactor menú | Landing lee menú de DB con fallback |

### Fase 4: Carrito y Pedidos (Semana 6)

| Tarea | Detalle |
|-------|---------|
| WhatsApp dinámico | Template configurable desde admin |
| Canales de pedido | Toggle WhatsApp/teléfono/Telegram |
| Tipos de promo | Soporte para múltiples tipos de promoción |
| Variantes dinámicas | Cualquier tipo de variante, no solo tamaño/proteína |

### Fase 5: Multi-tenancy y Deploy (Semana 7-8)

| Tarea | Detalle |
|-------|---------|
| Multi-negocio | Soporte `[slug]` en URLs / subdominios |
| Seed data | Script para poblar DB con datos actuales de MC Tommy |
| Migración final | Eliminar fallbacks hardcoded |
| Testing | Tests E2E del admin y landing |
| Deploy | Vercel + Supabase production |
| Limpieza | Eliminar assets no usados, corregir typos |

---

## Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BUSINESS_SLUG=mc-tommy
```

---

## Dependencias a Instalar

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest init
npx shadcn@latest add button input card select textarea tabs dialog sheet label badge separator dropdown-menu avatar table toast tooltip
```

---

## Consideraciones Importantes

### Cache y Revalidación
- La landing usa `revalidate = 300` (5 min ISR)
- Las Server Actions llaman `revalidatePath('/')` al guardar
- Opción: webhook de Supabase → `/api/revalidate` para invalidación en tiempo real

### Fallback a Hardcoded
- Si Supabase no responde, la landing muestra datos hardcoded actuales
- Permite que el sitio funcione aunque la DB esté caída
- Se elimina gradualmente en Fase 5

### SEO Dinámico
- `generateMetadata()` en layout lee config de DB
- Open Graph images por negocio
- Sitemap dinámico

### Escalabilidad Multi-tenancy
- En Fase 5, se agrega `NEXT_PUBLIC_BUSINESS_SLUG`
- Ruta `/admin` siempre pertenece al negocio del URL
- Supabase RLS filtra por `business_id`
- Futuro: `[slug].domain.com` para dominios personalizados

### Seguridad
- RLS en todas las tablas
- Middleware protege `/admin`
- Server Actions verifican sesión
- Storage buckets con policies por negocio