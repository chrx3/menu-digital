"use client";

import { useMemo, useState } from "react";
import { contrastReport, pickReadableForeground, derivePalette } from "@/app/lib/contrast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, RefreshCcw, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ThemeColors {
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

interface Props {
  colors: ThemeColors;
  onChange: (next: Partial<ThemeColors>) => void;
  businessName: string;
}

const SAMPLE_PRODUCTS = [
  { nombre: "Pizza Margarita", precio: 8990 },
  { nombre: "Pizza Pepperoni", precio: 9990 },
  { nombre: "Pizza Vegetariana", precio: 9490 },
];

function Swatch({
  label,
  fg,
  bg,
}: {
  label: string;
  fg: string;
  bg: string;
}) {
  const r = contrastReport(fg, bg);
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs">
      <span
        className="size-4 shrink-0 rounded border"
        style={{ backgroundColor: fg, color: bg, fontSize: 8, lineHeight: 1, textAlign: "center" }}
        aria-hidden="true"
      >
        Aa
      </span>
      <span className="flex-1 truncate">{label}</span>
      {r && (
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            r.passes.AAA
              ? "bg-emerald-100 text-emerald-700"
              : r.passes.AA
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          }`}
          title={`Ratio ${r.ratio.toFixed(2)}:1`}
        >
          {r.passes.AAA ? "AAA" : r.passes.AA ? "AA" : "✕"} {r.ratio.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function LiveThemePreview({ colors, onChange, businessName }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  function autoBalance() {
    const source = colors.colorPrimary;
    const derived = derivePalette(source);
    if (!derived) {
      toast.error("No se pudo derivar la paleta. Color inválido?");
      return;
    }
    onChange(derived);
    toast.success("Paleta ajustada para mejor contraste");
  }

  function refresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }

  const pairs = useMemo(
    () => [
      { label: "Texto sobre fondo", fg: colors.colorTextDark, bg: colors.colorBackground },
      { label: "Primario sobre fondo", fg: colors.colorPrimary, bg: colors.colorBackground },
      { label: "Texto claro sobre bg", fg: colors.colorWhite, bg: colors.colorBackgroundDeep },
      { label: "Primario claro sobre fondo", fg: colors.colorPrimaryLight, bg: colors.colorBackground },
      { label: "Texto sobre primario", fg: colors.colorPrimaryText, bg: colors.colorPrimary },
      { label: "Texto medio sobre fondo", fg: colors.colorTextMedium, bg: colors.colorBackground },
    ],
    [colors],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Vista previa</CardTitle>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={autoBalance}
              title="Auto-ajustar contrastes con IA a partir de colorPrimary"
            >
              <Wand2 className="mr-1.5 size-3.5" aria-hidden="true" />
              Auto-ajustar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={refresh}
              title="Refrescar preview"
              aria-label="Refrescar preview"
            >
              <RefreshCcw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg p-4 text-sm"
            style={{ backgroundColor: colors.colorBackground, color: colors.colorTextDark }}
          >
            <div
              className="mb-3 flex items-center justify-between rounded-md px-3 py-2"
              style={{ backgroundColor: colors.colorPrimary, color: colors.colorPrimaryText }}
            >
              <span className="font-semibold">{businessName}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">Menú</span>
            </div>
            <div className="mb-3 rounded-md p-3" style={{ backgroundColor: colors.colorBackgroundDark }}>
              <input
                type="text"
                placeholder="Buscar en el menú…"
                className="w-full rounded-md border bg-white px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: colors.colorBackgroundDeep, color: colors.colorTextDark }}
                readOnly
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {SAMPLE_PRODUCTS.map((p) => (
                <div
                  key={p.nombre}
                  className="rounded-md border p-2.5"
                  style={{ backgroundColor: colors.colorWhite, borderColor: colors.colorBackgroundDeep }}
                >
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: colors.colorTextDark }}
                  >
                    {p.nombre}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.colorTextMedium }}
                  >
                    ${p.precio.toLocaleString("es-CL")}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                    style={{ backgroundColor: colors.colorPrimary, color: colors.colorPrimaryText }}
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Contraste WCAG</CardTitle>
          <CardDescription className="text-xs">
            Verde = AAA (≥7:1). Amarillo = AA (≥4.5:1). Rojo = falla.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {pairs.map((p) => (
            <Swatch key={p.label} label={p.label} fg={p.fg} bg={p.bg} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
