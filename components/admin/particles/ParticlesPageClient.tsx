"use client";

import { AutoSaveIndicator } from "@/components/admin/particles/AutoSaveIndicator";
import { ParticleCountControls } from "@/components/admin/particles/ParticleCountControls";
import { ParticlePreviewPanel } from "@/components/admin/particles/ParticlePreviewPanel";
import { ParticlesEditorProvider } from "@/components/admin/particles/ParticlesEditorContext";
import { ParticleIconManager } from "@/components/admin/ParticleIconManager";

const PREVIEW_WIDTH = 280;

export function ParticlesPageClient() {
  return (
    <ParticlesEditorProvider>
      <div style={{ paddingRight: PREVIEW_WIDTH + 12 }}>
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-marron-oscuro">
              Partículas
            </h1>
            <p className="text-sm text-muted-foreground">
              Los cambios se guardan solos. Activa íconos con el switch.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ParticleCountControls />
            <AutoSaveIndicator />
          </div>
        </header>

        <div className="space-y-4">
          <ParticleIconManager />
        </div>
      </div>

      <aside
        className="fixed top-14 right-0 z-20 flex min-h-0 flex-col overflow-hidden border-l bg-crema/30 p-2 shadow-sm"
        style={{ width: PREVIEW_WIDTH, height: "calc(100dvh - 3.5rem)" }}
      >
        <div className="flex min-h-0 h-full flex-1 flex-col">
          <ParticlePreviewPanel />
        </div>
      </aside>
    </ParticlesEditorProvider>
  );
}
