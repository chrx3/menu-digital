"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getBusinessTheme, updateBusinessTheme } from "@/app/actions/theme";
import { Loader2, Save } from "lucide-react";

interface ThemeState {
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
  fontHeading: string;
  fontBody: string;
  headerHeightDesktop: string;
  headerHeightMobile: string;
  particlesDesktop: number;
  particlesMobile: number;
  cartFlyDuration: number;
  cartFlyBallSize: number;
  reducedMotion: boolean;
}

const DEFAULT_THEME: ThemeState = {
  colorPrimary: "#f5821f",
  colorPrimaryLight: "#ffb347",
  colorPrimaryIntense: "#e86f0a",
  colorPrimaryText: "#994500",
  colorBackground: "#fff8f0",
  colorBackgroundDark: "#f5e6d0",
  colorBackgroundDeep: "#edd8c0",
  colorTextDark: "#3d1f00",
  colorTextMedium: "#5c3410",
  colorTextLight: "#7a4a1a",
  colorWhite: "#ffffff",
  fontHeading: "Fredoka",
  fontBody: "Poppins",
  headerHeightDesktop: "80px",
  headerHeightMobile: "72px",
  particlesDesktop: 42,
  particlesMobile: 22,
  cartFlyDuration: 0.7,
  cartFlyBallSize: 44,
  reducedMotion: false,
};

function ColorField({ label, value, name, onChange }: { label: string; value: string; name: string; onChange: (name: string, value: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="size-10 rounded-lg border shadow-sm overflow-hidden" style={{ backgroundColor: value }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title={label}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <code className="text-xs">{value}</code>
      </div>
    </div>
  );
}

function themeToSnapshot(theme: ThemeState) {
  return {
    colorPrimary: theme.colorPrimary,
    colorPrimaryLight: theme.colorPrimaryLight,
    colorPrimaryIntense: theme.colorPrimaryIntense,
    colorPrimaryText: theme.colorPrimaryText,
    colorBackground: theme.colorBackground,
    colorBackgroundDark: theme.colorBackgroundDark,
    colorBackgroundDeep: theme.colorBackgroundDeep,
    colorTextDark: theme.colorTextDark,
    colorTextMedium: theme.colorTextMedium,
    colorTextLight: theme.colorTextLight,
    colorWhite: theme.colorWhite,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
    headerHeightDesktop: theme.headerHeightDesktop,
    headerHeightMobile: theme.headerHeightMobile,
    particlesDesktop: theme.particlesDesktop,
    particlesMobile: theme.particlesMobile,
    cartFlyDuration: theme.cartFlyDuration,
    cartFlyBallSize: theme.cartFlyBallSize,
    reducedMotion: theme.reducedMotion,
  };
}

/** Live iframe preview of the real landing, fed via postMessage. */
function ThemeIframePreview({ theme }: { theme: ThemeState }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function handle(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "editor:ready") setReady(true);
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "theme:sync", payload: themeToSnapshot(theme) },
      window.location.origin,
    );
  }, [theme, ready]);

  return (
    <div className="overflow-hidden rounded-lg border bg-muted">
      <iframe
        ref={iframeRef}
        src="/admin/editor-preview"
        title="Vista previa de la landing"
        className="h-[520px] w-full"
      />
    </div>
  );
}

