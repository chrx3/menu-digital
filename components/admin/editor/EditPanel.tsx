"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useEditor, type SelectedElement } from "./EditorContext";
import { EditPanelNavbar } from "./EditPanelNavbar";
import { EditPanelCategory } from "./EditPanelCategory";
import { EditPanelProduct } from "./EditPanelProduct";
import { EditPanelFooter } from "./EditPanelFooter";
import { EditPanelTheme } from "./EditPanelTheme";
import { EditPanelParticles } from "./EditPanelParticles";
import { EditPanelSearch } from "./EditPanelSearch";
import {
  LayoutPanelTop,
  Search,
  Sparkles,
  FolderOpen,
  UtensilsCrossed,
  FileText,
  Palette,
  X,
  type LucideIcon,
} from "lucide-react";

const LABELS: Record<string, string> = {
  navbar: "Navbar",
  search: "Búsqueda",
  particles: "Partículas",
  category: "Categoría",
  product: "Producto",
  footer: "Footer",
  theme: "Tema",
};

const ICONS: Record<string, LucideIcon> = {
  navbar: LayoutPanelTop,
  search: Search,
  particles: Sparkles,
  category: FolderOpen,
  product: UtensilsCrossed,
  footer: FileText,
  theme: Palette,
};

const GLOBAL_ELEMENTS = [
  "navbar",
  "search",
  "theme",
  "particles",
  "footer",
] as const;

export function EditPanel() {
  const { selected, selectElement, state } = useEditor();
  const [query, setQuery] = useState("");

  // No selection — show overview
  if (!selected) {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredCategories = state.menu.filter((cat) =>
      cat.titulo.toLowerCase().includes(normalizedQuery),
    );
    const filteredProducts = state.menu.flatMap((cat) =>
      cat.items
        .filter((item) => item.nombre.toLowerCase().includes(normalizedQuery))
        .map((item) => ({ cat, item })),
    );

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b px-4 py-3">
          <span className="text-sm font-semibold">Editor Visual</span>
          <p className="mt-1 text-xs text-muted-foreground">
            Haz clic en la landing o elige un elemento abajo.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoría o producto…"
              className="pl-9"
              aria-label="Buscar categoría o producto"
            />
          </div>

          <div className="flex flex-col gap-1">
            {!normalizedQuery && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Elementos globales
                </p>
                {GLOBAL_ELEMENTS.map((type) => {
                  const Icon = ICONS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        selectElement({ type } as SelectedElement)
                      }
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>{LABELS[type]}</span>
                    </button>
                  );
                })}
              </>
            )}
            {filteredCategories.length > 0 && (
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Categorías
              </p>
            )}
            {filteredCategories.map((cat) => {
              const Icon = ICONS.category;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    selectElement({ type: "category", slug: cat.id })
                  }
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <Icon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{cat.titulo}</span>
                </button>
              );
            })}
            {filteredProducts.length > 0 && (
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Productos
              </p>
            )}
            {filteredProducts.map(({ cat, item }) => {
              const Icon = ICONS.product;
              return (
                <button
                  key={`${cat.id}-${item.nombre}`}
                  type="button"
                  onClick={() =>
                    selectElement({ type: "product", slug: item.nombre })
                  }
                  className="ml-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <Icon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.nombre}</span>
                </button>
              );
            })}
            {normalizedQuery &&
              filteredCategories.length === 0 &&
              filteredProducts.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No se encontraron resultados para “{query}”
                </p>
              )}
          </div>
        </div>
      </div>
    );
  }

  const SelectedIcon = ICONS[selected.type];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {SelectedIcon && (
            <SelectedIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <span className="truncate text-sm font-semibold">
            {LABELS[selected.type] ?? selected.type}
          </span>
        </div>
        <button
          type="button"
          onClick={() => selectElement(null)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar panel de edición"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
        {selected.type === "navbar" && <EditPanelNavbar />}
        {selected.type === "category" && <EditPanelCategory />}
        {selected.type === "product" && <EditPanelProduct />}
        {selected.type === "footer" && <EditPanelFooter />}
        {selected.type === "theme" && <EditPanelTheme />}
        {selected.type === "particles" && <EditPanelParticles />}
        {selected.type === "search" && <EditPanelSearch />}
      </div>
    </div>
  );
}
