"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getParticleIcons,
  saveParticleIcons,
} from "@/app/actions/particle-icons";
import { isCustomSvgParticleName } from "@/app/lib/custom-particle-svg";
import { AVAILABLE_ICONS } from "@/app/lib/particle-icons";
import { isIconifyParticleName } from "@/app/lib/iconify";
import { ParticleIconGallery } from "@/components/admin/ParticleIconGallery";
import { ParticleIconCard } from "@/components/admin/particles/ParticleIconCard";
import { useParticlesEditor } from "@/components/admin/particles/ParticlesEditorContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Sparkles } from "lucide-react";

interface ParticleIconRow {
  id?: string;
  name: string;
  label: string;
  orden: number;
  is_active: boolean;
}

const MAX_ACTIVE = 30;
const AUTO_SAVE_MS = 700;

type Snapshot = {
  icons: ParticleIconRow[];
  deletedBuiltins: string[];
};

type SavePayload = {
  icons: {
    name: string;
    label: string;
    orden: number;
    is_active: boolean;
  }[];
  hiddenBuiltins: string[];
};

function toSnapshotPayload(icons: ParticleIconRow[]): SavePayload["icons"] {
  return icons.map((icon, index) => ({
    name: icon.name,
    label: icon.label,
    orden: icon.orden ?? index,
    is_active: icon.is_active,
  }));
}

function buildSavePayload(
  icons: ParticleIconRow[],
  hiddenBuiltins: Iterable<string>,
): SavePayload {
  return {
    icons: toSnapshotPayload(icons),
    hiddenBuiltins: [...hiddenBuiltins].sort(),
  };
}

