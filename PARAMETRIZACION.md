# Documento de Parametrización — Menu Landing

## Visión General

**Menu Landing** es un menú digital interactivo single-page (SPA) para negocios de comida rápida. Actualmente está hardcodeado para **MC Tommy**, un restaurante chileno de comida rápida. Este documento detalla **cada elemento parametrizable** para escalar la plataforma a cualquier negocio.

---

## 1. Identidad del Negocio

### 1.1 Nombre del negocio
| Ubicación | Valor actual | Archivo | Línea |
|-----------|-------------|---------|-------|
| Meta título | `"MC Tommy - Menú Digital \| Comida Rápida Chilena"` | `app/layout.tsx` | 18 |
| Meta descripción | `"Menú digital interactivo de MC Tommy..."` | `app/layout.tsx` | 19-20 |
| Hero título | `"MC Tommy"` | `app/components/Hero.tsx` | 113 |
| Header logo alt | `"MC Tommy"` | `app/components/Header.tsx` | 64, 74 |
| Footer copyright | `"© 2025 MC Tommy. Todos los derechos reservados"` | `app/page.tsx` | 205 |
| WhatsApp saludo | `"¡Hola! Quiero hacer un pedido en MC Tommy."` | `app/lib/whatsapp-order.ts` | 72 |
| WhatsApp encabezado | `"¡Hola! Quiero hacer un pedido en *MC Tommy*:"` | `app/lib/whatsapp-order.ts` | 76 |

**Parametrización**: Crear `business.name`, `business.description`, `business.year`.

### 1.2 Logos
| Ubicación | Valor actual | Archivo | Línea |
|-----------|-------------|---------|-------|
| Logo desktop | `/mctommy.webp` | `app/components/Header.tsx` | 73-78, `app/page.tsx` | 197-202 |
| Logo mobile v1 | `/mctommy1.webp` | `app/components/Header.tsx` | 19 |
| Logo mobile v2 | `/mctommy2.webp` | `app/components/Header.tsx` | 19 |
| Intervalo rotación mobile | `4000` ms | `app/components/Header.tsx` | 32 |
| Favicon | `app/favicon.ico` | Auto Next.js | — |
| Apple icon | `app/apple-icon.png` | Auto Next.js | — |

**Parametrización**: Crear `business.logoDesktop`, `business.logoMobile` (array), `business.logoRotationInterval`, `business.favicon`, `business.appleIcon`.

### 1.3 Información de contacto
| Ubicación | Valor actual | Archivo | Línea |
|-----------|-------------|---------|-------|
| WhatsApp número | `56963725018` | `app/components/Cart.tsx` | 47 |

**Parametrización**: Crear `business.whatsappNumber` (formato internacional sin `+`).

### 1.4 Idioma y locale
| Ubicación | Valor actual | Archivo | Línea |
|-----------|-------------|---------|-------|
| HTML lang | `"es"` | `app/layout.tsx` | 35 |
| Formato moneda | `"es-CL"` | `ProductCard.tsx`, `Cart.tsx`, `whatsapp-order.ts` | Múltiples |
| Moneda | CLP (sin símbolo, se infiere del locale) | — | — |

**Parametrización**: Crear `business.locale`, `business.currency`.

---

## 2. Sistema de Colores (Brand Palette)

### 2.1 Variables CSS (`app/globals.css`)
| Variable | Valor actual | Uso |
|----------|-------------|-----|
| `--background` | `#fff8f0` | Fondo general crema |
| `--foreground` | `#3d1f00` | Texto principal marrón oscuro |
| `--naranja-mc` | `#f5821f` | Color primario naranja |
| `--naranja-claro` | `#ffb347` | Naranja claro hover/accent |
| `--naranja-intenso` | `#e86f0a` | Naranja intenso active |
| `--marron-oscuro` | `#3d1f00` | Textos oscuros |
| `--marron-medio` | `#5c3410` | Textos secundarios |
| `--marron-claro` | `#7a4a1a` | Textos terciarios |
| `--crema` | `#fff8f0` | Fondo crema |
| `--crema-oscuro` | `#f5e6d0` | Cards/bordes crema osc |
| `--crema-profundo` | `#edd8c0` | Hover/bordes crema prof |
| `--blanco` | `#ffffff` | Blanco |
| `--naranja-texto` | `#994500` | Texto naranja |
| Theme color meta | `#FFF8F0` | `app/layout.tsx` línea 24 |

