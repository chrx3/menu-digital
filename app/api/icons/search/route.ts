import { searchIconify } from "@/app/lib/iconify";
import { requireAdmin } from "@/app/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? searchParams.get("query") ?? "";
  const rawLimit = Number(searchParams.get("limit") ?? 24);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 24;

  if (query.trim().length < 2) {
    return NextResponse.json({ icons: [], total: 0 });
  }

  try {
    const result = await searchIconify(query, limit);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo buscar íconos", icons: [], total: 0 },
      { status: 502 },
    );
  }
}
