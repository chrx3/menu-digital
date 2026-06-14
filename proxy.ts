import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROOT_DOMAIN, PANEL_SUBDOMAIN } from "@/app/lib/domains";

const SLUG_HEADER = "x-business-slug";
const NON_BUSINESS_SUBDOMAINS = new Set([PANEL_SUBDOMAIN, "www", ""]);

// ponytail: takes "mctomy.katemi.com" -> "mctomy". Returns null for panel/apex/local.
function resolveBusinessSlug(hostname: string): string | null {
  if (!hostname.endsWith("." + ROOT_DOMAIN)) return null;
  const sub = hostname.slice(0, -1 - ROOT_DOMAIN.length);
  if (NON_BUSINESS_SUBDOMAINS.has(sub)) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(sub)) return null;
  return sub.toLowerCase();
}

function applySlugHeader(request: NextRequest, slug: string | null): Headers {
  const h = new Headers(request.headers);
  if (slug) h.set(SLUG_HEADER, slug);
  else h.delete(SLUG_HEADER);
  return h;
}

export default async function proxy(request: NextRequest) {
  // ponytail: prefer x-forwarded-host (set by Traefik) over Host header.
  // Coolify routes via Traefik to localhost:3000, so the raw Host header is
  // "localhost" and breaks Location URLs.
  const fwdHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("x-original-host") ??
    request.headers.get("host") ??
    "";
  const fwdProto =
    request.headers.get("x-forwarded-proto") ??
    (request.nextUrl.protocol.replace(":", ""));
  const hostname = fwdHost.split(",")[0].trim().split(":")[0];
  const protocol = fwdProto.split(",")[0].trim();
  const slug = resolveBusinessSlug(hostname);
  const requestHeaders = applySlugHeader(request, slug);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/admin/auth");
  const isPanelHost = slug === null && hostname === `${PANEL_SUBDOMAIN}.${ROOT_DOMAIN}`;

  // ponytail: same-origin redirect helper. NextResponse.redirect requires
  // absolute URLs and resolves them against the (rewritten) Host header,
  // which gives us "https://localhost/...". Set the Location header
  // manually with a relative path so the browser keeps the user's origin.
  const relativeRedirect = (path: string, searchParams?: URLSearchParams) => {
    const u = new URL(path, "http://_");
    if (searchParams) {
      for (const [k, v] of searchParams) u.searchParams.set(k, v);
    }
    const res = new NextResponse(null, { status: 307 });
    res.headers.set("Location", `${u.pathname}${u.search}`);
    return res;
  };

  // ponytail: /admin is panel-only. On business subdomains, bounce to apex.
  if (isAdminRoute && slug !== null) {
    return relativeRedirect("/");
  }

  // ponytail: panel host landing -> /admin. Business hosts keep / as the menu.
  if (isPanelHost && request.nextUrl.pathname === "/") {
    return relativeRedirect("/admin");
  }

  if (isAdminRoute && !isAuthRoute && !user) {
    const sp = new URLSearchParams();
    sp.set("redirect", request.nextUrl.pathname);
    return relativeRedirect("/admin/auth/login", sp);
  }

  if (isAuthRoute && user && !request.nextUrl.searchParams.has("error")) {
    return relativeRedirect("/admin");
  }

  return supabaseResponse;
}

export const config = {
  // ponytail: run on / and /admin so we can resolve host -> slug everywhere.
  matcher: ["/", "/admin/:path*"],
};