### 2.2 Colores inline hardcodeados en componentes
| Color hex | Archivos afectados | Apariciones aprox. |
|-----------|-------------------|-------------------|
| `#F5821F` | `Hero.tsx`, `ProductCard.tsx`, `Cart.tsx`, `page.tsx` | ~40+ |
| `#3D1F00` | `Hero.tsx`, `ProductCard.tsx`, `Cart.tsx` | ~20+ |
| `#5C3410` | `Hero.tsx` | ~2 |
| `rgba(245, 130, 31, ...)` | `globals.css` | ~8 |
| `rgba(61, 31, 0, ...)` | `globals.css` | ~1 |
| `rgba(92, 52, 16, ...)` | `globals.css` | ~1 |
| `rgba(255, 248, 240, 0.7)` | `globals.css` | ~1 |

**Parametrización**:
- Reemplazar **todos** los colores hex inline por referencias a CSS custom properties.
- Crear un tema configurable: `theme.colors.primary`, `theme.colors.secondary`, `theme.colors.background`, `theme.colors.text`, `theme.colors.accent`, `theme.colors.muted`, etc.
- Definir un sistema que genere `rgba()` automáticamente desde los colores base.

---

## 3. Tipografía

| Ubicación | Valor actual | Archivo | Línea |
|-----------|-------------|---------|-------|
| Fuente display | Fredoka (400,500,600,700) | `app/layout.tsx` | 5-9 |
| Fuente body | Poppins (300,400,500,600,700) | `app/layout.tsx` | 11-15 |
| CSS font-family display | `var(--font-fredoka)` | `app/globals.css` | 34 |
| CSS font-family body | `var(--font-poppins)` | `app/globals.css` | 33 |

**Parametrización**: Crear `theme.fonts.heading`, `theme.fonts.body` con familias y pesos configurables.

---

## 4. Datos del Menú (`app/data/menu.ts`)

### 4.1 Categorías (6 actualmente)
| Campo | Ejemplo actual |
|-------|---------------|
| `id` | `"papas_supremas"` |
| `titulo` | `"Papas Supremas"` |
| `descripcion` | `"Base de papas fritas y carne"` |
| `tipo_precio` | `"tamano"` / `"proteina"` / `"unico"` |
| `opciones_nombre` | `"Tamaño"` / `"Proteína"` / `null` |
| `opciones` | Array de variantes |
| `promociones` | Array de promos |
| `destacado` | Boolean |

**Parametrización**:
- Cada campo es parametrizable tal cual.
- Se debe poder agregar/eliminar categorías dinámicamente.
- `tipo_precio` debería ser un enum configurable: `tamano`, `proteina`, `unico`, y potencialmente nuevos tipos.
- `opciones_nombre` debería ser configurable (actualmente `"Tamaño"`, `"Proteína"`).

### 4.2 Productos (~38 productos)
Cada producto tiene:
| Campo | Descripción |
|-------|-------------|
| `nombre` | Nombre del producto |
| `ingredientes` | Lista de ingredientes (strings) |
| `imagen` | Slug para buscar en asset-map |
| `precio` | Objeto con precios por variante/tamaño |
| `destacado` | Si aparece como destacado |
| `promociones` | Array de promos 2x |
| `tipo_estilo` | Para sandwiches con estilo completo/italiano |
| `incluye` | Para combos pollo, lista de items incluidos |
| `incluye_texto` | Texto descriptivo del incluye |

**Parametrización**: Todos los campos ya son datos estructurados. Necesitan un **CMS o admin panel** para gestionarlos sin tocar código.

### 4.3 Etiquetas de variantes (`app/types.ts` líneas 98-108)
| Tipo | Valores actuales |
|------|-----------------|
| Tamaños | `"Chica"`, `"Grande"`, `"Familiar"` |
| Proteínas | `"Pollo"`, `"Lomito"`, `"Churrasco"`, `"Mechada"` |
| Vienesas/Ases | `"Vienesa XL"`, `"As XL"` |
| Modalidad | `"Individual"`, `"Promo 2x"` |

