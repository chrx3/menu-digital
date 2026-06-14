# PLAN_MULTITENANT.md

Migración a SaaS multi-negocio con subdominios.
Dominio raíz: `chrsx3.com`. Hosting: VPS con Coolify.

## TL;DR

- Hoy el `slug` del negocio se resuelve por env var (`NEXT_PUBLIC_BUSINESS_SLUG`).
- Hay que resolverlo por **host** en `proxy.ts` y guardarlo en un header `x-business-slug`.
- DNS wildcard `*.chrsx3.com` → tu VPS (Coolify).
- Cert wildcard vía Coolify/Let's Encrypt.
- CRUD `/admin/negocios` (lista, crear, eliminar) y refactor de `/admin/negocio/[id]` (editor ya existente).
- Storage: prefijar paths por `business_id` en lugar de hardcodear `mctomy`.

## Mapa de subdominios

| Subdominio | Sirve | Notas |
|---|---|---|
| `app.chrsx3.com` | Panel admin, login, marketing | Donde vive el CRUD de negocios. Hoy ya está en `/admin/*`. |
| `mctomy.chrsx3.com` | Menú del cliente McTommy | El landing actual. |
| `otro.chrsx3.com` | Menú de otro cliente | Loop. |
| `chrsx3.com` (apex) | Redirect a `app.chrsx3.com` | Opcional, recomendado. |

Los menús públicos son **read-only**. Todo el panel vive en `app.`.

## Estado actual (qué ya está)

| Pieza | Estado | Archivo |
|---|---|---|
| Tabla `businesses` con `slug` | OK | migrations |
| Tabla `business_users` (admin role) | OK | migrations |
| `is_business_admin()` SQL | OK | 20260531190000_admin_transactions.sql |
| `getBusinessSlug()` desde env var | OK, hay que migrar a header | app/lib/business-context.ts:5 |
| `getBusinessId()` async lookup | OK | app/lib/business-context.ts:9 |
| Carga de config/menu por `business_id` | OK en todo | app/config/loader.ts, menu-loader.ts |
| RLS por `business_id` | OK | migrations |
| Editor de UN negocio (`/admin/negocio`) | OK | app/admin/negocio/ |
| **Middleware que lee host** | **Falta** | proxy.ts |
| **Resolver slug por subdominio** | **Falta** | proxy.ts + business-context |
| **CRUD lista/crear/borrar negocios** | **Falta** | app/admin/negocios/ |
| **DNS wildcard** | **Falta** | DNS provider |
| **Cert wildcard** | **Falta** | Coolify/Let's Encrypt |
| **Storage paths por business** | **Parcial** (logos hardcoded) | refs en código |

## Fases

### Fase 0 — DNS + Cert (manual, 1 vez)

En tu proveedor DNS de `chrsx3.com`:

```
A   *.chrsx3.com   → <IP de tu VPS>
A   chrsx3.com     → <IP de tu VPS>     (opcional, para apex)
```

