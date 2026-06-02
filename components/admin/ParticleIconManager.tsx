"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getParticleIcons,
  saveParticleIcons,
} from "@/app/actions/particle-icons";
import { AVAILABLE_ICONS } from "@/app/lib/particle-icons";
import {
  HotdogIcon,
  FriesIcon,
  BurgerIcon,
  DrumstickIcon,
  PopcornBagIcon,
} from "@/app/components/icons/FoodIcons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Loader2, Sparkles, HelpCircle } from "lucide-react";

const ICON_COMPONENTS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  hotdog: HotdogIcon,
  fries: FriesIcon,
  burger: BurgerIcon,
  drumstick: DrumstickIcon,
  popcorn: PopcornBagIcon,
};

interface ParticleIconRow {
  id?: string;
  name: string;
  label: string;
  orden: number;
  is_active: boolean;
}

export function ParticleIconManager() {
  const [icons, setIcons] = useState<ParticleIconRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    loadIcons();
  }, []);

  async function loadIcons() {
    setLoading(true);
    const result = await getParticleIcons();
    if (result.error) {
      toast.error(result.error);
    } else {
      const active = result.data.filter((i: ParticleIconRow) => i.is_active);
      setIcons(
        AVAILABLE_ICONS.map((avail, idx) => {
          const existing = active.find(
            (i: ParticleIconRow) => i.name === avail.name,
          );
          return existing
            ? { ...existing, is_active: true }
            : {
                name: avail.name,
                label: avail.label,
                orden: idx,
                is_active: false,
              };
        }),
      );
    }
    setLoading(false);
  }

  async function handleSave() {
    const activeIcons = icons
      .filter((i) => i.is_active)
      .map((i, idx) => ({
        name: i.name,
        label: i.label,
        orden: idx,
        is_active: true,
      }));

    startSaving(async () => {
      const result = await saveParticleIcons(activeIcons);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Partículas guardadas");
        await loadIcons();
      }
    });
  }

  function toggleIcon(index: number) {
    setIcons((prev) =>
      prev.map((icon, i) =>
        i === index ? { ...icon, is_active: !icon.is_active } : icon,
      ),
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setIcons((prev) => {
      const next = [...prev];
      const activeItems = next.filter((i) => i.is_active);
      const currentName = next[index].name;
      const currentActive = activeItems.findIndex(
        (i) => i.name === currentName,
      );
      if (currentActive <= 0) return prev;
      // Swap in the active list
      const activeNames = activeItems.map((i) => i.name);
      [activeNames[currentActive - 1], activeNames[currentActive]] = [
        activeNames[currentActive],
        activeNames[currentActive - 1],
      ];
      // Rebuild icons with new order for active items
      return next.map((icon) => {
        if (!icon.is_active) return icon;
        const newOrden = activeNames.indexOf(icon.name);
        return { ...icon, orden: newOrden };
      });
    });
  }

  function moveDown(index: number) {
    setIcons((prev) => {
      const activeItems = prev.filter((i) => i.is_active);
      const currentName = prev[index].name;
      const currentActive = activeItems.findIndex(
        (i) => i.name === currentName,
      );
      if (currentActive < 0 || currentActive >= activeItems.length - 1)
        return prev;
      const activeNames = activeItems.map((i) => i.name);
      [activeNames[currentActive], activeNames[currentActive + 1]] = [
        activeNames[currentActive + 1],
        activeNames[currentActive],
      ];
      return prev.map((icon) => {
        if (!icon.is_active) return icon;
        const newOrden = activeNames.indexOf(icon.name);
        return { ...icon, orden: newOrden };
      });
    });
  }

  function updateLabel(index: number, label: string) {
    setIcons((prev) =>
      prev.map((icon, i) => (i === index ? { ...icon, label } : icon)),
    );
  }

  // Sort: active first by orden, then inactive
  const sorted = [...icons].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    if (a.is_active && b.is_active) return a.orden - b.orden;
    return 0;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Íconos de Partículas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Activa o desactiva los íconos que flotan en el fondo del menú.
          Usa las flechas para cambiar el orden.
        </p>

        <div className="space-y-2">
          {sorted.map((icon) => {
            const IconComp = ICON_COMPONENTS[icon.name];
            const originalIndex = icons.findIndex((i) => i.name === icon.name);
            const isActive = icon.is_active;
            const activeIndex = sorted
              .filter((i) => i.is_active)
              .findIndex((i) => i.name === icon.name);
            const isFirst = activeIndex === 0;
            const isLast =
              activeIndex === sorted.filter((i) => i.is_active).length - 1;

            return (
              <div
                key={icon.name}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isActive
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  {isActive && (
                    <>
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveUp(originalIndex)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Subir"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveDown(originalIndex)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Bajar"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Icon preview */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {IconComp ? (
                    <IconComp className="h-6 w-6" />
                  ) : (
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>

                {/* Label input */}
                <input
                  type="text"
                  value={icon.label}
                  onChange={(e) => updateLabel(originalIndex, e.target.value)}
                  disabled={!isActive}
                  className="h-8 flex-1 rounded-md border bg-background px-2 text-sm disabled:opacity-50"
                />

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleIcon(originalIndex)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary"
                      : "border-input bg-muted"
                  }`}
                  role="switch"
                  aria-checked={isActive}
                  aria-label={`Activar ${icon.label}`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
