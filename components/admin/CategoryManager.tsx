"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  saveCategoryOptions,
} from "@/app/actions/categories";
import { Loader2, Plus, Trash2, Save, Settings2, X } from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { slugify } from "@/lib/utils";

interface OptionRow {
  label: string;
  value: string;
}

interface CategoryOption {
  label: string;
  value: string;
  orden: number;
}

interface CategoryData {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  tipo_precio: "unico" | "tamano" | "proteina";
  opciones_nombre: string;
  etiqueta_whatsapp: string;
  orden: number;
  destacado: boolean;
  is_active: boolean;
  category_options: CategoryOption[];
}

const EMPTY_CATEGORY: CategoryData = {
  id: "",
  slug: "",
  titulo: "",
  descripcion: "",
  imagen: "",
  tipo_precio: "unico",
  opciones_nombre: "",
  etiqueta_whatsapp: "",
  orden: 0,
  destacado: false,
  is_active: true,
  category_options: [],
};

export function CategoryManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [editing, setEditing] = useState<CategoryData>(EMPTY_CATEGORY);
  const [showForm, setShowForm] = useState(false);
  const [optionRows, setOptionRows] = useState<OptionRow[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    const result = await getCategories();
    if (result.error) {
      toast.error(result.error);
    }
    setCategories(result.data || []);
    setLoading(false);
  }

  const handleEdit = (cat: CategoryData) => {
    setEditing({
      ...cat,
      descripcion: cat.descripcion ?? "",
      imagen: cat.imagen ?? "",
      opciones_nombre: cat.opciones_nombre ?? "",
      etiqueta_whatsapp: cat.etiqueta_whatsapp ?? "",
      orden: cat.orden ?? 0,
    });
    setOptionRows(
      cat.category_options.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    );
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing({
      ...EMPTY_CATEGORY,
      orden: categories.length,
    });
    setOptionRows([]);
    setShowForm(true);
  };

  // Auto-slug: keep slug in sync with título until manually edited.
  const setTitulo = (titulo: string) => {
    setEditing((prev) => {
      const autoSlug = !prev.slug || prev.slug === slugify(prev.titulo);
      return { ...prev, titulo, slug: autoSlug ? slugify(titulo) : prev.slug };
    });
  };

  const handleSave = async () => {
    if (!editing.titulo.trim() || !editing.slug.trim()) {
      toast.error("El título y el slug son obligatorios.");
      return;
    }

    const isEdit = Boolean(editing.id);

    setSaving(true);
    const data = {
      slug: editing.slug,
      titulo: editing.titulo,
      descripcion: editing.descripcion,
      imagen: editing.imagen,
      tipo_precio: editing.tipo_precio,
      opciones_nombre: editing.opciones_nombre,
      etiqueta_whatsapp: editing.etiqueta_whatsapp,
      orden: editing.orden,
      destacado: editing.destacado,
      is_active: editing.is_active,
    };

    let result;
    if (isEdit) {
      result = await updateCategory(editing.id, data);
    } else {
      result = await createCategory(data);
    }

    if (result.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    const categoryId = isEdit
      ? editing.id
      : "id" in result && typeof result.id === "string"
        ? result.id
        : undefined;
    const options = optionRows
      .filter((row) => row.label.trim() && row.value.trim())
      .map((row, orden) => ({
        label: row.label.trim(),
        value: slugify(row.value),
        orden,
      }));
    if (categoryId) {
      const optionsResult = await saveCategoryOptions(categoryId, options);
      if (optionsResult.error) {
        toast.error(optionsResult.error);
        setSaving(false);
        return;
      }
    }
    toast.success(isEdit ? "Categoría actualizada" : "Categoría creada");
    loadCategories();
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Categoría eliminada");
      loadCategories();
    }
  };

  const updateEditing = (
    field: keyof CategoryData,
    value: string | boolean | number,
  ) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

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
          <h2 className="text-lg font-semibold">
            Categorías ({categories.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las secciones del menú
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-2 size-4" />
          Nueva Categoría
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing.id ? "Editar Categoría" : "Nueva Categoría"}
            </CardTitle>
            <CardDescription>
              Configura los detalles de la categoría
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <ImagePicker
                  value={editing.imagen || ""}
                  onChange={(url) => updateEditing("imagen", url)}
                  bucket="products"
                  label="Imagen"
                  placeholder="/products/categoria.webp"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="catTitulo">Título *</Label>
                <Input
                  id="catTitulo"
                  value={editing.titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Papas Supremas"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="catSlug">Slug *</Label>
                <Input
                  id="catSlug"
                  value={editing.slug}
                  onChange={(e) => updateEditing("slug", e.target.value)}
                  placeholder="papas_supremas"
                />
              </div>
            </div>
            {editing.tipo_precio !== "unico" && (
              <div className="flex flex-col gap-2">
                <Label>Opciones / variantes</Label>
                <p className="text-xs text-muted-foreground">
                  Nombre visible y su valor interno (sin espacios). Ej: “Tamaño
                  Grande” → grande.
                </p>
                <div className="flex flex-col gap-2">
                  {optionRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={row.label}
                        onChange={(e) =>
                          setOptionRows((rows) =>
                            rows.map((r, i) =>
                              i === idx ? { ...r, label: e.target.value } : r,
                            ),
                          )
                        }
                        placeholder="Nombre (Grande)"
                        aria-label={`Nombre de la opción ${idx + 1}`}
                      />
                      <Input
                        value={row.value}
                        onChange={(e) =>
                          setOptionRows((rows) =>
                            rows.map((r, i) =>
                              i === idx ? { ...r, value: e.target.value } : r,
                            ),
                          )
                        }
                        placeholder="valor (grande)"
                        aria-label={`Valor de la opción ${idx + 1}`}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setOptionRows((rows) =>
                            rows.filter((_, i) => i !== idx),
                          )
                        }
                        aria-label={`Quitar opción ${idx + 1}`}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    onClick={() =>
                      setOptionRows((rows) => [...rows, { label: "", value: "" }])
                    }
                  >
                    <Plus className="mr-1.5 size-3.5" />
                    Agregar opción
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="catDesc">Descripción</Label>
              <Input
                id="catDesc"
                value={editing.descripcion}
                onChange={(e) => updateEditing("descripcion", e.target.value)}
                placeholder="Base de papas fritas y carne"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Tipo de Precio</Label>
                <Select
                  value={editing.tipo_precio}
                  onValueChange={(v) =>
                    updateEditing("tipo_precio", v || "unico")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="tamano">Por Tamaño</SelectItem>
                    <SelectItem value="proteina">Por Proteína</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="opcionesNombre">Nombre de Opciones</Label>
                <Input
                  id="opcionesNombre"
                  value={editing.opciones_nombre}
                  onChange={(e) =>
                    updateEditing("opciones_nombre", e.target.value)
                  }
                  placeholder="Tamaño / Proteína"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsappLabel">Etiqueta WhatsApp</Label>
                <Input
                  id="whatsappLabel"
                  value={editing.etiqueta_whatsapp}
                  onChange={(e) =>
                    updateEditing("etiqueta_whatsapp", e.target.value)
                  }
                  placeholder="Papa Suprema"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  value={editing.orden ?? 0}
                  onChange={(e) =>
                    updateEditing("orden", Number(e.target.value))
                  }
                />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <Label className="cursor-pointer">
                  <Checkbox
                    checked={editing.destacado}
                    onCheckedChange={(c) => updateEditing("destacado", c === true)}
                  />
                  Destacado
                </Label>
                {editing.id && (
                  <Label className="cursor-pointer">
                    <Checkbox
                      checked={editing.is_active}
                      onCheckedChange={(c) =>
                        updateEditing("is_active", c === true)
                      }
                    />
                    Activo
                  </Label>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleSave}
                disabled={saving || !editing.titulo || !editing.slug}
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Save className="mr-2 size-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className={cat.is_active ? "" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{cat.titulo}</CardTitle>
                  <CardDescription className="text-xs">
                    {cat.slug}
                  </CardDescription>
                </div>
                {cat.destacado && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    DESTACADO
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                {cat.descripcion}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                  {cat.tipo_precio}
                </code>
                {cat.opciones_nombre && (
                  <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                    {cat.opciones_nombre}
                  </code>
                )}
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                  orden: {cat.orden}
                </code>
              </div>
              <div className="flex gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleEdit(cat)}
                >
                  <Settings2 className="size-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${cat.titulo}"?`))
                      handleDelete(cat.id);
                  }}
                  aria-label={`Eliminar ${cat.titulo}`}
                >
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