**Parametrización**: Estas etiquetas deben ser configurables por categoría, no hardcodeadas en types.

### 4.4 Etiquetas de tipo_plato para WhatsApp (`app/lib/whatsapp-order.ts` líneas 6-11)
| Key | Valor actual |
|-----|-------------|
| `papas_supremas` | `"Papa Suprema"` |
| `fajitas` | `"Fajita"` |
| `pollo_asado` | `"Pollo Asado"` |
| `sandwiches` | `"Sándwich"` |
| `vienesas_y_ases` | `"Completo"` |
| `snacks` | `"Extra"` |

**Parametrización**: Mover a `menu.ts` dentro de cada categoría como `etiquetaWhatsApp`.

---

## 5. Mapeo de Imágenes (`app/data/asset-map.ts`)

### 5.1 Imágenes por categoría (fallback)
| Categoría | Imografía |
|-----------|----------|
| `papas_supremas` | `/papacheddar.webp` |
| `fajitas` | `/fajita.webp` |
| `pollo_asado` | `/pollo-asado.webp` |
| `sandwiches` | `/churrasco.webp` |
| `vienesas_y_ases` | `/as-italiano-Photoroom.webp` |
| `snacks` | `/empanadas.webp` |

### 5.2 Imágenes por producto (override)
~27 productos tienen imagen individual, ~11 usan el fallback de categoría.

**Parametrización**:
- Cada categoría debe tener `imagenDefault`.
- Cada producto debe tener `imagen` (URL o path).
- Soportar URLs remotas (ya hay whitelist para `images.unsplash.com` en `next.config.ts`).
- Considerar CDN o bucket para imágenes de negocio.

### 5.3 Imágenes no referenciadas
| Archivo | Estado |
|---------|--------|
| `/italiano-Photoroom.webp` | En public/ pero NO usada en código |
| `/mctommy-icon.png` | En public/ pero NO usada en código |

**Parametrización**: Limpiar y gestionar assets desde configuración.

---

## 6. Textos de UI (Internacionalización / i18n)

### 6.1 Textos del Hero
| Texto | Ubicación |
|-------|-----------|
| `"Sabores Auténticos Chilenos"` | `Hero.tsx` línea 100 |
| `"Comida Rápida"` | `Hero.tsx` línea 115 |
| `"El mejor sabor chileno, directo a tu mesa."` | `Hero.tsx` línea 125 |
| `"Papas supremas, fajitas, pollo asado"` | `Hero.tsx` línea 128-129 |
| `"y mucho más."` | `Hero.tsx` línea 130 |
| `"Entrega Rápida"` | `Hero.tsx` línea 141 |
| `"Recetas Caseras"` | `Hero.tsx` línea 142 |
| `"Delivery Local"` | `Hero.tsx` línea 143 |
| `"Ver Menú Completo"` | `Hero.tsx` línea 171 |
| `"Desplaza para explorar"` | `Hero.tsx` línea 191 |

### 6.2 Textos del Header
| Texto | Ubicación |
|-------|-----------|
| `"Buscar en el menú…"` | `Header.tsx` líneas 93, 163 |

### 6.3 Textos del Search
| Texto | Ubicación |
|-------|-----------|
| `"Buscando…"` | `page.tsx` línea 91 |
| `"producto encontrado"` / `"productos encontrados"` | `page.tsx` líneas 95-96 |
| `"No se encontraron productos"` | `page.tsx` línea 119 |
| `"Prueba con otra palabra o revisa la ortografía"` | `page.tsx` línea 122 |

### 6.4 Textos de Categorías
| Texto | Ubicación |
|-------|-----------|
| `"Estás viendo"` | `CategoryTabs.tsx` líneas 24-25 |
| `"Menú"` (label) | `asset-map.ts` línea 124 |

