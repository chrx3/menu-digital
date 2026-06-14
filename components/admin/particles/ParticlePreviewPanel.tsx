"use client";

import { useState } from "react";
import { Monitor, Smartphone, Sparkles } from "lucide-react";
import ParticleBackground from "@/app/components/ParticleBackground";
import { useParticlesEditor } from "@/components/admin/particles/ParticlesEditorContext";
import { cn } from "@/lib/utils";

export function ParticlePreviewPanel() {
  const { activeIconNames, desktopCount, mobileCount } = useParticlesEditor();
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const previewCount =
    viewport === "mobile" ? mobileCount : desktopCount;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-crema-profundo/60 bg-gradient-to-b from-crema to-crema-oscuro shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-crema-profundo/40 bg-background/70 px-2 py-1 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="truncate text-xs font-semibold font-display">
            Vista previa
            <span className="font-normal text-muted-foreground">
              {" "}
              · {previewCount} · {activeIconNames.length} íc.
            </span>
          </p>
        </div>
        <div className="flex shrink-0 rounded-md border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              viewport === "desktop"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={viewport === "desktop"}
            aria-label="Vista escritorio"
          >
            <Monitor className="size-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              viewport === "mobile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={viewport === "mobile"}
            aria-label="Vista móvil"
          >
            <Smartphone className="size-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "relative mx-auto min-h-0 w-full flex-1 overflow-hidden rounded-b-xl border-x border-b border-crema-profundo/50 bg-crema shadow-inner transition-all duration-300",
          viewport === "mobile" && "max-w-[220px]",
        )}
        style={{ minHeight: "calc(100dvh - 11rem)" }}
      >
        <ParticleBackground
          desktopCount={desktopCount}
          mobileCount={mobileCount}
          icons={activeIconNames}
          fixed={false}
          forceMobile={viewport === "mobile"}
          preview
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-crema-profundo/30 bg-background/80 px-2 py-1 backdrop-blur-sm">
            <div className="h-1 w-10 rounded-full bg-primary/30" />
            <div className="flex gap-0.5">
              <div className="size-1 rounded-full bg-crema-profundo/60" />
              <div className="size-1 rounded-full bg-crema-profundo/60" />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-0.5 px-2 pt-2 text-center">
            <p className="font-display text-[11px] font-semibold text-marron-oscuro/80">
              Tu menú
            </p>
            <p className="max-w-[10rem] text-[8px] leading-snug text-marron-medio/70">
              Íconos flotando detrás del contenido
            </p>
          </div>

          <div className="mx-2 mt-auto mb-2 h-5 shrink-0 rounded-md bg-primary/20" />
        </div>
      </div>
    </div>
  );
}