En Coolify:
- Agregar dominio wildcard `chrsx3.com` al recurso de tu app.
- Activar SSL wildcard (Let's Encrypt vía Coolify).
- Esperar 5-10 min a propagación + cert.

**Verificar:** `nslookup mctomy.chrsx3.com` debe resolver a tu IP. `curl -I https://mctomy.chrsx3.com` debe responder.

### Fase 1 — Resolver slug por host (no rompe nada)

Cambio quirúrgico. Mantener `NEXT_PUBLIC_BUSINESS_SLUG` como fallback.

**1.1** Editar `app/lib/business-context.ts:5`:

```ts
// ponytail: header set by proxy.ts; env var is dev fallback
export function getBusinessSlug(): string {
  const fromHeader = (globalThis as { headers?: { get: (k: string) => string | null } })
    .headers?.get?.("x-business-slug");
  if (fromHeader) return fromHeader;
  return process.env.NEXT_PUBLIC_BUSINESS_SLUG || DEFAULT_SLUG;
}
```

**1.2** Editar `proxy.ts` — agregar resolución de host **antes** de la lógica admin:

```ts
const host = request.headers.get("host") ?? "";
const hostname = host.split(":")[0]; // strip port

// Subdominio a slug. Null para apex, www, app.
function resolveBusinessSlug(hostname: string): string | null {
  const root = "chrsx3.com";
  if (!hostname.endsWith("." + root)) return null;       // dev/local
  const sub = hostname.slice(0, -1 - root.length);
  if (!sub || sub === "app" || sub === "www") return null; // panel/admin
  return sub;
}

const slug = resolveBusinessSlug(hostname);
// header para que getBusinessSlug() lo lea en RSC
const requestHeaders = new Headers(request.headers);
if (slug) requestHeaders.set("x-business-slug", slug);
else requestHeaders.delete("x-business-slug");
```

Y propagarlo: `NextResponse.next({ request: { headers: requestHeaders } })` en cada respuesta que retornes.

**1.3** Verificar en dev: `bun dev` o `npm run dev`. En local (`localhost:3000`) sigue usando env var. Para testear subdominio en dev, agregar a `/etc/hosts`:
```
127.0.0.1   mctomy.localhost
```
Next.js 16 sirve `*.localhost` automáticamente. Visitar `http://mctomy.localhost:3000` debe mostrar el menú de McTommy.

### Fase 2 — Mover el panel a `app.chrsx3.com` (cambio de rutas, sin lógica)

**2.1** Reorganizar `app/admin/*` → `app/(panel)/*` (route group, no afecta URL).

O más simple: mantener `app/admin/*` y agregar un rewrite en `proxy.ts`:

```ts
if (hostname === "app.chrsx3.com" || hostname.endsWith(".localhost")) {
  // sigue funcionando /admin/*
}
// si entra por mctomy.chrsx3.com y pide /admin/*, 404
```

**Decisión recomendada:** **route group** `app/(panel)/admin/...` (sin tocar URLs) + proteger en `proxy.ts` que solo `app.` y dev puedan acceder a `/admin/*`.

**2.2** El matcher actual `["/admin/:path*"]` en `proxy.ts:54` ya está bien. Solo agregar: si el host es de un subdominio de cliente y la URL empieza con `/admin`, retornar 404 o redirect a `app.chrsx3.com/admin/auth/login`.

### Fase 3 — CRUD de negocios

**3.1** Nueva página: `app/(panel)/admin/negocios/page.tsx` — **lista** de todos los negocios (tabla: slug, name, is_active, created_at, acciones).

**3.2** Acciones server (`app/(panel)/admin/negocios/actions.ts`):
- `createBusiness({ slug, name })` — valida slug único, inserta, opcionalmente crea fila seed en `business_themes` y `translations` con defaults.
- `deleteBusiness(id)` — soft delete: `is_active = false` + borrar archivos del storage del negocio. **Confirmación obligatoria.**
- `toggleBusinessActive(id)` — pausar/reanudar.

**3.3** Server-side: usar cliente admin (service_role key en server) porque el super-admin no es admin de cada negocio individual. Mantener `is_business_admin()` para los editores existentes.

**3.4** UI mínima: tabla shadcn + dialog de confirmación + form. Sin sobre-diseño.

**3.5** Sidebar del panel: agregar link "Negocios" en `app/(panel)/admin/...` (revisar el layout del panel).

### Fase 4 — Storage por business

**4.1** Auditar refs a storage. Hoy: `logos/mctomy.webp` (visto en el warning de la imagen). Hay que pasar a `logos/{business_id}/logo.webp`.

**4.2** En `loader.ts:mapBusinessFromDb`, los campos `logoDesktop`, `logoMobile[]`, `favicon`, `appleIcon`, `seoOgImage` guardan **paths relativos** o **URLs completas**. Decidir formato:
- **Recomendado:** guardar path relativo `logos/{businessId}/logo.webp`. Helper `getPublicUrl(path)` que antepone el bucket.
- Al subir desde el editor, generar el path con `businessId` actual.

**4.3** Si los paths ya son URLs completas en DB, hacer una migración de datos:
```sql
update businesses set logo_desktop = 'logos/' || id || '/logo.webp' where logo_desktop like 'logos/mctomy/%';
```
**No correr sin backup.** Mejor un script que migre archivo por archivo.

**4.4** RLS de buckets: hoy los buckets `logos` y `particle_icons` son públicos. Mantener. Si se agregan uploads por admin, considerar RLS `auth.uid() in (select user_id from business_users)`.

### Fase 5 — Hardening (no urgente)

- **Rate limit** en `proxy.ts` para subdominios inexistentes (evitar enumeration).
- **Cache por subdominio** — el `unstable_cache` actual usa tag `business-config`. La cache key ya es el slug (lo viste en `loader.ts:28`). OK.
- **Logging** — agregar `console.info({ host, slug })` en proxy para debug.
- **Health check** — `app.chrsx3.com/api/health` que responda OK.
- **Limpiar env var** `NEXT_PUBLIC_BUSINESS_SLUG` una vez estable.

## Archivos a tocar

| Archivo | Cambio | Esfuerzo |
|---|---|---|
| `proxy.ts` | Resolver host → slug, header, proteger admin en subdominios de cliente | M |
| `app/lib/business-context.ts` | Leer header, fallback a env var | XS |
| `app/(panel)/admin/negocios/page.tsx` | Lista de negocios | M |
| `app/(panel)/admin/negocios/actions.ts` | create/delete/toggle | S |
| `app/(panel)/admin/negocios/nuevo/page.tsx` | Form crear | S |
| `app/(panel)/admin/layout.tsx` (o sidebar) | Link "Negocios" | XS |
| `app/config/loader.ts` | (opcional) quitar fallback, asumir header | XS |
| SQL migration | Limpiar paths de storage si aplica | S |
| DNS / Coolify | Wildcard + cert | XS (manual) |

M = 1-2h, S = 30m, XS = 5-10m.

## Riesgos

1. **Cert wildcard** — algunas combinaciones Coolify + DNS provider fallan. Tener plan B: cert por subdominio (1 cert por cliente nuevo, gratis con Let's Encrypt). Más trabajo operacional.
2. **Cache poisoning** — si en algún momento cacheas algo por `slug`, asegurarte de que la key incluya el slug. Ya lo haces en `loader.ts:28` con `unstable_cache`. OK.
3. **Subdominios en cookies** — Supabase SSR setea cookies en el dominio del host. Si inicias sesión en `app.` y luego vas a `mctomy.`, la sesión NO se comparte. **Decidir:** auth compartido entre `app.` y menús (no debería) o scoped a `app.` solo (recomendado). Los menús públicos no requieren auth.
4. **Storage de McTommy existente** — al migrar paths, los menús en producción se rompen hasta migrar archivos. Hacerlo en ventana de mantenimiento o con dual-read.

## Orden de ejecución

1. Fase 0 (DNS + cert) — manual, 1 vez.
2. Fase 1 (resolver slug por host) — bajo riesgo, deploy y probar.
3. Fase 2 (mover panel a `app.`) — bajo riesgo si usas route group.
4. Fase 3 (CRUD negocios) — habilita el caso de uso real.
5. Fase 4 (storage) — al final, cuando ya tengas 2+ negocios creados.
6. Fase 5 — continuo.

## Tests rápidos post-deploy

```bash
# Subdominio del cliente
curl -I https://mctomy.chrsx3.com        # 200, contenido McTommy
curl -I https://otro.chrsx3.com          # 404 o "negocio no existe" si no existe

# Panel
curl -I https://app.chrsx3.com           # 200, redirige a /admin
curl -I https://app.chrsx3.com/admin     # 302 a /admin/auth/login (no auth)

# Wildcard cert
echo | openssl s_client -connect mctomy.chrsx3.com:443 -servername mctomy.chrsx3.com 2>/dev/null | openssl x509 -noout -subject
```

## Lo que NO se hace (YAGNI)

- **No** dominio custom por cliente (`mctomy.cl` con su propio dominio). Aplazable. Agrega 1-2 días más.
- **No** facturación/planes. Aplazable.
- **No** SSO ni roles finos (editor/viewer). Aplazable.
- **No** "preview" del menú antes de publicar. Aplazable.
- **No** migrar los datos de storage en este sprint si McTommy sigue siendo el único cliente. Hacer cuando llegue el segundo.
