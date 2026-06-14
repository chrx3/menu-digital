import { NextResponse } from "next/server";
import { checkSubdomain, type SubdomainStatus } from "@/app/actions/subdomain-status";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

export async function POST(req: Request) {
  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ kind: "unreachable", error: "Bad request" } satisfies SubdomainStatus, { status: 400 });
  }
  const slug = String(body.slug ?? "").toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { kind: "dns_error", error: "Slug inválido" } satisfies SubdomainStatus,
      { status: 400 },
    );
  }
  const result = await checkSubdomain({ slug });
  return NextResponse.json(result);
}
