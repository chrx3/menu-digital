"use client";

import { useState } from "react";
import { useEditor } from "./EditorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EditPanelSection } from "./EditPanelSection";
import { cn } from "@/lib/utils";
import type { BusinessTheme } from "@/app/config/types";

type ColorKey = Extract<keyof BusinessTheme, `color${string}`>;

const SIMPLE_COLORS: { key: ColorKey; label: string }[] = [
  { key: "colorPrimary", label: "Principal" },
  { key: "colorBackground", label: "Fondo" },
  { key: "colorTextDark", label: "Texto" },
];

const ADVANCED_COLORS: { key: ColorKey; label: string }[] = [
  { key: "colorPrimaryLight", label: "Primario claro" },
  { key: "colorPrimaryIntense", label: "Primario intenso" },
  { key: "colorPrimaryText", label: "Texto primario" },
  { key: "colorBackgroundDark", label: "Fondo oscuro" },
  { key: "colorBackgroundDeep", label: "Fondo profundo" },
  { key: "colorTextMedium", label: "Texto medio" },
  { key: "colorTextLight", label: "Texto claro" },
  { key: "colorWhite", label: "Blanco" },
];

function ColorRow({
  colorKey,
  label,
  value,
  onChange,
}: {
  colorKey: ColorKey;
  label: string;
  value: string;
  onChange: (key: ColorKey, value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(colorKey, e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          title={label}
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(colorKey, e.target.value)}
        placeholder="#000000"
        className="h-8 flex-1 text-xs"
      />
      <span className="w-14 shrink-0 text-[10px] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function EditPanelTheme() {
  const { state, updateTheme } = useEditor();
  const [mode, setMode] = useState<"simple" | "advanced">("simple");

  const handleColor = (key: ColorKey, value: string) => {
    updateTheme({ [key]: value } as Partial<BusinessTheme>);
  };

  const colorFields =
    mode === "simple" ? SIMPLE_COLORS : [...SIMPLE_COLORS, ...ADVANCED_COLORS];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-0.5">
        {(["simple", "advanced"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              mode === m
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "simple" ? "Simple" : "Avanzado"}
          </button>
        ))}
      </div>

      <EditPanelSection title="Colores" defaultOpen>
        <div className="flex flex-col gap-2">
          {colorFields.map(({ key, label }) => (
            <ColorRow
              key={key}
              colorKey={key}
              label={label}
              value={state.theme?.[key] || ""}
              onChange={handleColor}
            />
          ))}
        </div>
      </EditPanelSection>

      <EditPanelSection title="Tipografía" defaultOpen>
        <div className="flex flex-col gap-2">
          <Label>Heading</Label>
          <Input
            value={state.theme?.fontHeading || "Fredoka"}
            onChange={(e) => updateTheme({ fontHeading: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Body</Label>
          <Input
            value={state.theme?.fontBody || "Poppins"}
            onChange={(e) => updateTheme({ fontBody: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      </EditPanelSection>

      {mode === "advanced" && (
        <>
          <EditPanelSection title="Layout" defaultOpen={false}>
            <div className="flex flex-col gap-2">
              <Label>Altura header desktop</Label>
              <Input
                value={state.theme?.headerHeightDesktop || "80px"}
                onChange={(e) =>
                  updateTheme({ headerHeightDesktop: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Altura header mobile</Label>
              <Input
                value={state.theme?.headerHeightMobile || "72px"}
                onChange={(e) =>
                  updateTheme({ headerHeightMobile: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
          </EditPanelSection>

          <EditPanelSection
            title="Comportamiento"
            description="Animaciones del carrito y accesibilidad"
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Animación carrito (s)</Label>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  step={0.1}
                  value={state.theme?.cartFlyDuration ?? 0.7}
                  onChange={(e) =>
                    updateTheme({ cartFlyDuration: Number(e.target.value) })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Tamaño animación (px)</Label>
                <Input
                  type="number"
                  min={16}
                  max={120}
                  value={state.theme?.cartFlyBallSize ?? 44}
                  onChange={(e) =>
                    updateTheme({ cartFlyBallSize: Number(e.target.value) })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Label className="cursor-pointer">
              <Checkbox
                checked={state.theme?.reducedMotion || false}
                onCheckedChange={(checked) =>
                  updateTheme({ reducedMotion: checked === true })
                }
              />
              Reducir animaciones decorativas
            </Label>
            <p className="text-[10px] text-muted-foreground">
              La cantidad de partículas se ajusta en el panel “Partículas”.
            </p>
          </EditPanelSection>
        </>
      )}
    </div>
  );
}
