"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getTranslations, upsertTranslation, upsertTranslations, deleteTranslation, seedDefaultTranslations } from "@/app/actions/translations";
import { Loader2, Plus, Trash2, Save, Sparkles, Search } from "lucide-react";

interface TranslationItem {
  id?: string;
  key: string;
  value: string;
}

const GROUP_LABELS: Record<string, string> = {
  search: "Búsqueda",
  product: "Producto",
  cart: "Carrito",
  category: "Categoría",
  footer: "Pie de página",
  hero: "Portada (obsoleto)",
  other: "Otros",
};

const GROUP_ORDER = ["search", "product", "cart", "category", "footer"];

function groupBySection(items: TranslationItem[]): Record<string, TranslationItem[]> {
  const groups: Record<string, TranslationItem[]> = {};
  for (const item of items) {
    const section = item.key.split(".")[0] || "other";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return groups;
}

export function TranslationEditor() {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => {
    loadTranslations();
  }, []);

  async function loadTranslations() {
    setLoading(true);
    const result = await getTranslations();
    setItems(result.data || []);
    setEditing({});
    setLoading(false);
  }

  const pendingChanges = useMemo(
    () =>
      Object.entries(editing).filter(([key, value]) => {
        const original = items.find((i) => i.key === key);
        return original && value !== original.value && value.trim().length > 0;
      }),
    [editing, items],
  );

  const handleSaveAll = async () => {
    if (!pendingChanges.length) return;
    setSavingBatch(true);
    const result = await upsertTranslations(
      pendingChanges.map(([key, value]) => ({ key, value })),
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${pendingChanges.length} cambios guardados`);
      loadTranslations();
    }
    setSavingBatch(false);
  };

  const handleSave = async (key: string) => {
    const value = editing[key];
    if (!value) return;
    const result = await upsertTranslation(key, value);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${key}" guardado`);
      loadTranslations();
    }
  };

  const handleDelete = async (key: string) => {
    const result = await deleteTranslation(key);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${key}" eliminado`);
      loadTranslations();
    }
  };

  const handleAdd = async () => {
    if (!newKey || !newValue) return;
    const result = await upsertTranslation(newKey, newValue);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${newKey}" creado`);
      setNewKey("");
      setNewValue("");
      loadTranslations();
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    const result = await seedDefaultTranslations();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${result.count} traducciones creadas`);
      loadTranslations();
    }
    setSeeding(false);
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.key.toLowerCase().includes(q) ||
        i.value.toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = groupBySection(filteredItems);
  const knownGroups = GROUP_ORDER.filter((g) => grouped[g]);
  const extraGroups = Object.keys(grouped).filter(
    (g) => !GROUP_ORDER.includes(g),
  );
  const sortedGroups = [...knownGroups, ...extraGroups];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Traducciones</h1>
          <p className="text-muted-foreground">Textos de la interfaz ({items.length} entradas)</p>
        </div>
        <div className="flex gap-2">
          {pendingChanges.length > 0 && (
            <Button onClick={handleSaveAll} disabled={savingBatch}>
              {savingBatch ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Guardar {pendingChanges.length} cambios
            </Button>
          )}
          <Button variant="outline" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            Cargar Traducciones Default
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por clave o texto…"
          className="pl-9"
          aria-label="Buscar traducción"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar Traducción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-col gap-1 flex-1">
              <Label htmlFor="newKey">Clave (ej: hero.title)</Label>
              <Input id="newKey" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="hero.title" />
            </div>
            <div className="flex flex-col gap-1 flex-[2]">
              <Label htmlFor="newValue">Valor</Label>
              <Input id="newValue" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Mi Negocio" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} size="icon">
                <span className="sr-only">Agregar traducción</span>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-2">
            <p className="text-muted-foreground">No hay traducciones aún</p>
            <Button variant="outline" onClick={handleSeed} disabled={seeding}>
              Cargar Traducciones Default
            </Button>
          </CardContent>
        </Card>
      )}

      {sortedGroups.map((groupName) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle>{GROUP_LABELS[groupName] ?? groupName}</CardTitle>
            <CardDescription>{grouped[groupName].length} entradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {grouped[groupName].map((item) => (
                <div key={item.key} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex flex-col gap-1 flex-1">
                    <code className="text-xs text-muted-foreground">{item.key}</code>
                    <Input
                      value={editing[item.key] ?? item.value}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-1 pt-5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSave(item.key)}
                      disabled={!editing[item.key] || editing[item.key] === item.value}
                      aria-label={`Guardar ${item.key}`}
                    >
                      <Save className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      if (window.confirm(`¿Eliminar "${item.key}"?`)) handleDelete(item.key);
                    }} aria-label={`Eliminar ${item.key}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