export function ParticleIconManager() {
  const { setActiveIconNames, setSaveStatus } = useParticlesEditor();

  const [icons, setIcons] = useState<ParticleIconRow[]>([]);
  const [deletedBuiltins, setDeletedBuiltins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [baselineSnapshot, setBaselineSnapshot] = useState<Snapshot>({
    icons: [],
    deletedBuiltins: [],
  });

  const iconsRef = useRef(icons);
  const deletedBuiltinsRef = useRef(deletedBuiltins);

  useEffect(() => {
    iconsRef.current = icons;
    deletedBuiltinsRef.current = deletedBuiltins;
  });

  const visibleIcons = useMemo(
    () => icons.filter((i) => !deletedBuiltins.has(i.name)),
    [icons, deletedBuiltins],
  );
  const activeIcons = useMemo(
    () =>
      visibleIcons
        .filter((i) => i.is_active)
        .sort((a, b) => a.orden - b.orden),
    [visibleIcons],
  );
  const sortedIcons = useMemo(
    () =>
      [...visibleIcons].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return a.orden - b.orden;
      }),
    [visibleIcons],
  );
  const activeIconNamesKey = useMemo(
    () => activeIcons.map((i) => i.name).join("\0"),
    [activeIcons],
  );
  const existingNames = icons.map((i) => i.name);
  const activeCount = activeIcons.length;

  const savePayloadKey = useMemo(
    () => JSON.stringify(buildSavePayload(visibleIcons, deletedBuiltins)),
    [visibleIcons, deletedBuiltins],
  );

  const baselinePayloadKey = useMemo(
    () =>
      JSON.stringify(
        buildSavePayload(
          baselineSnapshot.icons.filter(
            (icon) => !baselineSnapshot.deletedBuiltins.includes(icon.name),
          ),
          baselineSnapshot.deletedBuiltins,
        ),
      ),
    [baselineSnapshot],
  );

  useEffect(() => {
    setActiveIconNames(
      activeIconNamesKey ? activeIconNamesKey.split("\0") : [],
    );
  }, [activeIconNamesKey, setActiveIconNames]);

  async function loadIcons() {
    setLoading(true);
    const result = await getParticleIcons();
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    const fromDb = result.data as ParticleIconRow[];
    const hiddenBuiltins = result.hiddenBuiltins ?? [];
    const hiddenSet = new Set(hiddenBuiltins);
    const dbByName = new Map(fromDb.map((row) => [row.name, row]));

    const builtinRows = AVAILABLE_ICONS.filter(
      (avail) => !hiddenSet.has(avail.name),
    ).map((avail, idx) => {
      const existing = dbByName.get(avail.name);
      if (existing && !isIconifyParticleName(existing.name)) {
        return { ...existing };
      }
      return {
        name: avail.name,
        label: avail.label,
        orden: idx,
        is_active: false,
      };
    });

    const customRows = fromDb
      .filter(
        (row) =>
          isIconifyParticleName(row.name) ||
          isCustomSvgParticleName(row.name),
      )
      .map((row, idx) => ({
        ...row,
        orden: builtinRows.length + idx,
      }));

    const nextIcons = [...builtinRows, ...customRows];
    const nextHidden = [...hiddenBuiltins];
    setIcons(nextIcons);
    setDeletedBuiltins(new Set(nextHidden));
    setBaselineSnapshot({ icons: nextIcons, deletedBuiltins: nextHidden });
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde servidor
    void loadIcons();
  }, []);

  useEffect(() => {
    if (loading || savePayloadKey === baselinePayloadKey) return;

    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      const payload = JSON.parse(savePayloadKey) as SavePayload;
      const result = await saveParticleIcons(
        payload.icons,
        payload.hiddenBuiltins,
      );
      if (result.error) {
        setSaveStatus("error");
        toast.error(result.error);
        return;
      }
      setBaselineSnapshot({
        icons: iconsRef.current,
        deletedBuiltins: [...deletedBuiltinsRef.current],
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, AUTO_SAVE_MS);

    return () => clearTimeout(timer);
  }, [loading, savePayloadKey, baselinePayloadKey, setSaveStatus]);

  function toggleIcon(index: number) {
    setIcons((prev) => {
      const target = prev[index];
      if (!target.is_active) {
        const activeLen = prev.filter((i) => i.is_active).length;
        if (activeLen >= MAX_ACTIVE) {
          toast.error(`Máximo ${MAX_ACTIVE} íconos activos`);
          return prev;
        }
      }
      return prev.map((icon, i) =>
        i === index ? { ...icon, is_active: !icon.is_active } : icon,
      );
    });
  }

  function updateLabel(index: number, label: string) {
    setIcons((prev) =>
      prev.map((icon, i) => (i === index ? { ...icon, label } : icon)),
    );
  }

  function removeIcon(name: string, label: string) {
    if (!window.confirm(`¿Eliminar "${label}" de tus partículas?`)) {
      return;
    }

    const isBuiltin = AVAILABLE_ICONS.some((a) => a.name === name);
    if (isBuiltin) {
      setDeletedBuiltins((prev) => new Set(prev).add(name));
      setIcons((prev) => prev.filter((i) => i.name !== name));
    } else if (
      isIconifyParticleName(name) ||
      isCustomSvgParticleName(name)
    ) {
      setIcons((prev) => prev.filter((i) => i.name !== name));
    }
  }

  function addFromGallery(payload: { name: string; label: string }) {
    setIcons((prev) => {
      if (prev.some((i) => i.name === payload.name)) {
        toast.message("Ese ícono ya está en la lista");
        return prev;
      }
      const activeLen = prev.filter((i) => i.is_active).length;
      if (activeLen >= MAX_ACTIVE) {
        toast.error(`Máximo ${MAX_ACTIVE} íconos activos`);
        return prev;
      }
      return [
        ...prev,
        {
          name: payload.name,
          label: payload.label,
          orden: prev.length,
          is_active: true,
        },
      ];
    });
  }

  if (loading) {
    return (
      <Card className="border-crema-profundo/40 bg-background/80">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-crema-profundo/40 bg-background/80">
      <CardHeader className="px-4 py-3 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 font-display text-sm">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            Íconos de partículas
          </CardTitle>
          <div className="flex items-center gap-2 rounded-full border bg-crema/50 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Activos</span>
            <span className="text-sm font-bold tabular-nums text-primary">
              {activeCount}
            </span>
            <span className="text-xs text-muted-foreground">/ {MAX_ACTIVE}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-2">
          {sortedIcons.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {activeCount} activos · {sortedIcons.length - activeCount} en gris
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Sin íconos aún</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setLibraryOpen(true)}
            className="shrink-0 border-crema-profundo/50 bg-crema/30 hover:border-primary/40 hover:bg-primary/5"
            title="Añadir ícono desde la biblioteca"
            aria-label="Añadir ícono desde la biblioteca"
          >
            <Plus className="size-4 text-primary" aria-hidden="true" />
          </Button>
        </div>

        {sortedIcons.length > 0 ? (
          <div className="flex flex-col gap-1">
            {sortedIcons.map((icon) => {
              const originalIndex = icons.findIndex(
                (i) => i.name === icon.name,
              );
              return (
                <ParticleIconCard
                  key={icon.name}
                  name={icon.name}
                  label={icon.label}
                  isActive={icon.is_active}
                  isCustom={
                    isIconifyParticleName(icon.name) ||
                    isCustomSvgParticleName(icon.name)
                  }
                  onToggle={() => toggleIcon(originalIndex)}
                  onLabelChange={(label) =>
                    updateLabel(originalIndex, label)
                  }
                  onDelete={() => removeIcon(icon.name, icon.label)}
                />
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="w-full rounded-lg border border-dashed border-crema-profundo/60 bg-crema/30 p-6 text-center transition-colors hover:border-primary/40 hover:bg-crema/50"
          >
            <Sparkles className="mx-auto size-6 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium">Sin íconos</p>
            <p className="text-xs text-muted-foreground">
              Pulsa + para abrir la biblioteca
            </p>
          </button>
        )}
      </CardContent>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-crema-profundo/30 bg-crema/20 px-4 py-3">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Biblioteca de íconos
            </DialogTitle>
            <DialogDescription>
              Sube tu propio SVG o explora miles de íconos gratuitos. Busca por
              tema, categorías y añade a tus partículas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
            <ParticleIconGallery
              onAdd={addFromGallery}
              onRemove={(name) => {
                const icon = icons.find((i) => i.name === name);
                removeIcon(name, icon?.label ?? name);
              }}
              existingNames={existingNames}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
