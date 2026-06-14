"use server";

import { createServiceClient, createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/app/lib/domains";
import { isSuperAdmin } from "@/app/lib/super-admin";

export type SubdomainStatus =
  | { kind: "ok"; http: number; latencyMs: number }
  | { kind: "redirect"; http: number; latencyMs: number; to: string }
  | { kind: "http_error"; http: number; latencyMs: number }
  | { kind: "dns_error"; error: string }
  | { kind: "timeout"; latencyMs: number }
  | { kind: "unreachable"; error: string };

// ponytail: HEAD + abort after timeout. Returns minimal status info, no body fetch.
export async function checkSubdomain({
  slug,
  timeoutMs = 5000,
}: {
  slug: string;
  timeoutMs?: number;
}): Promise<SubdomainStatus> {
  const url = `https://${slug}.${ROOT_DOMAIN}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = Date.now() - t0;
    clearTimeout(t);
    if (res.status >= 300 && res.status < 400) {
      const to = res.headers.get("location") ?? "";
      return { kind: "redirect", http: res.status, latencyMs, to };
    }
    if (res.status >= 200 && res.status < 300) {
      return { kind: "ok", http: res.status, latencyMs };
    }
    return { kind: "http_error", http: res.status, latencyMs };
  } catch (e) {
    const latencyMs = Date.now() - t0;
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.name === "AbortError") {
      return { kind: "timeout", latencyMs };
    }
    if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
      return { kind: "dns_error", error: msg };
    }
    return { kind: "unreachable", error: msg };
  }
}

export async function checkBusinessesStatus(
  slugs: string[],
): Promise<Record<string, SubdomainStatus>> {
  const out: Record<string, SubdomainStatus> = {};
  await Promise.all(
    slugs.map(async (slug) => {
      out[slug] = await checkSubdomain({ slug });
    }),
  );
  return out;
}

export async function refreshBusinessesStatus() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email ?? null;
  if (!email) return { error: "Sin sesión." };
  if (!(await isSuperAdmin(email))) return { error: "Sin permisos." };

  const service = await createServiceClient();
  const { data, error } = await service
    .from("businesses")
    .select("slug")
    .eq("is_active", true);
  if (error) return { error: error.message };
  const slugs = (data ?? []).map((b) => b.slug as string);
  const status = await checkBusinessesStatus(slugs);
  return { data: status };
}
