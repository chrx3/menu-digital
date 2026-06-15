// ponytail: WCAG 2.1 contrast helpers. Used by the theme editor to surface
// ratio warnings next to each color pair, and by the auto-balance feature to
// push foreground colors toward AA/AAA compliance against a chosen background.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ContrastLevel = "AAA" | "AA" | "AA-large" | "fail";

export interface ContrastReport {
  ratio: number;
  level: ContrastLevel;
  passes: { AA: boolean; AAA: boolean; "AA-large": boolean };
}

// ponytail: parse #rgb, #rrggbb, or pass through RGB.
export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      if ([r, g, b].some((n) => Number.isNaN(n))) return null;
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].some((n) => Number.isNaN(n))) return null;
      return { r, g, b };
    }
  }
  return null;
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// ponytail: relative luminance per WCAG 2.1.
function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastReport(fgHex: string, bgHex: string): ContrastReport | null {
  const fg = parseColor(fgHex);
  const bg = parseColor(bgHex);
  if (!fg || !bg) return null;
  const ratio = contrastRatio(fg, bg);
  const passes = {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    "AA-large": ratio >= 3,
  };
  let level: ContrastLevel = "fail";
  if (passes.AAA) level = "AAA";
  else if (passes.AA) level = "AA";
  else if (passes["AA-large"]) level = "AA-large";
  return { ratio, level, passes };
}

// ponytail: shift the foreground color toward black or white until the
// contrast against `bg` reaches `minRatio` (default 4.5 = AA body).
export function pickReadableForeground(
  fgHex: string,
  bgHex: string,
  minRatio = 4.5,
): string {
  const fg = parseColor(fgHex);
  const bg = parseColor(bgHex);
  if (!fg || !bg) return fgHex;
  if (contrastRatio(fg, bg) >= minRatio) return fgHex;
  // Decide direction: if background is dark, push fg toward white. Else black.
  const bgLum = relativeLuminance(bg);
  const toward = bgLum < 0.5 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  // Linear blend, step 5%, until ratio passes.
  for (let t = 0.05; t <= 1; t += 0.05) {
    const mixed: RGB = {
      r: fg.r + (toward.r - fg.r) * t,
      g: fg.g + (toward.g - fg.g) * t,
      b: fg.b + (toward.b - fg.b) * t,
    };
    if (contrastRatio(mixed, bg) >= minRatio) return rgbToHex(mixed);
  }
  return rgbToHex(toward);
}

// ponytail: derive a coherent palette from a single primary color. Lightens
// and darkens the source by mixing toward white/black, then picks text/background
// companions that pass AA.
export interface DerivedPalette {
  colorPrimary: string;
  colorPrimaryLight: string;
  colorPrimaryIntense: string;
  colorPrimaryText: string;
  colorBackground: string;
  colorBackgroundDark: string;
  colorBackgroundDeep: string;
  colorTextDark: string;
  colorTextMedium: string;
  colorTextLight: string;
  colorWhite: string;
}

function mix(c: RGB, toward: RGB, t: number): RGB {
  return {
    r: c.r + (toward.r - c.r) * t,
    g: c.g + (toward.g - c.g) * t,
    b: c.b + (toward.b - c.b) * t,
  };
}

export function derivePalette(primaryHex: string): DerivedPalette | null {
  const p = parseColor(primaryHex);
  if (!p) return null;
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const colorPrimary = primaryHex;
  const colorPrimaryLight = rgbToHex(mix(p, white, 0.5));
  const colorPrimaryIntense = rgbToHex(mix(p, black, 0.4));
  const colorPrimaryText = pickReadableForeground("#ffffff", primaryHex, 4.5);

  // Background: very light, slightly tinted toward primary.
  const colorBackground = rgbToHex(mix(p, white, 0.97));
  const colorBackgroundDark = rgbToHex(mix(p, white, 0.9));
  const colorBackgroundDeep = rgbToHex(mix(p, white, 0.8));

  // Text: pick dark text on light background.
  const colorTextDark = pickReadableForeground("#1a1a1a", colorBackground, 4.5);
  const colorTextMedium = pickReadableForeground("#4a4a4a", colorBackground, 4.5);
  const colorTextLight = pickReadableForeground("#7a7a7a", colorBackground, 3);
  const colorWhite = "#ffffff";

  return {
    colorPrimary,
    colorPrimaryLight,
    colorPrimaryIntense,
    colorPrimaryText,
    colorBackground,
    colorBackgroundDark,
    colorBackgroundDeep,
    colorTextDark,
    colorTextMedium,
    colorTextLight,
    colorWhite,
  };
}
