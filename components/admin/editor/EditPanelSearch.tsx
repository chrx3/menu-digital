"use client";

import { useEditor } from "./EditorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEARCH_KEYS: { key: string; label: string; fallback: string }[] = [
  { key: "search.placeholder", label: "Texto del buscador", fallback: "Buscar en el menú…" },
  { key: "search.searching", label: "Mientras busca", fallback: "Buscando…" },
  { key: "search.resultSingular", label: "1 resultado", fallback: "producto encontrado" },
  { key: "search.resultPlural", label: "Varios resultados", fallback: "productos encontrados" },
  { key: "search.noResults", label: "Sin resultados", fallback: "No se encontraron productos" },
  { key: "search.noResultsHint", label: "Pista sin resultados", fallback: "Intenta con otro término" },
];

export function EditPanelSearch() {
  const { state, updateTranslation } = useEditor();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Edita los textos de la barra de búsqueda.
      </p>
      {SEARCH_KEYS.map(({ key, label, fallback }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label className="text-xs">{label}</Label>
          <Input
            value={state.translations[key] ?? ""}
            onChange={(e) => updateTranslation(key, e.target.value)}
            placeholder={fallback}
          />
        </div>
      ))}
    </div>
  );
}
