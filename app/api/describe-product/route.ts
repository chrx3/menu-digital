import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const SYSTEM_PROMPT = `Eres un experto en gastronomía chilena. Analiza la imagen de un plato de comida y genera una descripción atractiva para un menú digital de restaurante.

Responde SOLO con un JSON válido (sin markdown, sin comentarios):

{
  "nombre": "Nombre corto y atractivo del plato (máx 50 caracteres)",
  "descripcion": "Descripción apetitosa del plato (2-3 oraciones, máx 200 caracteres). Usa lenguaje sensorial: texturas, sabores, aromas. En español chileno.",
  "ingredientes": ["Ingrediente 1", "Ingrediente 2", "Ingrediente 3"],
  "categoria_sugerida": "categoría sugerida (ej: hamburguesas, ensaladas, postres, bebidas)",
  "destacado": false
}

Reglas:
- Si no puedes identificar un ingrediente con certeza, no lo incluyas.
- La descripción debe ser apetitosa pero honesta, no exageres.
- Usa español chileno natural (ej: "palta" no "aguacate").
- categorías comunes: hamburguesas, sandwich, ensaladas, papas, bebidas, postres, picoteo, fajitas, pollo.
- Devuelve SOLO el JSON.`;

function extractJson(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = text.match(fence);
  if (m) return JSON.parse(m[1].trim());
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON in response");
  return JSON.parse(text.slice(first, last + 1));
}

export async function POST(req: Request) {
  const { user } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Archivo debe pesar entre 1 byte y 5 MB." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Tipo no soportado: ${file.type}. Usa PNG, JPEG o WebP.` },
      { status: 400 },
    );
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MINIMAX_API_KEY no está configurada en el servidor." },
      { status: 500 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const b64 = Buffer.from(bytes).toString("base64");

  const res = await fetch("https://api.minimax.io/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "minimax-m3",
      max_tokens: 1024,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: file.type, data: b64 },
            },
            {
              type: "text",
              text: "Describe este plato para el menú digital.",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("MiniMax vision error", res.status, errText.slice(0, 500));
    return NextResponse.json(
      { error: `MiniMax error ${res.status}: ${errText.slice(0, 800)}` },
      { status: 502 },
    );
  }

  const completion = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const block = completion.content?.find((b) => b.type === "text");
  if (!block?.text) {
    return NextResponse.json({ error: "MiniMax no devolvió contenido." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = extractJson(block.text);
  } catch (e) {
    return NextResponse.json(
      { error: "JSON inválido: " + (e instanceof Error ? e.message : "?") },
      { status: 502 },
    );
  }

  return NextResponse.json({ data: parsed });
}
