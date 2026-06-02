# Plan Detallado: Editor de Plantilla Interactivo

## Visión General

Una página `/admin/editor` que funciona como **simulador visual** de la landing page. El usuario ve la landing tal como la ven los clientes, pero puede hacer clic en cualquier elemento para editarlo en tiempo real. Los cambios se ven instantáneamente en el preview, y se persisten en Supabase al guardar.

## Arquitectura Central

### Principio rector: una sola fuente de verdad mutable

El editor mantiene **todo el estado de la landing en un objeto JavaScript mutable** en React Context. La landing se renderiza desde este estado, no desde los props iniciales. Cuando el usuario edita algo, se muta el estado local → el preview se actualiza inmediatamente → al guardar se sincroniza con Supabase.

```
┌─────────────────────────────────────────────────────────────┐
│                     TEMPLATE EDITOR                          │
│  ┌──────────────┐   ┌──────────────────────┐   ┌───────────┐ │
│  │  Editor      │   │   DevicePreview      │   │ EditPanel │ │
│  │  Toolbar     │   │   (desktop/mobile)   │   │ (forms)   │ │
│  │              │   │                      │   │           │ │
│  │ [Guardar]    │   │  ┌────────────────┐  │   │ Según     │ │
│  │ [Vista ▼]    │   │  │ MenuLanding    │  │   │ selección │ │
│  │ [Auto-guardar│   │  │ Client (mode=  │  │   │ muestra   │ │
│  │   toggle]    │   │  │ "editor")       │  │   │ formularios│ │
│  └──────────────┘   │  │                │  │   └───────────┘ │
│                     │  │ Cada sección   │  │                 │
│                     │  │ es clickeable │  │                 │
│                     │  │ con overlay  │  │                 │
│                     │  └────────────────┘  │                 │
│                     └──────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Infraestructura del Editor

### 1.1 EditorContext — Estado global mutable

**Nuevo archivo:** `components/admin/editor/EditorContext.tsx`

Responsabilidad: Proveer y mutar todo el estado editable de la landing.

```typescript
interface EditorState {
  // Datos del negocio
  business: BusinessConfig;
  // Tema visual
  theme: BusinessTheme;
  // Traducciones
  translations: Record<string, string>;
  // Íconos de partículas
  particleIcons: ParticleIcon[];
  // Menú completo (categorías con productos)
  menu: Categoria[];
}

interface SelectedElement {
  type: "navbar" | "search" | "particles" | "category" | "product" | "footer" | "theme";
  categoryId?: string;      // para type="category" | "product"
  productSlug?: string;       // para type="product"
}

