# Multitenant — checklist completo

## 1. Dominio y DNS
- [x] Wildcard `*.katemi.com` en DNS (ya estaba en Vercel, dominio distinto al actual)
- [ ] **FALTA**: Verificar en Vercel que `*.chrsx3.com` apunte a la IP del VPS. El wildcard en la imagen que mostraste era para `katemi.com`, no `chrsx3.com`.

## 2. Coolify
- [x] Recurso `menu-digital` creado con build pack nixpacks
- [x] Node 22 forzado vía `nixpacks.toml` (commit `fe82f3c`)
- [x] FQDN con dominios: `mctommy.chrsx3.com`, `app.chrsx3.com`, `mcfusion.chrsx3.com`, `pilonybrutus.chrsx3.com` (sin guiones, Coolify normaliza)
- [x] SSL wildcard de Let's Encrypt emitido por HTTP-01, uno por subdominio
- [x] Traefik enruta a `localhost:3000` dentro del contenedor (correcto)

## 3. Variables de entorno en Coolify (recurso menu-digital)
- [x] `NEXT_PUBLIC_SUPABASE_URL` = https://srvgkmjiqepcopnulwjn.supabase.co
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (eyJ...blw)
- [x] `SUPABASE_SERVICE_ROLE_KEY` = (eyJ...U_A)
- [x] `SUPER_ADMIN_EMAILS` = chris.alc.13@gmail.com
- [ ] **REVISAR**: `NEXT_PUBLIC_BUSINESS_SLUG` está en `mc-tommy` (con guión). Slug real en DB es `mctommy`. Actualizarlo a `mctommy` desde la UI de Coolify (no hay endpoint API para editar env vars individuales). Es solo fallback dev; en `app.` se usa cookie.

## 4. Supabase Auth
- [x] Usuario `chris.alc.13@gmail.com` creado, email confirmado
- [x] Membresía en `business_users` con role=admin en McTommy

## 5. Supabase DB
- [x] Tabla `businesses` con 3 negocios: mctommy, mcfusion, pilonybrutus
- [x] Slugs sin guiones (renombrados desde `mc-tommy`, `mc-fusion`, `pilon-y-brutus`)
- [x] Seed theme + translations en `business_themes` y `translations` para cada negocio
- [x] RLS permite lectura pública de `businesses`

## 6. Código Next.js
- [x] `proxy.ts` resuelve host → header `x-business-slug` (con fix de `x-forwarded-host`)
- [x] `business-context.ts` lee slug de: header > cookie > env > default
- [x] `admin-auth.ts` permite super_admin bypass de membresía
- [x] `super-admin.ts` lee `SUPER_ADMIN_EMAILS` env var
- [x] `/admin/negocios` CRUD de plataformas (lista, crear, toggle, delete)
- [x] Dropdown "Cambiar negocio" en sidebar (solo si super_admin)
- [x] Cookie `active_business_slug` se setea via server action

## 7. Storage (Supabase)
- [x] Uploads en buckets `logos` y `products` con prefijo `{businessId}/`
- [x] Helper `publicUrl()` centraliza URLs
- [x] Archivos legacy de McTommy (sin prefijo) siguen funcionando porque guardan URL completa en DB

## 8. Pendientes / bugs conocidos
- [ ] **BUG ACTUAL**: redirect a `https://localhost/admin` cuando se navega a `app.chrsx3.com/`. Causa: Traefik no preserva el Host header original. **Fix en commit pendiente** (lee `x-forwarded-host`).
- [ ] El cambio de negocio en el dropdown puede fallar por RLS si la action corre con anon en lugar de service role. **Ya fixed**.
- [ ] `NEXT_PUBLIC_BUSINESS_SLUG` en Coolify sigue en `mc-tommy` (con guión). Actualizar a `mctommy` (sin guión) desde la UI.