### 6.5 Textos de Productos
| Texto | Ubicación |
|-------|-----------|
| `"Incluye:"` | `ProductCard.tsx` línea 203 |
| `"Estilo del sándwich"` | `ProductCard.tsx` línea 228 |
| `"Tipo de carne"` | `ProductCard.tsx` línea 257 |
| `"Elige tu opción"` | `ProductCard.tsx` línea 289 |
| `"Promo 2x:"` | `ProductCard.tsx` línea 324 |

### 6.6 Textos del Carrito
| Texto | Ubicación |
|-------|-----------|
| `"Tu Pedido"` | `Cart.tsx` línea 201 |
| `"Tu carrito está vacío"` | `Cart.tsx` línea 224 |
| `"Agrega productos para comenzar tu pedido"` | `Cart.tsx` línea 226 |
| `"Enviar Pedido por WhatsApp"` | `Cart.tsx` línea 343 |
| `"Vaciar carrito"` | `Cart.tsx` línea 352 |
| `"¿Vaciar carrito?"` | `Cart.tsx` línea 384 |
| `"¿Estás seguro de que quieres eliminar todos los productos de tu carrito?"` | `Cart.tsx` líneas 386-387 |
| `"Cancelar"` | `Cart.tsx` línea 396 |
| `"Vaciar"` | `Cart.tsx` línea 407 |
| `"producto"` / `"productos"` | `Cart.tsx` línea 113 |
| `"Total"` | `Cart.tsx` línea 321 |

### 6.7 Badges del Footer
| Texto | Ubicación |
|-------|-----------|
| `"Sabores Auténticos"` | `page.tsx` línea 143 |
| `"Entrega Rápida"` | `page.tsx` línea 147 |
| `"Recetas Caseras"` | `page.tsx` línea 151 |
| `"© 2025 MC Tommy. Todos los derechos reservados"` | `page.tsx` línea 205 |

### 6.8 Textos de WhatsApp
| Texto | Ubicación |
|-------|-----------|
| `"¡Hola! Quiero hacer un pedido en MC Tommy."` (mensaje corto) | `whatsapp-order.ts` línea 72 |
| `"¡Hola! Quiero hacer un pedido en *MC Tommy*:"` (mensaje largo) | `whatsapp-order.ts` línea 76 |
| Etiquetas de tipo_plato (ver sección 4.4) | `whatsapp-order.ts` líneas 6-11 |
| Labels: `"Precio"`, `"Precio único"`, `"unico"` | `whatsapp-order.ts` línea 14 |

**Parametrización**: Crear un diccionario de i18n completo. Todos estos strings deben estar en un archivo `locales/es-CL.json` o similar, con soporte para múltiples idiomas.

---

## 7. Lógica de Negocio

### 7.1 Opciones de Sándwich (`app/lib/sandwich-options.ts`)
| Valor | Ubicación |
|-------|-----------|
| `"Completo ó Italiano"` (nombre de interacción) | Línea 3 |
| `"Italiano"` (label) / `"italiano"` (value) | Línea 11 |
| `"Completo"` (label) / `"completo"` (value) | Línea 12 |
| Display names `"Completo"` / `"Italiano"` | Línea 25 |

**Parametrización**: Debe ser configurable por negocio. Algunos negocios NO ofrecen estilo completo/italiano.

### 7.2 Formato de pedido WhatsApp (`app/lib/whatsapp-order.ts`)
| Aspecto | Valor actual |
|---------|-------------|
| Formato del mensaje | Template hardcodeado |
| Separadores | `─────────────────` |
| Formato de precios | `es-CL` locale |
| Símbolo de items | `•` |
| Formato de variantes | Hardcodeado |

**Parametrización**:
- Template de mensaje configurable.
- Habilitar/deshabilitar WhatsApp como canal de pedido.
- Agregar otros canales: teléfono directo, Telegram, etc.

### 7.3 Búsqueda Fuzzy (`app/lib/search-menu.ts`)
| Aspecto | Valor actual |
|---------|-------------|
| Distancia Levenshtein máxima | Hardcodeada en la función |

**Parametrización**: El umbral de fuzzy matching podría ser configurable.

### 7.4 Cálculo de Promo 2x (`app/hooks/useCart.ts`)
| Aspecto | Valor actual |
|---------|-------------|
| Tipo de promo | Solo `"promo_2x"` |
| Cálculo | Sumar precio promo de ambos items |

