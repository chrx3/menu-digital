import { BUILTIN_PARTICLE_ICON_NAMES } from "@/app/lib/particle-icon-registry";
import { isCustomSvgParticleName } from "@/app/lib/custom-particle-svg";
import { isIconifyParticleName } from "@/app/lib/iconify";

export const VALID_ICON_NAMES = [
  "hotdog",
  "fries",
  "burger",
  "drumstick",
  "popcorn",
  "pizza",
  "taco",
  "drink",
  "icecream",
  "sandwich",
  "star",
  "heart",
  "fire",
  "coffee",
] as const;

export type ValidIcon = (typeof VALID_ICON_NAMES)[number];

export const AVAILABLE_ICONS: { name: ValidIcon; label: string }[] = [
  { name: "hotdog", label: "Completo / Hotdog" },
  { name: "fries", label: "Papas Fritas" },
  { name: "burger", label: "Hamburguesa" },
  { name: "drumstick", label: "Pollo" },
  { name: "popcorn", label: "Snack / Popcorn" },
  { name: "pizza", label: "Pizza" },
  { name: "taco", label: "Taco / Empanada" },
  { name: "drink", label: "Bebida" },
  { name: "icecream", label: "Helado" },
  { name: "sandwich", label: "Sándwich" },
  { name: "star", label: "Estrella / Destacado" },
  { name: "heart", label: "Corazón / Favorito" },
  { name: "fire", label: "Fuego / Picante" },
  { name: "coffee", label: "Café" },
];

export const PARTICLE_COUNT_DEFAULTS = {
  desktop: 20,
  mobile: 12,
} as const;

export const HIDDEN_BUILTIN_KEY = "_particle_hidden_builtins";

export function parseHiddenBuiltins(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (name): name is ValidIcon =>
        typeof name === "string" &&
        AVAILABLE_ICONS.some((icon) => icon.name === name),
    );
  } catch {
    return [];
  }
}

export function isBuiltinParticleName(
  name: string,
): name is ValidIcon {
  return (BUILTIN_PARTICLE_ICON_NAMES as string[]).includes(name);
}

export function isValidParticleIconName(name: string): boolean {
  return (
    isBuiltinParticleName(name) ||
    isIconifyParticleName(name) ||
    isCustomSvgParticleName(name)
  );
}
