"use client";

import { Check, Loader2 } from "lucide-react";
import { useParticlesEditor } from "@/components/admin/particles/ParticlesEditorContext";
import { cn } from "@/lib/utils";

export function AutoSaveIndicator() {
  const { saveStatus } = useParticlesEditor();

  if (saveStatus === "idle") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        saveStatus === "saving" && "bg-muted text-muted-foreground",
        saveStatus === "saved" && "bg-emerald-50 text-emerald-700",
        saveStatus === "error" && "bg-destructive/10 text-destructive",
      )}
    >
      {saveStatus === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          Guardando…
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <Check className="size-3" aria-hidden="true" />
          Guardado
        </>
      )}
      {saveStatus === "error" && "Error al guardar"}
    </span>
  );
}
