"use client";

import { Trash2 } from "lucide-react";
import { ParticleIconGlyph } from "@/app/components/particles/ParticleIconGlyph";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ParticleIconCardProps {
  name: string;
  label: string;
  isActive: boolean;
  isCustom: boolean;
  onToggle: () => void;
  onLabelChange: (label: string) => void;
  onDelete: () => void;
}

export function ParticleIconCard({
  name,
  label,
  isActive,
  isCustom,
  onToggle,
  onLabelChange,
  onDelete,
}: ParticleIconCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all duration-200",
        isActive
          ? "border-primary/35 bg-primary/[0.04]"
          : "border-transparent bg-muted/30 opacity-55 grayscale hover:opacity-80 hover:grayscale-[0.4]",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          isActive
            ? "bg-background text-primary shadow-sm"
            : "bg-muted/60 text-muted-foreground",
        )}
      >
        <ParticleIconGlyph name={name} className="size-4" />
      </div>

      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        className={cn(
          "min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        aria-label={`Etiqueta de ${label}`}
      />

      {isCustom && (
        <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">
          Custom
        </span>
      )}

      <Switch
        checked={isActive}
        onCheckedChange={() => onToggle()}
        aria-label={isActive ? `Desactivar ${label}` : `Activar ${label}`}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Eliminar ${label}`}
        title="Eliminar"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
