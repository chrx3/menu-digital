import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { importMenuSchema } from "@/app/lib/import-menu-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const SYSTEM_PROMPT = `Eres un asistente que extrae menús de restaurantes desde imágenes o PDFs.
Devuelve SOLO un JSON válido (sin markdown, sin comentarios) con esta estructura exacta:

{
  "categories": [
    {
      "slug": "identificador-en-kebab-case",  // opcional, único
      "titulo": "Nombre de la categoría",
      "descripcion": "Descripción opcional",
      "tipo_precio": "unico" | "tamano" | "proteina",
      "opciones_nombre": "Tamaño" o "Proteína" si aplica, sino "",
      "etiqueta_whatsapp": "Texto del botón whatsapp, ej 'Pedir ahora'",
      "destacado": false,
      "productos": [
        {
          "slug": "identificador-kebab",  // opcional
          "nombre": "Nombre del producto",
          "descripcion": "Descripción opcional",
          "imagen": "URL o vacío",
          "precio": 5990,  // número entero CLP, sin puntos ni comas. Omitir si tiene opciones.
          "destacado": false,
          "opciones": [  // solo si tipo_precio != unico
            { "value": "personal", "label": "Personal", "price": 5990 },
            { "value": "mediana", "label": "Mediana", "price": 8990 }
          ],
          "ingredientes": ["Jamón", "Queso"],
          "promociones": [
            { "value": "mediana", "label": "Mediana", "price": 7990 }
          ],
          "incluye": ["Bebida", "Papas"],
          "incluye_texto": ""
        }
      ]
    }
  ]
}

Reglas:
- Precios en pesos chilenos (CLP), números enteros sin separadores.
- Si un producto tiene varias opciones de tamaño/proteína, usa tipo_precio "tamano" o "proteina" en la categoría, y pon el array "opciones" en cada producto. No incluyas "precio" si tiene opciones.
- Slugs en kebab-case, sin acentos, sin caracteres especiales.
- Si el menú tiene promociones 2x1 o similares, ponlas en "promociones" con el mismo formato que opciones.
- Devuelve SOLO el JSON. Sin explicaciones, sin markdown, sin bloques de código.`;

function extractJson(text: string): unknown {
  // Strip markdown fences if present
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = text.match(fence);
  if (m) return JSON.parse(m[1].trim());
  // Find first { and last }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON in response");
  return JSON.parse(text.slice(first, last + 1));
}

export async function POST(req: Request) {
  // ponytail: gate by super_admin or business admin. Use the request's auth cookie.
  const { user } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Archivo debe pesar entre 1 byte y 8 MB." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Tipo no soportado: ${file.type}. Usa PDF, PNG, JPEG o WebP.` },
      { status: 400 },
    );
  }

  const baseUrl = process.env.OPENCODE_GO_BASE_URL ?? "https://api.opencode.ai/v1";
  const apiKey = process.env.OPENCODE_GO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENCODE_GO_API_KEY no está configurada en el servidor." },
      { status: 500 },
    );
  }
  const model = process.env.OPENCODE_GO_MODEL ?? "minimax-m3";

  const bytes = new Uint8Array(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

  // ponytail: OpenAI-compatible chat completion with vision input.
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extrae el menú de este archivo y devuelve SOLO el JSON." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: `IA error ${res.status}: ${errText.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const completion = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = completion.choices?.[0]?.message?.content;
  if (!text) {
    return NextResponse.json({ error: "IA no devolvió contenido." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (e) {
    return NextResponse.json(
      { error: "IA devolvió JSON inválido: " + (e instanceof Error ? e.message : "?") },
      { status: 502 },
    );
  }

  const validated = importMenuSchema.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "JSON no coincide con el schema esperado: " + validated.error.issues[0]?.message,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ data: validated.data });
}