interface EditorContextValue {
  state: EditorState;
  selected: SelectedElement | null;
  isDirty: boolean;         // hay cambios sin guardar
  selectElement: (el: SelectedElement | null) => void;
  updateBusiness: (patch: Partial<BusinessConfig>) => void;
  updateTheme: (patch: Partial<BusinessTheme>) => void;
  updateTranslation: (key: string, value: string) => void;
  updateParticleIcons: (icons: ParticleIcon[]) => void;
  updateCategory: (categoryId: string, patch: Partial<Categoria>) => void;
  updateProduct: (categoryId: string, productSlug: string, patch: Partial<Producto>) => void;
  markDirty: () => void;
}
```

### 1.2 DevicePreview — Simulador de viewport

**Nuevo archivo:** `components/admin/editor/DevicePreview.tsx`

Responsabilidad: Renderizar la landing dentro de un contenedor con ancho controlado.

```typescript
interface DevicePreviewProps {
  mode: "desktop" | "mobile";
  children: React.ReactNode;
}
```

Comportamiento:
- **Desktop:** `width: 100%`, sin marco, scroll nativo
- **Mobile:** `width: 375px` (o `390px`), centrado, borde redondeado `rounded-[2.5rem]`, sombra de dispositivo, header simulado (barra de estado), scrollbar oculto. El contenedor puede escalearse con `transform: scale()` si el ancho disponible es menor.

En modo móvil, el componente debe pasar un ancho de viewport falso a la landing para que los media queries funcionen. Esto se logra con un `ResizeObserver` o simplemente el contenedor de 375px forzará las media queries `@media (max-width: 767px)`.

### 1.3 Modo editor en MenuLandingClient

**Modificación:** `app/components/MenuLandingClient.tsx`

Agregar props opcionales:
```typescript
interface LandingProps {
  config?: Config;
  menu?: Categoria[];
  // NUEVO — modo editor
  mode?: "editor";
  onSelectElement?: (el: SelectedElement) => void;
  selectedElement?: SelectedElement | null;
}
```

Cuando `mode === "editor"`:
1. Desactivar interacciones que distraigan: `useCart` debe estar en modo read-only (no guardar en localStorage), `useCartFly` desactivado
2. Cada sección principal se envuelve en un `div` con:
   - `data-editable-type="navbar"` (o el tipo correspondiente)
   - `onClick` que llama a `onSelectElement`
   - Clases de hover: `hover:ring-2 hover:ring-primary/50 cursor-pointer`
   - Cuando está seleccionada: `ring-2 ring-primary`
3. Los productos individuales también deben ser clickeables. Esto requiere propagar `onSelectElement` hasta `MenuSection` → `ProductCard`

### 1.4 EditableWrapper — Componente de envoltura

**Nuevo archivo:** `components/admin/editor/EditableWrapper.tsx`

Responsabilidad: Envolver cualquier sección de la landing y hacerla detectable.

```tsx
function EditableWrapper({
  type,
  categoryId,
  productSlug,
  children,
  label,         // ej: "Navbar", "Pollo Asado", "Cheddar"
}: EditableWrapperProps) {
  const { selected, selectElement } = useEditor();
  const isSelected = selected?.type === type &&
    selected?.categoryId === categoryId &&
    selected?.productSlug === productSlug;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectElement({ type, categoryId, productSlug });
      }}
      className={cn(
        "relative transition-all",
        "hover:ring-2 hover:ring-primary/40 hover:bg-primary/5",
        isSelected && "ring-2 ring-primary z-10"
      )}
    >
      {/* Badge indicador en esquina superior */}
      <span className="absolute -top-3 left-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
      {children}
    </div>
  );
}
```

---

## Fase 2: Panel de Edición (EditPanel)

**Nuevo archivo:** `components/admin/editor/EditPanel.tsx`

Responsabilidad: Renderizar el formulario correcto según el elemento seleccionado.

Estructura del panel:
```
┌──────────────────────────────┐
│  ✏️ Editar: Navbar            │
│  ─────────────────────────   │
│                              │
│  [Logo Desktop]              │
│  ┌────┐ [Subir] [Galería]   │
│  └────┘                      │
│                              │
│  [Logos Mobile]              │
│  ┌────┐ [Subir] [Galería]   │
│  └────┘ [+] Añadir otro      │
│                              │
│  Nombre del negocio          │
│  ┌────────────────────────┐  │
│  │ MC Tommy               │  │
│  └────────────────────────┘  │
│                              │
│  [Guardar cambios]           │
└──────────────────────────────┘
```

### Mapeo selección → formulario

| Selección | Props editables | Componentes reutilizados |
|---|---|---|
| `navbar` | `business.logoDesktop`, `business.logoMobile`, `business.name` | `ImagePicker` (×n), `Input` |
| `search` | `translations["search.placeholder"]` | `Input` |
| `particles` | `theme.particlesDesktop`, `theme.particlesMobile`, `particleIcons` | `ParticleIconManager` compacto, sliders |
| `category` | `category.titulo`, `category.descripcion`, `category.imagen`, `category.tipo_precio`, `category.opcionesNombre` | `ImagePicker`, `Input`, `Select` |
| `product` | `producto.nombre`, `producto.imagen`, `producto.precio`, `producto.ingredientes`, `producto.promociones` | `ImagePicker`, `Input` (precios dinámicos), tags |
| `footer` | `translations["footer.copyright"]`, `business.year` | `Input` con variables `{year}`, `{name}` |
| `theme` (botón general) | TODO el objeto `theme` (colores, fuentes, alturas, partículas) | `ThemeEditor` compacto |

**Reutilización:** El EditPanel NO duplica formularios. Importa y usa los componentes existentes (`ImagePicker`, `ThemeEditor`, `ParticleIconManager`) pero en modo compacto (sin cards, sin headers, inline).

---

## Fase 3: Persistencia

### 3.1 Batch save

**Nuevo archivo:** `app/actions/editor.ts`

Responsabilidad: Recibir el estado completo modificado y persistir solo lo que cambió.

```typescript
export async function saveEditorState(changes: EditorChanges) {
  // Usar Promise.allSettled para guardar todo en paralelo
  const results = await Promise.allSettled([
    changes.business && updateBusinessConfig(changes.business),
    changes.theme && updateBusinessTheme(changes.theme),
    changes.translations && saveTranslationsBatch(changes.translations),
    changes.particleIcons && saveParticleIcons(changes.particleIcons),
    // Categorías y productos se guardan individualmente por select
  ]);
  // Retornar qué falló y qué se guardó
}
```

**Estrategia:** El editor solo guarda explícitamente con un botón "Guardar cambios". No hay auto-save por defecto (evita sobrecargar la BD), pero puede habilitarse.

### 3.2 Dirty tracking

El `EditorContext` compara el `state` actual con un `initialState` snapshot. Si difieren en cualquier propiedad anidada, `isDirty = true`. El botón de guardar se habilita/deshabilita según esto.

---

## Fase 4: UX del Editor

### 4.1 Toolbar del editor

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔙 Volver al admin    Editor Visual                  [💾 Guardar]  │
│                                                            [dirty]  │
│  [💻 Desktop] [📱 Mobile]    Auto-guardar [toggle]                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Estados de selección visual

- **Hover** sobre cualquier zona editable: borde punteado primario + badge flotante con el nombre
- **Seleccionado:** borde sólido primario + badge permanente + panel lateral se desliza
- **No seleccionado:** la landing se ve 100% fiel a producción (sin bordes)

### 4.3 Atajos de teclado

- `Esc`: Deseleccionar elemento
- `Ctrl/Cmd + S`: Guardar
- `D` / `M`: Toggle desktop/mobile

### 4.4 Panel de "no selección"

Cuando nada está seleccionado, el panel lateral muestra:
- Resumen de la landing
- Botón "Editar tema general" (abre todo el tema)
- Lista de elementos clickeables con miniaturas
- Indicador de cambios sin guardar

---

## Archivos a crear/modificar (lista completa)

### Nuevos archivos (infraestructura)

| Archivo | Líneas estimadas | Descripción |
|---|---|---|
| `components/admin/editor/EditorContext.tsx` | ~120 | Context + Provider + hook `useEditor` |
| `components/admin/editor/TemplateEditor.tsx` | ~80 | Shell principal: toolbar + preview + panel |
| `components/admin/editor/DevicePreview.tsx` | ~50 | Wrapper desktop/mobile con frame |
| `components/admin/editor/EditableWrapper.tsx` | ~60 | Wrapper clickeable con hover/selected states |
| `components/admin/editor/EditPanel.tsx` | ~200 | Panel lateral con switch según selección |
| `components/admin/editor/EditPanelNavbar.tsx` | ~80 | Formulario para navbar (logo, nombre) |
| `components/admin/editor/EditPanelCategory.tsx` | ~100 | Formulario para categoría |
| `components/admin/editor/EditPanelProduct.tsx` | ~120 | Formulario para producto |
| `components/admin/editor/EditPanelParticles.tsx` | ~60 | Formulario compacto para partículas |
| `components/admin/editor/EditPanelFooter.tsx` | ~40 | Formulario para footer |
| `app/actions/editor.ts` | ~80 | Batch save, dirty diff |
| `app/admin/(panel)/editor/page.tsx` | ~30 | Página `/admin/editor` |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/components/MenuLandingClient.tsx` | Agregar `mode?: "editor"`, `onSelectElement?`, `selectedElement?`. Condicionalmente envolver secciones en `EditableWrapper`. Desactivar cart/localStorage en modo editor. |
| `app/components/Header.tsx` | Agregar `data-editable-type="navbar"` o aceptar wrapper externo. |
| `app/components/MenuSection.tsx` | Agregar `onSelectCategory?` callback para modo editor. |
| `app/components/ProductCard.tsx` | Agregar `onSelectProduct?` callback para modo editor. |
| `components/admin/AdminSidebar.tsx` | Agregar link "Editor Visual" |
| `app/page.tsx` | Sin cambios (la landing de producción sigue igual) |

