"use client";

import { useEditor } from "./EditorContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EditPanelSection } from "./EditPanelSection";
import { AVAILABLE_ICONS } from "@/app/lib/particle-icons";
import {
  HotdogIcon,
  FriesIcon,
  BurgerIcon,
  DrumstickIcon,
  PopcornBagIcon,
} from "@/app/components/icons/FoodIcons";

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

export function EditPanelParticles() {
  const { state, updateParticleIcons, updateTheme } = useEditor();

  function toggleIcon(name: string, label: string) {
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
      <EditPanelSection title="Íconos activos" defaultOpen>
        {AVAILABLE_ICONS.map(({ name, label }) => {
          const active = state.particleIcons.some((i) => i.name === name);
          const Icon = ICON_COMPONENTS[name];
          return (
            <Label
              key={name}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30"
              }`}
            >
              <Checkbox
                checked={active}
                onCheckedChange={() => toggleIcon(name, label)}
              />
              {Icon && <Icon className="size-5 text-muted-foreground" />}
              <span>{label}</span>
            </Label>
          );
        })}
      </EditPanelSection>

      <EditPanelSection title="Cantidad" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Desktop</Label>
            <Input
              type="number"
              min={0}
              value={state.theme?.particlesDesktop ?? 42}
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
              value={state.theme?.particlesMobile ?? 22}
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
