"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gauge, Loader2, RotateCcw } from "lucide-react";
import {
  getBusinessTheme,
  updateParticleCounts,
} from "@/app/actions/theme";
import { PARTICLE_COUNT_DEFAULTS } from "@/app/lib/particle-icons";
import { useParticlesEditor } from "@/components/admin/particles/ParticlesEditorContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const DESKTOP_MAX = 150;
const MOBILE_MAX = 80;
const AUTO_SAVE_MS = 600;

function CountSlider({
  id,
  label,
  value,
  max,
  recommended,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  recommended: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const pct = Math.round((value / max) * 100);
  const recPct = Math.round((recommended / max) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span className="tabular-nums text-sm font-semibold text-primary">
          {value}
        </span>
      </div>

      <div className="relative">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/80 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-primary/30"
          style={{ left: `${recPct}%` }}
          title={`Recomendado: ${recommended}`}
        />
        <input
          id={id}
          type="range"
          min={0}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Recomendado: <span className="font-medium">{recommended}</span> · Máximo:{" "}
        {max}
      </p>
    </div>
  );
}

export function ParticleCountControls() {
  const {
    desktopCount,
    mobileCount,
    setDesktopCount,
    setMobileCount,
    setSaveStatus,
  } = useParticlesEditor();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<{
    desktop: number;
    mobile: number;
  }>({
    desktop: PARTICLE_COUNT_DEFAULTS.desktop,
    mobile: PARTICLE_COUNT_DEFAULTS.mobile,
  });

  useEffect(() => {
    async function load() {
      const result = await getBusinessTheme();
      if (result.data) {
        const desktop =
          (result.data.particles_desktop as number) ??
          PARTICLE_COUNT_DEFAULTS.desktop;
        const mobile =
          (result.data.particles_mobile as number) ??
          PARTICLE_COUNT_DEFAULTS.mobile;
        setBaseline({ desktop, mobile });
        setDesktopCount(desktop);
        setMobileCount(mobile);
      }
      setLoading(false);
    }
    void load();
  }, [setDesktopCount, setMobileCount]);

  useEffect(() => {
    if (loading) return;

    const unchanged =
      desktopCount === baseline.desktop && mobileCount === baseline.mobile;
    if (unchanged) return;

    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      const result = await updateParticleCounts(desktopCount, mobileCount);
      if (result.error) {
        setSaveStatus("error");
        toast.error(result.error);
        return;
      }
      setBaseline({ desktop: desktopCount, mobile: mobileCount });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, AUTO_SAVE_MS);

    return () => clearTimeout(timer);
  }, [
    desktopCount,
    mobileCount,
    baseline.desktop,
    baseline.mobile,
    loading,
    setSaveStatus,
  ]);

  function applyRecommended() {
    setDesktopCount(PARTICLE_COUNT_DEFAULTS.desktop);
    setMobileCount(PARTICLE_COUNT_DEFAULTS.mobile);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => setOpen(true)}
        className="shrink-0 border-crema-profundo/50 bg-crema/30 hover:border-primary/40 hover:bg-primary/5"
        title="Ajustar densidad de partículas"
        aria-label="Ajustar densidad de partículas"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Gauge className="size-4 text-primary" aria-hidden="true" />
        )}
        Densidad
        {!loading && (
          <span className="tabular-nums text-xs text-muted-foreground">
            {desktopCount} / {mobileCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-crema-profundo/30 bg-crema/20 px-4 py-3">
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="size-4 text-primary" aria-hidden="true" />
              Densidad
            </DialogTitle>
            <DialogDescription>
              Ajusta cuántas partículas aparecen en escritorio y móvil. Los
              cambios se guardan solos y se ven al instante en la vista previa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-4 py-4">
            <div className="grid gap-5 sm:grid-cols-1">
              <CountSlider
                id="particles-desktop"
                label="Escritorio"
                value={desktopCount}
                max={DESKTOP_MAX}
                recommended={PARTICLE_COUNT_DEFAULTS.desktop}
                onChange={setDesktopCount}
                disabled={loading}
              />
              <CountSlider
                id="particles-mobile"
                label="Móvil"
                value={mobileCount}
                max={MOBILE_MAX}
                recommended={PARTICLE_COUNT_DEFAULTS.mobile}
                onChange={setMobileCount}
                disabled={loading}
              />
            </div>

            <div className="border-t border-dashed border-crema-profundo/30 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyRecommended}
                disabled={loading}
              >
                <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" />
                Usar recomendado ({PARTICLE_COUNT_DEFAULTS.desktop} /{" "}
                {PARTICLE_COUNT_DEFAULTS.mobile})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
