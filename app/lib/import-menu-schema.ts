// ponytail: schema for IA menu import. Validates the AI response shape.
import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_-]+$/, "slug: a-z, 0-9, _, -");

const priceOption = z.object({
  value: slug,
  label: z.string().trim().min(1).max(80),
  price: z.number().finite().nonnegative(),
});

const product = z.object({
  slug: slug.optional(),
  nombre: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(500).optional(),
  imagen: z.string().url().optional().or(z.literal("")).optional(),
  precio: z.number().finite().nonnegative().optional(),
  destacado: z.boolean().optional().default(false),
  opciones: z.array(priceOption).max(20).optional().default([]),
  ingredientes: z.array(z.string().trim().min(1).max(100)).max(50).optional().default([]),
  promociones: z
    .array(
      z.object({
        value: slug,
        label: z.string().trim().min(1).max(80),
        price: z.number().finite().nonnegative(),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  incluye: z.array(z.string().trim().min(1).max(100)).max(30).optional().default([]),
  incluye_texto: z.string().trim().max(240).optional().default(""),
});

const category = z.object({
  slug: slug.optional(),
  titulo: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(240).optional().default(""),
  tipo_precio: z.enum(["unico", "tamano", "proteina"]).optional().default("unico"),
  opciones_nombre: z.string().trim().max(80).optional().default(""),
  etiqueta_whatsapp: z.string().trim().max(100).optional().default(""),
  destacado: z.boolean().optional().default(false),
  productos: z.array(product).max(200).default([]),
});

export const importMenuSchema = z.object({
  categories: z.array(category).max(50),
});

export type ImportMenu = z.infer<typeof importMenuSchema>;
export type ImportCategory = z.infer<typeof category>;
export type ImportProduct = z.infer<typeof product>;
