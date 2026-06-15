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
  "theme": {
    "colorPrimary": "#f5821f",
    "colorPrimaryLight": "#ffb347",
    "colorPrimaryIntense": "#e86f0a",
    "colorPrimaryText": "#994500",
    "colorBackground": "#fff8f0",
    "colorBackgroundDark": "#f5e6d0",
    "colorBackgroundDeep": "#edd8c0",
    "colorTextDark": "#3d1f00",
    "colorTextMedium": "#5c3410",
    "colorTextLight": "#7a4a1a"
  },
  "translations": {
    "es-CL": [
      { "key": "hero.subtitle", "value": "Bienvenido" },
      { "key": "menu.title", "value": "Nuestro Menú" },
      { "key": "cart.title", "value": "Tu Pedido" },
      { "key": "cart.empty", "value": "Aún no has agregado productos." },
      { "key": "cta.add", "value": "Agregar" },
      { "key": "cta.order", "value": "Pedir por WhatsApp" },
      { "key": "footer.contact", "value": "Contacto" },
      { "key": "footer.address", "value": "Dirección" }
    ],
    "en-US": [
      { "key": "hero.subtitle", "value": "Welcome" },
      { "key": "menu.title", "value": "Our Menu" },
      { "key": "cart.title", "value": "Your Order" },
      { "key": "cart.empty", "value": "No items added yet." },
      { "key": "cta.add", "value": "Add" },
      { "key": "cta.order", "value": "Order via WhatsApp" },
      { "key": "footer.contact", "value": "Contact" },
      { "key": "footer.address", "value": "Address" }
    ]
  },
  "categories": [
    {
      "slug": "identificador-en-kebab-case",
      "titulo": "Nombre de la categoría",
      "descripcion": "Descripción opcional",
      "tipo_precio": "unico" | "tamano" | "proteina",
      "opciones_nombre": "Tamaño" o "Proteína" si aplica, sino "",
      "etiqueta_whatsapp": "Texto del botón whatsapp, ej 'Pedir ahora'",
      "destacado": false,
      "productos": [
        {
          "slug": "identificador-kebab",
          "nombre": "Nombre del producto",
          "descripcion": "Descripción opcional detallada",
          "imagen": "URL o vacío",
          "precio": 5990,
          "destacado": false,
          "opciones": [
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
- theme: SOLO incluye los colores que puedas identificar con confianza a partir de la imagen. Si no estás seguro, omite ese campo (string vacío ""). Formato hex con #. Si el documento es solo texto sin diseño, omite todo el bloque "theme".
- translations: incluye "es-CL" si puedes identificar textos de interfaz en español. Incluye "en-US" SOLO si el menú o documento tiene textos en inglés, o si puedes traducir razonablemente los textos de interfaz. Si no hay textos claros, omite el bloque translations o los locales que no puedas inferir.
- Devuelve SOLO el JSON. Sin explicaciones, sin markdown, sin bloques de código.`;

function extractJson(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = text.match(fence);
  if (m) return JSON.parse(m[1].trim());
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON in response");
  return JSON.parse(text.slice(first, last + 1));
}

// ponytail: pick the SDK style based on the model name. From the docs:
//   OpenAI-compatible SDK: deepseek-v4-pro, deepseek-v4-flash, mimo-v2.5, mimo-v2.5-pro
//   Anthropic-compatible SDK: minimax-m3, minimax-m2.7, minimax-m2.5, qwen3.7-max
function isAnthropicModel(model: string): boolean {
  return /^(minimax|qwen)/i.test(model);
}

const ANTHROPIC_VERSION = "2023-06-01";

async function callOpenAI({
  baseUrl,
  apiKey,
  model,
  dataUrl,
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  dataUrl: string;
}) {
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
    return { ok: false as const, status: res.status, text: await res.text() };
  }
  const completion = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { ok: true as const, text: completion.choices?.[0]?.message?.content };
}

async function callAnthropic({
  baseUrl,
  apiKey,
  model,
  dataUrl,
  mimeType,
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  dataUrl: string;
  mimeType: string;
}) {
  // ponytail: Anthropic Messages API needs the base64 (not data URL) plus
  // a media_type. Build the content blocks accordingly.
  const b64 = dataUrl.split(",", 2)[1] ?? "";
  const isPdf = mimeType === "application/pdf";
  const res = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: b64 },
                }
              : {
                  type: "image",
                  source: { type: "base64", media_type: mimeType, data: b64 },
                },
            {
              type: "text",
              text: "Extrae el menú y devuelve SOLO el JSON.",
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    return { ok: false as const, status: res.status, text: await res.text() };
  }
  const completion = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const block = completion.content?.find((b) => b.type === "text");
  return { ok: true as const, text: block?.text };
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

  const result = isAnthropicModel(model)
    ? await callAnthropic({ baseUrl, apiKey, model, dataUrl, mimeType: file.type })
    : await callOpenAI({ baseUrl, apiKey, model, dataUrl });

  if (!result.ok) {
    console.error("IA error", result.status, result.text.slice(0, 500));
    return NextResponse.json(
      { error: `IA error ${result.status}: ${result.text.slice(0, 800)}` },
      { status: 502 },
    );
  }
  if (!result.text) {
    return NextResponse.json({ error: "IA no devolvió contenido." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = extractJson(result.text);
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
