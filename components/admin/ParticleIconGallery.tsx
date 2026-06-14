"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadParticleSvg } from "@/app/actions/particle-icons";
import { MAX_PARTICLE_SVG_BYTES } from "@/app/lib/custom-particle-svg";
import {
  formatIconifyLabel,
  iconifySvgUrl,
  isAllowedIconifyRef,
  parseIconifyRef,
  toIconifyStorageName,
} from "@/app/lib/iconify";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ParticleIconGalleryProps {
  onAdd: (payload: { name: string; label: string }) => void;
  onRemove?: (storageName: string) => void;
  existingNames: string[];
  disabled?: boolean;
}

const GALLERY_CATEGORIES = [
  { id: "comida", label: "Comida", query: "food burger pizza" },
  { id: "bebidas", label: "Bebidas", query: "drink coffee beverage" },
  { id: "decoracion", label: "Decoración", query: "star heart sparkle" },
] as const;

function dedupeSimilarIcons(icons: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const ref of icons) {
    const parsed = parseIconifyRef(ref);
    if (!parsed) continue;
    const stem = parsed.name
      .replace(/\b(filled|outline|regular|sharp|twotone|solid|line)\b/gi, "")
      .replace(/\b\d+\b/g, "")
      .replace(/[-_]/g, "")
      .toLowerCase();
    if (seen.has(stem)) continue;
    seen.add(stem);
    result.push(ref);
  }

  return result;
}

export function ParticleIconGallery({
  onAdd,
  onRemove,
  existingNames,
  disabled,
}: ParticleIconGalleryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSvgFile(file: File) {
    if (disabled || uploading) return;

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) {
      toast.error("Solo se permiten archivos SVG.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_PARTICLE_SVG_BYTES) {
      toast.error("El SVG debe pesar menos de 100 KB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadParticleSvg(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.name || !result.label) {
        toast.error("No se pudo subir el SVG.");
        return;
      }
      if (existingNames.includes(result.name)) {
        toast.message("Ese ícono ya está en la lista");
        return;
      }
      onAdd({ name: result.name, label: result.label });
      toast.success(`"${result.label}" añadido a tus partículas`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleSvgFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleSvgFile(file);
  }

  const searchTerm = useMemo(() => {
    if (query.trim().length >= 2) return query.trim();
    const category = GALLERY_CATEGORIES.find((c) => c.id === activeCategory);
    return category?.query ?? "food";
  }, [query, activeCategory]);

  const canSearch = searchTerm.length >= 2;

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/icons/search?q=${encodeURIComponent(searchTerm)}&limit=32`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          icons?: string[];
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Error al buscar");
          setResults([]);
        } else {
          setResults(dedupeSimilarIcons(data.icons ?? []));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("No se pudo conectar con la biblioteca de íconos");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, canSearch]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !uploading) fileInputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-3 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-crema-profundo/60 bg-crema/30 hover:border-primary/40 hover:bg-crema/50",
          (disabled || uploading) && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="sr-only"
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          aria-label="Subir archivo SVG"
        />
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <Upload className="size-5 text-primary" aria-hidden="true" />
        )}
        <p className="text-sm font-medium">
          {uploading ? "Subiendo SVG…" : "Subir SVG desde tu equipo"}
        </p>
        <p className="text-xs text-muted-foreground">
          Arrastra un archivo o haz clic · máx. 100 KB
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {GALLERY_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              setActiveCategory(
                activeCategory === category.id ? null : category.id,
              );
              setQuery("");
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === category.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setActiveCategory(null);
            }
          }}
          placeholder="Buscar ícono: pizza, café, empanada…"
          className="bg-background pl-9"
          disabled={disabled}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Buscando íconos…
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {canSearch && results.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
          {results.map((ref) => {
            const storageName = toIconifyStorageName(ref);
            const already = existingNames.includes(storageName);
            const label = formatIconifyLabel(ref);

            return (
              <div
                key={ref}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center transition-colors",
                  already
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/80 bg-background hover:border-primary/30 hover:shadow-sm",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconifySvgUrl(ref)}
                  alt=""
                  width={40}
                  height={40}
                  className="size-7 dark:invert"
                />
                <span
                  className="line-clamp-2 min-h-[2rem] w-full text-[11px] leading-tight font-medium"
                  title={label}
                >
                  {label}
                </span>
                {already ? (
                  <button
                    type="button"
                    disabled={disabled}
                    title="Quitar de tus partículas"
                    onClick={() => onRemove?.(storageName)}
                    className="w-full rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40"
                  >
                    Quitar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    title={`Añadir ${label}`}
                    onClick={() => {
                      if (!parseIconifyRef(ref) || !isAllowedIconifyRef(ref))
                        return;
                      onAdd({
                        name: storageName,
                        label,
                      });
                    }}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                    Añadir
                  </button>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {!loading && canSearch && results.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          Sin resultados. Prueba otra palabra o categoría.
        </p>
      )}
    </div>
  );
}
