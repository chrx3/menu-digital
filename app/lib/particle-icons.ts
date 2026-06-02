export const VALID_ICON_NAMES = [
  "hotdog",
  "fries",
  "burger",
  "drumstick",
  "popcorn",
] as const;

export type ValidIcon = (typeof VALID_ICON_NAMES)[number];

export const AVAILABLE_ICONS: { name: ValidIcon; label: string }[] = [
  { name: "hotdog", label: "Completo / Hotdog" },
  { name: "fries", label: "Papas Fritas" },
  { name: "burger", label: "Hamburguesa" },
  { name: "drumstick", label: "Pollo" },
  { name: "popcorn", label: "Snack / Popcorn" },
];
