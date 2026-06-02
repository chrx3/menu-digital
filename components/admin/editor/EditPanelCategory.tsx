"use client";

import { toast } from "sonner";
import { useEditor } from "./EditorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePicker } from "../ImagePicker";
import { EditPanelSection } from "./EditPanelSection";
import { Trash2, X, Plus } from "lucide-react";
import { deleteCategory } from "@/app/actions/categories";

export function EditPanelCategory() {
  const { state, selected, updateCategory, selectElement, reloadMenu } =
    useEditor();
  if (!selected?.slug) return null;

  const cat = state.menu.find((c) => c.id === selected.slug);
  if (!cat)
    return (
      <p className="text-sm text-muted-foreground">Categoría no encontrada</p>
    );

  const update = (patch: Parameters<typeof updateCategory>[1]) =>
    updateCategory(cat.id, patch);

  const handleDelete = async () => {
    if (!cat.dbId) {
      toast.error("Esta categoría aún no está guardada en la base de datos.");
      return;
    }
    if (
      !window.confirm(`¿Eliminar "${cat.titulo}" y todos sus productos?`)
    )
      return;
    const result = await deleteCategory(cat.dbId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Categoría eliminada");
    selectElement(null);
    await reloadMenu();
  };

  const optionRows = cat.opciones || [];

  return (
    <div className="flex flex-col gap-3">
      <EditPanelSection title="Información básica" defaultOpen>
        <div className="flex flex-col gap-2">
          <Label>Título</Label>
          <Input
            value={cat.titulo}
            onChange={(e) => update({ titulo: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Descripción</Label>
          <Input
            value={cat.descripcion}
            onChange={(e) => update({ descripcion: e.target.value })}
          />
        </div>
        <ImagePicker
          value={cat.imagen || ""}
          onChange={(url) => update({ imagen: url })}
          bucket="products"
          label="Imagen"
        />
        <Label className="cursor-pointer">
          <Checkbox
            checked={cat.destacado || false}
            onCheckedChange={(checked) =>
              update({ destacado: checked === true })
            }
          />
          Categoría destacada
        </Label>
      </EditPanelSection>

      <EditPanelSection
        title="Precios y variantes"
        description="Tipo de precio y opciones visibles en el menú"
        defaultOpen={cat.tipoPrecio !== "unico"}
      >
        <div className="flex flex-col gap-2">
          <Label>Tipo de precio</Label>
          <Select
            value={cat.tipoPrecio || "unico"}
            onValueChange={(v) =>
              update({ tipoPrecio: v || "unico" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unico">Único</SelectItem>
              <SelectItem value="tamano">Por tamaño</SelectItem>
              <SelectItem value="proteina">Por proteína</SelectItem>
            </SelectContent>
          </Select>
          {(cat.tipoPrecio || "unico") === "unico" && (
            <p className="text-[10px] text-muted-foreground">
              Elige «Por tamaño» o «Por proteína» para habilitar variantes
              (Chica/Grande, Pollo/Lomito, etc.).
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Nombre de opciones</Label>
          <Input
            value={cat.opcionesNombre || ""}
            onChange={(e) => update({ opcionesNombre: e.target.value })}
            placeholder="Tamaño / Proteína"
          />
        </div>
        {cat.tipoPrecio !== "unico" && (
          <div className="flex flex-col gap-2">
            <Label>Variantes</Label>
            <p className="text-[10px] text-muted-foreground">
              Nombre visible y valor interno (sin espacios).
            </p>
            {optionRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  value={row.label}
                  onChange={(e) => {
                    const next = [...optionRows];
                    next[idx] = { ...next[idx], label: e.target.value };
                    update({ opciones: next });
                  }}
                  placeholder="Grande"
                  className="h-8 text-xs"
                />
                <Input
                  value={row.value}
                  onChange={(e) => {
                    const next = [...optionRows];
                    next[idx] = { ...next[idx], value: e.target.value };
                    update({ opciones: next });
                  }}
                  placeholder="grande"
                  className="h-8 text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    update({
                      opciones: optionRows.filter((_, i) => i !== idx),
                    })
                  }
                  className="shrink-0 text-destructive"
                  aria-label={`Quitar opción ${idx + 1}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() =>
                update({
                  opciones: [
                    ...optionRows,
                    { label: "", value: "", orden: optionRows.length },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
              Agregar variante
            </Button>
          </div>
        )}
      </EditPanelSection>

      <EditPanelSection
        title="WhatsApp y sistema"
        description="Etiqueta en pedidos e identificador interno"
        defaultOpen={false}
      >
        <div className="flex flex-col gap-2">
          <Label>Etiqueta WhatsApp</Label>
          <Input
            value={cat.etiquetaWhatsApp || ""}
            onChange={(e) => update({ etiquetaWhatsApp: e.target.value })}
            placeholder="Papa Suprema"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Slug (solo lectura)</Label>
          <Input
            value={cat.id}
            disabled
            className="text-xs text-muted-foreground"
          />
        </div>
      </EditPanelSection>

      <Button variant="ghost" size="sm" onClick={handleDelete}>
        <Trash2
          className="mr-1.5 size-3.5 text-destructive"
          aria-hidden="true"
        />
        Eliminar categoría
      </Button>
    </div>
  );
}