**Parametrización**: Soportar más tipos de promociones (3x2, descuento porcentual, combo, etc.).

---

## 8. Layout y Dimensiones

### 8.1 Dimensiones hardcodeadas
| Valor | Uso | Archivo | Línea |
|-------|-----|---------|-------|
| `80px` | Header height desktop | `page.tsx` | 76 |
| `72px` | Header height mobile | `Header.tsx` | 45 |
| `300px` | Scroll offset para back-to-top | `page.tsx` | 33 |
| `4000ms` | Intervalo rotación logo mobile | `Header.tsx` | 32 |
| `44px` | Tamaño bola animación carrito | `useCartFly.tsx` | 9 |
| `0.7s` | Duración animación fly-to-cart | `useCartFly.tsx` | 10 |

### 8.2 Partículas de fondo
| Valor | Uso | Archivo | Línea |
|-------|-----|---------|-------|
| `22` | Partículas mobile | `ParticleBackground.tsx` | 91 |
| `42` | Partículas desktop | `ParticleBackground.tsx` | 91 |
| `767px` | Breakpoint mobile | `ParticleBackground.tsx` | 180 |

**Parametrización**: Crear `theme.layout.headerHeight`, `theme.layout.particles`, etc.

---

## 9. Animaciones y Efectos

### 9.1 Animaciones CSS (`app/globals.css`)
| Animación | Uso |
|-----------|-----|
| `fadeInUp` | Entrada general |
| `pulse-glow` | Botones CTA |
| `float` | Decoraciones hero |
| `bounce-slow` | Indicador scroll |
| `cart-pulse` | Pulso carrito |
| `slideInRight` | Entrada carrito mobile |
| `slideOutRight` | Salida carrito mobile |
| `shimmer` | Shimmer cards |

### 9.2 Framer Motion
| Componente | Animaciones |
|------------|------------|
| `Hero.tsx` | Stagger children, parallax decoraciones |
| `ProductCard.tsx` | Hover scale, tap |
| `Cart.tsx` | Slide overlay, AnimatePresence |
| `ScrollReveal.tsx` | Viewport reveal con dirección configurable |
| `CardFloatingImage.tsx` | Flotación continua |
| `useCartFly.tsx` | Vuelo de punto al carrito |

**Parametrización**: Las velocidades, distancias y estilos de animación deben poder deshabilitarse o ajustarse (ej: motion reduced, velocidad).

---

## 10. Íconos del Fondo de Partículas (`app/components/icons/FoodIcons.tsx`)

| Ícono | SVG actual |
|-------|-----------|
| `HotdogIcon` | Hotdog |
| `FriesIcon` | Papas fritas |
| `BurgerIcon` | Hamburguesa |
| `DrumstickIcon` | Muslo de pollo |
| `PopcornBagIcon` | Bolsa de palomitas |

**Parametrización**:
- Los íconos de fondo deben ser configurables según el tipo de negocio.
- Un negocio de sushi tendría íconos diferentes a uno de comida rápida.

---

## 11. Estilos de las Cards y Hero (Componentes Visuales)

### 11.1 Hero Section
- Títulos, subtítulos, badges, CTA text — todos hardcodeados.
- Decoraciones flotantes (frases como "Comida Rápida") — hardcodeadas.
- Gradientes, colores, imágenes de fondo — todos harcodeados.

### 11.2 ProductCard
- Estilo de tarjeta con degradado, sombras, bordes — hardcodeado con colores inline.
- Labels de variantes ("Tamaño:", "Proteína:") — hardcodeados.
- Comportamiento de " Promo 2x" — hardcodeado en la lógica del card.

### 11.3 Cart
- Posición drawer (mobile) vs sidebar (desktop) — hardcodeado.
- Textos de empty state, confirmación, botones — hardcodeados.
- Logo del carrito vacío — usa `/mctommy.webp`.

**Parametrización**: Extraer todos los textos y estilos a configuración.

---

## 12. SEO y Metadata (`app/layout.tsx`)

