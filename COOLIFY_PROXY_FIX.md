# Fix Traefik de Coolify para preservar Host

## Problema
Traefik del VPS no reenvía el header `Host` original al container.
Resulta en redirects a `https://localhost/...` desde la app Next.js (por ejemplo cuando navegas a `app.chrsx3.com/` te redirige a `https://localhost/admin`).

La app ya intenta leer `x-forwarded-host` y construir URLs desde el header, pero **Traefik no está seteando ese header** porque su config no tiene `forwardedHeaders: insecure: true`.

## Fix (manual en el VPS)

### Pasos

1. Conectarse al VPS por SSH:
   ```bash
   ssh root@66.94.117.178
   ```

2. Encontrar el archivo docker-compose del proxy de Coolify:
   ```bash
   docker ps | grep coolify-proxy
   docker inspect coolify-proxy --format '{{index .Config.Cmd}}'
   ```

   Típicamente vive en `/data/coolify/proxy/docker-compose.yml` o en algún `coolify-data`. Búscalo:
   ```bash
   find / -name "docker-compose*.yml" 2>/dev/null | xargs grep -l "coolify-proxy" 2>/dev/null
   ```

3. Editar y agregar al comando de Traefik (debe quedar como flags adicionales, los originales se mantienen):
   ```yaml
   services:
     traefik:
       command:
         - '--ping=true'
         - '--entrypoints.http.address=:80'
         - '--entrypoints.https.address=:443'
         - '--entrypoints.http.forwardedHeaders.insecure=true'    # ← AGREGAR
         - '--entrypoints.https.forwardedHeaders.insecure=true'   # ← AGREGAR
         # ... resto de flags
   ```

4. Reiniciar el proxy:
   ```bash
   docker compose down && docker compose up -d
   ```

   Si el archivo no se llama `docker-compose.yml` sino `docker-compose.yaml`, ajusta el comando.

## Verificación

Después del reinicio, en el browser:
- Ir a `https://app.chrsx3.com/`
- La URL debe quedarse en `app.chrsx3.com` (no saltar a `localhost`)
- En Network tab, los redirects 307 deben tener `Location` con `app.chrsx3.com` o path relativo (no `localhost`)

Si después de este fix la app Next.js sigue viendo `localhost` en `request.headers.get('host')`, agregar también:
```yaml
- '--entrypoints.http.proxyProtocol.insecure=true'  # solo si usas proxy protocol
```

## Alternativa: nginx en lugar de Traefik

Si Traefik sigue dando problemas, Coolify soporta nginx. Pero Traefik es el default y debería funcionar con el flag.

## Por qué pasó esto

Coolify 4 cambió Traefik de versión 2 a 3 entre releases. La nueva config ya no tiene `forwardedHeaders` por default. Es un bug/feature en su config auto-generada.