---

## Decisiones técnicas clave

### ¿Por qué modificar `MenuLandingClient` en vez de duplicarlo?

Duplicar la landing crearía dos fuentes de verdad para el HTML/CSS. Cada cambio futuro en la landing (nueva sección, nuevo componente) requeriría editar dos lugares. Al agregar props opcionales `mode`/`onSelectElement`, la landing de producción no se ve afectada (las props son `undefined` por defecto), pero el editor puede inyectar comportamiento.

### ¿Cómo desactivar el carrito en modo editor?

`useCart` usa `localStorage` y `useCartFly` lanza animaciones. En modo editor:
1. `useCart` recibe un flag `readOnly?: boolean`. Si es true, no persiste en localStorage y no envía mensajes de WhatsApp.
2. `useCartFly` se desactiva si `disabled` (ya soportado via `theme.reducedMotion`, pero idealmente un flag explícito).

Alternativa más simple: en modo editor, no renderizar `<Cart>` ni `<FlyPortal>`.

### ¿Cómo manejar media queries en el preview móvil?

Las media queries de Tailwind (`sm:`, `md:`, `lg:`) dependen del viewport real del navegador. Para simular móvil dentro de un panel, usamos un `<iframe>` o un contenedor con `container-type: inline-size` y `@container` queries. Pero eso requeriría cambiar todas las media queries del proyecto.