| Campo | Valor actual |
|-------|-------------|
| `title` | `"MC Tommy - Menú Digital \| Comida Rápida Chilena"` |
| `description` | `"Menú digital interactivo de MC Tommy..."` |
| `themeColor` | `#FFF8F0` |
| `openGraph.title` | Mismo que title |
| `openGraph.description` | Mismo que description |
| `lang` | `"es"` |

**Parametrización**: Todo debe venir de `business.seo.title`, `business.seo.description`, `business.seo.ogImage`, etc.

---

## 13. Configuración de Next.js (`next.config.ts`)

| Campo | Valor actual |
|-------|-------------|
| `images.remotePatterns` | Solo `images.unsplash.com` |

**Parametrización**: Si se usan imágenes desde CDN externo, agregar dominios configurables.

---

## 14. Propuesta de Arquitectura de Parametrización

### Archivo de configuración central: `app/config/business.ts`

```typescript
export const businessConfig = {
  // === IDENTIDAD ===
  name: "MC Tommy",
  description: "Comida Rápida Chilena",
  year: 2025,
  locale: "es-CL",
  currency: "CLP",
  lang: "es",

  // === CONTACTO ===
  whatsapp: {
    number: "56963725018",
    greeting: "¡Hola! Quiero hacer un pedido en {business.name}.",
    messageFormat: "full", // "full" | "short"
  },

  // === LOGOS ===
  logos: {
    desktop: "/mctommy.webp",
    mobile: ["/mctommy1.webp", "/mctommy2.webp"],
    mobileRotationInterval: 4000,
    favicon: "/favicon.ico",
    appleIcon: "/apple-icon.png",
  },

  // === SEO ===
  seo: {
    title: "{business.name} - Menú Digital | {business.description}",
    description: "Menú digital interactivo de {business.name}. ...",
    themeColor: "#FFF8F0",
    ogImage: "/og-image.jpg",
  },

  // === TEMA ===
  theme: {
    colors: {
      primary: "#f5821f",
      primaryLight: "#ffb347",
      primaryIntense: "#e86f0a",
      primaryText: "#994500",
      background: "#fff8f0",
      backgroundDark: "#f5e6d0",
      backgroundDeep: "#edd8c0",
      textDark: "#3d1f00",
      textMedium: "#5c3410",
      textLight: "#7a4a1a",
      white: "#ffffff",
    },
    fonts: {
      heading: "Fredoka",
      headingWeights: [400, 500, 600, 700],
      body: "Poppins",
      bodyWeights: [300, 400, 500, 600, 700],
    },
    layout: {
      headerHeightDesktop: "80px",
      headerHeightMobile: "72px",
      particlesDesktop: 42,
      particlesMobile: 22,
    },
    animations: {
      cartFlyDuration: 0.7,
      cartFlyBallSize: 44,
      reducedMotion: false,
    },
  },

  // === CANALES DE PEDIDO ===
  orderChannels: {
    whatsapp: true,
    phone: false,
    telegram: false,
    // futuro: webCheckout: false,
  },

  // === PROMOCIONES ===
  promotions: {
    enabled: true,
    types: ["promo_2x"], // futuro: ["3x2", "descuento", "combo"]
  },
};
```

### Archivo de i18n: `app/config/translations.ts`

```typescript
export const translations = {
  hero: {
    badge: "Sabores Auténtimos Chilenos",
    title: "{business.name}",
    subtitle: "Comida Rápida",
    description: "El mejor sabor chileno, directo a tu mesa.",
    highlights: "Papas supremas, fajitas, pollo asado",
    highlightsEnd: "y mucho más.",
    features: [
      { icon: "truck", label: "Entrega Rápida" },
      { icon: "chef", label: "Recetas Caseras" },
      { icon: "map", label: "Delivery Local" },
    ],
    cta: "Ver Menú Completo",
    scrollHint: "Desplaza para explorar",
  },
  search: {
    placeholder: "Buscar en el menú…",
    searching: "Buscando…",
    resultSingular: "producto encontrado",
    resultPlural: "productos encontrados",
    noResults: "No se encontraron productos",
    noResultsHint: "Prueba con otra palabra o revisa la ortografía",
  },
  cart: {
    title: "Tu Pedido",
    empty: "Tu carrito está vacío",
    emptyHint: "Agrega productos para comenzar tu pedido",
    sendWhatsApp: "Enviar Pedido por WhatsApp",
    clearCart: "Vaciar carrito",
    clearCartConfirm: "¿Vaciar carrito?",
    clearCartConfirmText: "¿Estás seguro…?",
    cancel: "Cancelar",
    confirm: "Vaciar",
    itemSingular: "producto",
    itemPlural: "productos",
    total: "Total",
  },
  product: {
    includes: "Incluye:",
    sandwichStyle: "Estilo del sándwich",
    meatType: "Tipo de carne",
    chooseOption: "Elige tu opción",
    promo2x: "Promo 2x:",
  },
  category: {
    viewing: "Estás viendo",
  },
  footer: {
    features: [
      { icon: "flame", label: "Sabores Auténticos" },
      { icon: "truck", label: "Entrega Rápida" },
      { icon: "chef", label: "Recetas Caseras" },
    ],
    copyright: "© {year} {business.name}. Todos los derechos reservados",
  },
};
```