export function ThemeEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");

  async function loadTheme() {
    setLoading(true);
    const result = await getBusinessTheme();
    if (!result.error && result.data) {
      const d = result.data;
      setTheme({
        colorPrimary: d.color_primary || DEFAULT_THEME.colorPrimary,
        colorPrimaryLight: d.color_primary_light || DEFAULT_THEME.colorPrimaryLight,
        colorPrimaryIntense: d.color_primary_intense || DEFAULT_THEME.colorPrimaryIntense,
        colorPrimaryText: d.color_primary_text || DEFAULT_THEME.colorPrimaryText,
        colorBackground: d.color_background || DEFAULT_THEME.colorBackground,
        colorBackgroundDark: d.color_background_dark || DEFAULT_THEME.colorBackgroundDark,
        colorBackgroundDeep: d.color_background_deep || DEFAULT_THEME.colorBackgroundDeep,
        colorTextDark: d.color_text_dark || DEFAULT_THEME.colorTextDark,
        colorTextMedium: d.color_text_medium || DEFAULT_THEME.colorTextMedium,
        colorTextLight: d.color_text_light || DEFAULT_THEME.colorTextLight,
        colorWhite: d.color_white || DEFAULT_THEME.colorWhite,
        fontHeading: d.font_heading || DEFAULT_THEME.fontHeading,
        fontBody: d.font_body || DEFAULT_THEME.fontBody,
        headerHeightDesktop: d.header_height_desktop || DEFAULT_THEME.headerHeightDesktop,
        headerHeightMobile: d.header_height_mobile || DEFAULT_THEME.headerHeightMobile,
        particlesDesktop: d.particles_desktop || DEFAULT_THEME.particlesDesktop,
        particlesMobile: d.particles_mobile || DEFAULT_THEME.particlesMobile,
        cartFlyDuration: d.cart_fly_duration ?? DEFAULT_THEME.cartFlyDuration,
        cartFlyBallSize: d.cart_fly_ball_size ?? DEFAULT_THEME.cartFlyBallSize,
        reducedMotion: d.reduced_motion ?? DEFAULT_THEME.reducedMotion,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadTheme);
  }, []);

  const handleColorChange = (name: string, value: string) => {
    setTheme((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (name: keyof ThemeState, value: string) => {
    const numFields: (keyof ThemeState)[] = ["particlesDesktop", "particlesMobile", "cartFlyDuration", "cartFlyBallSize"];
    setTheme((prev) => ({
      ...prev,
      [name]: numFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();

    const dbMapping: Record<string, string> = {
      colorPrimary: "color_primary",
      colorPrimaryLight: "color_primary_light",
      colorPrimaryIntense: "color_primary_intense",
      colorPrimaryText: "color_primary_text",
      colorBackground: "color_background",
      colorBackgroundDark: "color_background_dark",
      colorBackgroundDeep: "color_background_deep",
      colorTextDark: "color_text_dark",
      colorTextMedium: "color_text_medium",
      colorTextLight: "color_text_light",
      colorWhite: "color_white",
      fontHeading: "font_heading",
      fontBody: "font_body",
      fontHeadingWeights: "font_heading_weights",
      fontBodyWeights: "font_body_weights",
      headerHeightDesktop: "header_height_desktop",
      headerHeightMobile: "header_height_mobile",
      particlesDesktop: "particles_desktop",
      particlesMobile: "particles_mobile",
      cartFlyDuration: "cart_fly_duration",
      cartFlyBallSize: "cart_fly_ball_size",
      reducedMotion: "reduced_motion",
    };

    for (const key of Object.keys(theme) as (keyof ThemeState)[]) {
      const dbKey = dbMapping[key] || key;
      formData.set(dbKey, String(theme[key]));
    }

    formData.set("font_heading_weights", "400,500,600,700");
    formData.set("font_body_weights", "300,400,500,600,700");
    const result = await updateBusinessTheme(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tema guardado correctamente");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const SIMPLE_COLORS = [
    { key: "colorPrimary" as const, label: "Color principal" },
    { key: "colorBackground" as const, label: "Fondo" },
    { key: "colorTextDark" as const, label: "Texto" },
  ];
  const ADVANCED_COLORS = [
    { key: "colorPrimaryLight" as const, label: "Principal claro" },
    { key: "colorPrimaryIntense" as const, label: "Principal intenso" },
    { key: "colorPrimaryText" as const, label: "Texto principal" },
    { key: "colorBackgroundDark" as const, label: "Fondo oscuro" },
    { key: "colorBackgroundDeep" as const, label: "Fondo profundo" },
    { key: "colorTextMedium" as const, label: "Texto medio" },
    { key: "colorTextLight" as const, label: "Texto claro" },
    { key: "colorWhite" as const, label: "Blanco" },
  ];

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {(["simple", "advanced"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "simple" ? "Simple" : "Avanzado"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Colores</CardTitle>
              <CardDescription>
                {mode === "simple"
                  ? "Los colores esenciales de tu marca"
                  : "Paleta completa del negocio"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {SIMPLE_COLORS.map(({ key, label }) => (
                  <ColorField
                    key={key}
                    name={key}
                    label={label}
                    value={theme[key]}
                    onChange={handleColorChange}
                  />
                ))}
                {mode === "advanced" &&
                  ADVANCED_COLORS.map(({ key, label }) => (
                    <ColorField
                      key={key}
                      name={key}
                      label={label}
                      value={theme[key]}
                      onChange={handleColorChange}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
              <CardDescription>Fuentes de la landing</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fontHeading">Fuente de Títulos</Label>
                  <Input id="fontHeading" value={theme.fontHeading} onChange={(e) => handleInputChange("fontHeading", e.target.value)} placeholder="Fredoka" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fontBody">Fuente de Texto</Label>
                  <Input id="fontBody" value={theme.fontBody} onChange={(e) => handleInputChange("fontBody", e.target.value)} placeholder="Poppins" />
                </div>
              </div>
            </CardContent>
          </Card>

          {mode === "advanced" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Layout</CardTitle>
                  <CardDescription>Dimensiones del encabezado</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="headerDesktop">Header Desktop</Label>
                    <Input id="headerDesktop" value={theme.headerHeightDesktop} onChange={(e) => handleInputChange("headerHeightDesktop", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="headerMobile">Header Mobile</Label>
                    <Input id="headerMobile" value={theme.headerHeightMobile} onChange={(e) => handleInputChange("headerHeightMobile", e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comportamiento</CardTitle>
                  <CardDescription>Animaciones e interacción</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cartFlyDuration">Duración animación carrito (s)</Label>
                      <Input id="cartFlyDuration" type="number" min={0} max={3} step={0.1} value={theme.cartFlyDuration}
                        onChange={(e) => handleInputChange("cartFlyDuration", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cartFlyBallSize">Tamaño animación carrito (px)</Label>
                      <Input id="cartFlyBallSize" type="number" min={16} max={120} value={theme.cartFlyBallSize}
                        onChange={(e) => handleInputChange("cartFlyBallSize", e.target.value)} />
                    </div>
                  </div>
                  <Label className="min-h-11 cursor-pointer">
                    <Checkbox
                      checked={theme.reducedMotion}
                      onCheckedChange={(c) =>
                        setTheme((prev) => ({ ...prev, reducedMotion: c === true }))
                      }
                    />
                    Reducir animaciones decorativas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    La cantidad de partículas se ajusta en la sección
                    “Partículas”.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Vista previa</CardTitle>
                <CardDescription>Landing real en vivo</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeIframePreview theme={theme} />
              </CardContent>
            </Card>
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Save className="mr-2 size-4" />
              Guardar Tema
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