**Solución práctica:** Usar un `<iframe>` para el preview. El iframe carga la misma URL pero con un query param `?preview=mobile`. Esto aisla el CSS y las media queries funcionan nativamente.

Pero cargar un iframe con la misma app es lento y complejo (autenticación, hidratación).

**Solución alternativa (recomendada):** Usar `scale` y un contenedor de 375px. Las media queries de Tailwind responden al viewport del navegador padre, no al contenedor. Para que las partes responsivas se vean bien en el preview móvil, se puede usar una clase helper que fuerce estilos móviles cuando se está dentro de `.mobile-preview`.

En realidad, la forma más simple es: el preview móvil solo cambia el **ancho del contenedor** a 375px. Los componentes de la landing usan CSS variables y container queries donde sea posible. Las media queries `@media (max-width: 767px)` del browser padre seguirán activas si el panel de editor es < 767px (lo cual es probable en un layout de 3 columnas).

**Decisión final:** El `DevicePreview` en modo móvil renderiza la landing dentro de un `<div style={{width: 375}}>` con `overflow-y: auto`. No intentamos engañar a las media queries de Tailwind; el editor se usará en un monitor grande donde el viewport principal del navegador será > 767px, así que la landing en el preview se verá en desktop mode. Para forzar vista móvil, podemos inyectar una clase `force-mobile` que sobreescriba los breakpoints clave.

### ¿Qué pasa con `next/image` y las imágenes de Supabase?

Las imágenes de Supabase Storage son URLs públicas (`*.supabase.co/storage/...`). `next/image` con `unoptimized` funciona bien. En el editor, las imágenes subidas via `ImagePicker` se actualizan en el estado local y se muestran instantáneamente.

---

## Orden de implementación recomendado

### Sprint 1: Infraestructura básica
1. `EditorContext` con estado y mutaciones
2. `DevicePreview` desktop/mobile
3. `TemplateEditor` shell con toolbar
4. Página `/admin/editor` que carga datos y monta el editor

### Sprint 2: Landing en modo editor
5. Modificar `MenuLandingClient` para aceptar `mode="editor"`
6. `EditableWrapper` con hover/selection visual
7. Enviolver secciones en `MenuLandingClient`: navbar, search, particles, categories, footer
8. Desactivar carrito/fly en modo editor

### Sprint 3: Panel de edición
9. `EditPanel` shell con switch de selección
10. `EditPanelNavbar` — logos + nombre
11. `EditPanelCategory` — título, desc, imagen, tipo precio
12. `EditPanelProduct` — nombre, imagen, precios, ingredientes
13. `EditPanelParticles` — cantidad + íconos
14. `EditPanelFooter` — copyright + año

### Sprint 4: Persistencia y pulido
15. `saveEditorState` batch action
16. Dirty tracking en el contexto
17. Botón guardar con estados (idle/saving/success/error)
18. Atajos de teclado (Esc, Ctrl+S)
19. Panel de "no selección" con guía
20. Link en sidebar del admin

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El editor toca muchos componentes de producción | Las modificaciones son **aditivas** (props opcionales). Si hay un bug, la landing real no se afecta. |
| Performance: re-renderizar toda la landing al cambiar un color | Los colores van a CSS variables inline. Cambiar `--naranja-mc` no re-renderiza React, el browser actualiza el CSS nativamente. |
| Estado del menú (Categorías+Productos) es grande y profundo | Usar immer o manualmente spread solo en los niveles que cambian. El menú en Supabase ya es ~6 categorías × ~8 productos = trivial para React. |
| El usuario cierra la pestaña sin guardar | Dirty tracking + `beforeunload` event listener con confirmación. |
| ProductCard no es clickeable individualmente | Agregar un `div` envoltorio alrededor del card en modo editor, o propagar el callback. |

---

## Preguntas para confirmar antes de empezar

1. **¿El preview móvil requiere un iframe real?** O un contenedor de 375px con scroll es suficiente (las media queries de Tailwind no se engañarán, pero el layout básico se verá bien).
2. **¿Querés auto-guardar o solo guardar manual con botón?** Auto-guardar es más cómodo pero genera más tráfico a Supabase.
3. **¿El panel de edición debe estar siempre visible (split-pane) o como sidebar deslizable?** Split-pane recomendado para productividad.
4. **¿Querés poder crear/eliminar categorías y productos desde el editor, o solo editar existentes?** El scope inicial es "editar existentes", CRUD completo puede venir después.