### Datos del menú: `app/data/menu.ts` (ya estructurado)

Las categorías y productos ya están en formato de datos. Necesitan:
1. **CMS o admin panel** para gestión CRUD.
2. **Validación** con Zod o similar.
3. **IDs únicos** para sincronización.
4. **Campo `etiquetaWhatsApp`** en cada categoría.
5. **Campo `iconoParticula`** para personalizar íconos de fondo.

---

## 15. Resumen de Items Parametrizables

| # | Categoría | Items | Prioridad |
|---|-----------|-------|-----------|
| 1 | Nombre del negocio | 7 menciones en código | **Alta** |
| 2 | Número WhatsApp | 1 ubicación | **Alta** |
| 3 | Logo e imágenes | 17 imágenes en public/ | **Alta** |
| 4 | Colores del tema | 14 CSS vars + ~60 colores inline | **Alta** |
| 5 | Tipografía | 2 familias, 2 vars CSS | **Alta** |
| 6 | Textos de UI (i18n) | ~60+ strings | **Alta** |
| 7 | Datos del menú | 6 categorías, ~38 productos | **Alta** |
| 8 | Mapeo de imágenes | 6 + ~27 mapeos | **Media** |
| 9 | Labels de variantes | 4 tipos hardcodeados | **Media** |
| 10 | Etiquetas WhatsApp | 6 mapeos | **Media** |
| 11 | Opciones de sándwich | 2 opciones | **Media** |
| 12 | Dimensiones layout | 6 valores | **Baja** |
| 13 | Animaciones | 7 animaciones CSS + Framer Motion | **Baja** |
| 14 | Íconos partículas | 5 SVGs | **Baja** |
| 15 | SEO/Metadata | 5 campos | **Alta** |
| 16 | Locale/Moneda | `es-CL`, CLP | **Alta** |
| 17 | Canales de pedido | Solo WhatsApp | **Media** |
| 18 | Tipos de promoción | Solo promo 2x | **Media** |
| 19 | Template WhatsApp | 1 formato hardcodeado | **Media** |
| 20 | Config Next.js | 1 dominio de imágenes | **Baja** |

---

## 16. Próximos Pasos Recomendados

1. **Extraer** todos los valores hardcodeados a `app/config/business.ts` y `app/config/translations.ts`.
2. **Reemplazar** colores hex inline por CSS variables en componentes.
3. **Mover** etiquetas de variantes de `types.ts` a datos de categoría en `menu.ts`.
4. **Mover** etiquetas WhatsApp de `whatsapp-order.ts` a `menu.ts`.
5. **Implementar** sistema de i18n con diccionarios por locale.
6. **Crear** admin panel o CMS para gestión de menú.
7. **Soportar** múltiples negocios con subdominio o path (`/mc-tommy`, `/otro-negocio`).
8. **Agregar** más canales de pedido (teléfono, Telegram, checkout web).
9. **Agregar** más tipos de promociones (3x2, descuentos, combos).
10. **Limpiar** assets no referenciados (`italiano-Photoroom.webp`, `mctommy-icon.png`).
11. **Corregir** typo `"Bextible"` → `"Bebible"` en `menu.ts` línea 56.