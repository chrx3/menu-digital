"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useEditor } from "./EditorContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EditPanelSection } from "./EditPanelSection";
import { AVAILABLE_ICONS } from "@/app/lib/particle-icons";
import { ParticleIconGlyph } from "@/app/components/particles/ParticleIconGlyph";
import { isCustomSvgParticleName } from "@/app/lib/custom-particle-svg";
import { isIconifyParticleName } from "@/app/lib/iconify";

export function EditPanelParticles() {
  const { state, updateParticleIcons, updateTheme } = useEditor();
  const hiddenSet = useMemo(
    () => new Set(state.hiddenBuiltins),
    [state.hiddenBuiltins],
  );
  const visibleBuiltins = useMemo(
    () => AVAILABLE_ICONS.filter(({ name }) => !hiddenSet.has(name)),
    [hiddenSet],
  );

  function toggleIcon(name: string, label: string) {
    if (hiddenSet.has(name)) return;
    const exists = state.particleIcons.find((i) => i.name === name);
    if (exists) {
      updateParticleIcons(state.particleIcons.filter((i) => i.name !== name));
    } else {
      const next = [...state.particleIcons];
      next.push({
        id: "",
        businessId: state.business.id || "",
        name,
        label,
        orden: next.length,
        isActive: true,
      });
      updateParticleIcons(next);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="sm"
        className="w-full"
        render={
          <Link
            href="/admin/particulas"
            aria-label="Gestionar partículas en la página principal"
          />
        }
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        Gestionar partículas
      </Button>

      <EditPanelSection title="Íconos activos" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {visibleBuiltins.map(({ name, label }) => {
            const active = state.particleIcons.some((i) => i.name === name);
            return (
              <Label
                key={name}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <Checkbox
                  checked={active}
                  onCheckedChange={() => toggleIcon(name, label)}
                />
                <ParticleIconGlyph
                  name={name}
                  className="size-4 text-muted-foreground"
                />
                <span className="truncate">{label}</span>
              </Label>
            );
          })}
          {state.particleIcons
            .filter(
              (i) =>
                isIconifyParticleName(i.name) ||
                isCustomSvgParticleName(i.name),
            )
            .map((icon) => (
              <Label
                key={icon.name}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs"
              >
                <Checkbox
                  checked
                  onCheckedChange={() =>
                    updateParticleIcons(
                      state.particleIcons.filter((i) => i.name !== icon.name),
                    )
                  }
                />
                <ParticleIconGlyph
                  name={icon.name}
                  className="size-4 text-muted-foreground"
                />
                <span className="truncate">{icon.label}</span>
              </Label>
            ))}
        </div>
      </EditPanelSection>

      <EditPanelSection title="Cantidad" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Desktop</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={state.theme?.particlesDesktop ?? 20}
              onChange={(e) =>
                updateTheme({ particlesDesktop: Number(e.target.value) })
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Mobile</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={state.theme?.particlesMobile ?? 12}
              onChange={(e) =>
                updateTheme({ particlesMobile: Number(e.target.value) })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </EditPanelSection>
    </div>
  );
}
