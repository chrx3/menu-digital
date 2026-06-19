"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useEditor } from "./EditorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "../ImagePicker";
import { EditPanelSection } from "./EditPanelSection";
import { X, Trash2, Plus, Sparkles, Loader2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/products";
import type { Producto, PreciosSandwich, PreciosSimple } from "@/app/types";

const SANDWICH_MEATS = ["lomito", "churrasco", "mechada"] as const;

function emptySandwichPrecios(): PreciosSandwich {
  return {
    lomito: { individual: 0, promo_2x: null },
    churrasco: { individual: 0, promo_2x: null },
    mechada: { individual: 0, promo_2x: null },
  };
}

export function EditPanelProduct() {
  const {
    state,
    selected,
    updateCategory,
    updateCategoryItem,
    selectElement,
    reloadMenu,
  } = useEditor();

  const [describing, setDescribing] = useState(false);

  if (!selected?.slug) return null;

  const cat = state.menu.find((c) =>
    c.items.some(
      (p) => (p.slug || p.nombre) === selected.slug,
    ),
  );
  const product = cat?.items.find(
    (p) => (p.slug || p.nombre) === selected.slug,
  );
  if (!product || !cat)
    return (
      <p className="text-sm text-muted-foreground">Producto no encontrado</p>
    );

  const currentProduct = product;
  const currentCat = cat;

  const update = (patch: Partial<Producto>) =>
    updateCategoryItem(currentCat.id, currentProduct.nombre, patch);

  const categoryId = currentCat.id;

  const tipoPrecio = currentCat.tipoPrecio || "unico";
  const priceOptions = currentCat.opciones || [];
  const isSandwichCategory = currentCat.id === "sandwiches";
  const simplePrecios = (currentProduct.precios as PreciosSimple) || {};

  const handleDelete = async () => {
    if (!currentProduct.id) {
      toast.error("Este producto aún no está guardado en la base de datos.");
      return;
    }
    if (!window.confirm(`¿Eliminar "${currentProduct.nombre}"?`)) return;
    const result = await deleteProduct(currentProduct.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Producto eliminado");
    selectElement(null);
    await reloadMenu();
  };

  const handleDescribe = async () => {
    const imageUrl = currentProduct.imagen;
    if (!imageUrl) {
      toast.error("Sube o selecciona una imagen primero.");
      return;
    }

    setDescribing(true);
    try {
      // Fetch the image as a blob
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("No se pudo descargar la imagen.");
      const blob = await imgRes.blob();

      const form = new FormData();
      form.set("file", new File([blob], "product.webp", { type: blob.type }));

      const res = await fetch("/api/describe-product", {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error al generar descripción.");
      }

      const data = json.data;
      const patch: Partial<Producto> = {};
      if (data.nombre) patch.nombre = data.nombre;
      if (data.descripcion) patch.detalle = data.descripcion;
      if (data.ingredientes) patch.ingredientes = data.ingredientes;

      update(patch);
      toast.success("Descripción generada con IA ✨");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al generar descripción",
      );
    } finally {
      setDescribing(false);
    }
  };

  function updateCategoryOptions(
    next: { label: string; value: string; orden: number }[],
  ) {
    updateCategory(categoryId, { opciones: next });
  }

  function setVariantPrice(variantValue: string, raw: string) {
    const current = { ...simplePrecios };
    if (!raw.trim()) {
      delete current[variantValue];
    } else {
      current[variantValue] = Number(raw);
    }
    update({
      precios: Object.keys(current).length ? current : undefined,
      precio: undefined,
    });
  }

  function getSandwichPrecios(): PreciosSandwich {
    if (
      currentProduct.precios &&
      typeof currentProduct.precios === "object" &&
      "lomito" in currentProduct.precios
    ) {
      return currentProduct.precios as PreciosSandwich;
    }
    return emptySandwichPrecios();
  }

  function setSandwichMeatPrice(
    meat: (typeof SANDWICH_MEATS)[number],
    field: "individual" | "promo_2x",
    raw: string,
  ) {
    const base = getSandwichPrecios();
    const current = base[meat] || { individual: 0, promo_2x: null };
    const next: PreciosSandwich = {
      ...base,
      [meat]: {
        ...current,
        [field]:
          field === "promo_2x"
            ? raw.trim()
              ? Number(raw)
              : null
            : Number(raw) || 0,
      },
    };
    update({ precios: next, precio: undefined });
  }

  function setPromoPrice(variantValue: string, raw: string) {
    const next = { ...(currentProduct.promociones || {}) };
    if (!raw.trim()) {
      delete next[variantValue];
    } else {
      next[variantValue] = Number(raw);
    }
    update({
      promociones: Object.keys(next).length ? next : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Categoría: <span className="font-medium">{currentCat.titulo}</span>
      </p>

      <EditPanelSection title="Información básica" defaultOpen>
        <div className="flex flex-col gap-2">
          <Label>Nombre</Label>
          <Input
            value={currentProduct.nombre}
            onChange={(e) => update({ nombre: e.target.value })}
          />
        </div>
        <ImagePicker
          value={currentProduct.imagen || ""}
          onChange={(url) => update({ imagen: url })}
          bucket="products"
          label="Imagen"
        />
        {currentProduct.imagen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={describing}
            onClick={handleDescribe}
          >
            {describing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {describing ? "Generando..." : "Descripción con IA"}
          </Button>
        )}
        <Label className="cursor-pointer">
          <Checkbox
            checked={currentProduct.destacado || false}
            onCheckedChange={(checked) =>
              update({ destacado: checked === true })
            }
          />
          Producto destacado
        </Label>
      </EditPanelSection>

      <EditPanelSection title="Precios" defaultOpen>
        {tipoPrecio === "unico" && (
          <>
            <div className="flex flex-col gap-2">
              <Label>Precio único ($)</Label>
              <Input
                type="number"
                value={currentProduct.precio ?? ""}
                onChange={(e) =>
                  update({
                    precio: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    precios: undefined,
                  })
                }
                placeholder="4500"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Para usar variantes (tamaños, proteínas), cambia el tipo de precio
              en la categoría.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() =>
                selectElement({ type: "category", slug: currentCat.id })
              }
            >
              Editar categoría «{currentCat.titulo}»
            </Button>
          </>
        )}

        {tipoPrecio !== "unico" && !isSandwichCategory && (
          <>
            <div className="flex flex-col gap-2">
              <Label>Variantes de la categoría</Label>
              <p className="text-[10px] text-muted-foreground">
                Define las opciones aquí; luego asigna un precio a cada una.
              </p>
              {priceOptions.map((row, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Input
                    value={row.label}
                    onChange={(e) => {
                      const next = [...priceOptions];
                      next[idx] = { ...next[idx], label: e.target.value };
                      updateCategoryOptions(next);
                    }}
                    placeholder="Nombre (Grande)"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => {
                      const next = [...priceOptions];
                      next[idx] = { ...next[idx], value: e.target.value };
                      updateCategoryOptions(next);
                    }}
                    placeholder="valor"
                    className="h-8 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateCategoryOptions(
                        priceOptions.filter((_, i) => i !== idx),
                      )
                    }
                    className="shrink-0 text-destructive"
                    aria-label={`Quitar variante ${idx + 1}`}
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
                  updateCategoryOptions([
                    ...priceOptions,
                    { label: "", value: "", orden: priceOptions.length },
                  ])
                }
              >
                <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
                Agregar variante
              </Button>
            </div>

            {priceOptions.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Label>Precio por variante ($)</Label>
                {priceOptions.map((opt) => (
                  <div key={opt.value || opt.label} className="flex items-center gap-1.5">
                    <span className="w-20 shrink-0 truncate text-xs font-medium">
                      {opt.label || opt.value || "Sin nombre"}
                    </span>
                    <Input
                      type="number"
                      value={simplePrecios[opt.value] ?? ""}
                      className="h-8 text-xs"
                      placeholder="Precio"
                      onChange={(e) => setVariantPrice(opt.value, e.target.value)}
                      disabled={!opt.value}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Agrega al menos una variante arriba para definir precios.
              </p>
            )}

            {tipoPrecio === "proteina" && priceOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Promociones 2x ($ total combo)</Label>
                {priceOptions.map((opt) => (
                  <div key={`promo-${opt.value}`} className="flex items-center gap-1.5">
                    <span className="w-20 shrink-0 truncate text-xs font-medium">
                      {opt.label || opt.value}
                    </span>
                    <Input
                      type="number"
                      value={currentProduct.promociones?.[opt.value] ?? ""}
                      className="h-8 text-xs"
                      placeholder="Opcional"
                      onChange={(e) => setPromoPrice(opt.value, e.target.value)}
                      disabled={!opt.value}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tipoPrecio !== "unico" && isSandwichCategory && (
          <div className="flex flex-col gap-2">
            <Label>Precios por proteína ($)</Label>
            <p className="text-[10px] text-muted-foreground">
              Sándwiches usan lomito, churrasco y mechada. Para otras
              proteínas, edita la categoría.
            </p>
            {SANDWICH_MEATS.map((meat) => {
              const precios = getSandwichPrecios();
              const p = precios[meat];
              return (
                <div key={meat} className="rounded border p-2">
                  <p className="mb-1 text-xs font-medium capitalize">{meat}</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-muted-foreground">
                        Individual
                      </span>
                      <Input
                        type="number"
                        value={p?.individual ?? ""}
                        className="h-8 text-xs"
                        onChange={(e) =>
                          setSandwichMeatPrice(meat, "individual", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-muted-foreground">
                        Promo 2x
                      </span>
                      <Input
                        type="number"
                        value={p?.promo_2x ?? ""}
                        className="h-8 text-xs"
                        onChange={(e) =>
                          setSandwichMeatPrice(meat, "promo_2x", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </EditPanelSection>

      <EditPanelSection
        title="Contenido"
        description="Detalle, ingredientes e incluidos"
        defaultOpen={false}
      >
        <div className="flex flex-col gap-2">
          <Label>Detalle</Label>
          <Input
            value={currentProduct.detalle || ""}
            onChange={(e) => update({ detalle: e.target.value })}
            placeholder="Porción clásica"
          />
        </div>
        <TagField
          label="Incluye"
          tags={currentProduct.incluye || []}
          onChange={(tags) => update({ incluye: tags })}
          placeholder="Agregar incluido…"
        />
        <TagField
          label="Ingredientes"
          tags={currentProduct.ingredientes || []}
          onChange={(tags) => update({ ingredientes: tags })}
          placeholder="Agregar ingrediente…"
          removable
        />
      </EditPanelSection>

      <EditPanelSection title="Estilo del producto" defaultOpen={false}>
        <Label className="cursor-pointer">
          <Checkbox
            checked={currentProduct.tieneEstilo || false}
            onCheckedChange={(checked) =>
              update({ tieneEstilo: checked === true })
            }
          />
          Tiene estilo (ej: Italiano / Completo)
        </Label>
        {currentProduct.tieneEstilo && (
          <>
            <div className="flex flex-col gap-2">
              <Label>Nombre del estilo</Label>
              <Input
                value={currentProduct.estiloNombre || ""}
                onChange={(e) => update({ estiloNombre: e.target.value })}
                placeholder="Estilo del sándwich"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Opciones de estilo</Label>
              {(currentProduct.estiloOpciones || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={opt.label}
                    onChange={(e) => {
                      const next = [...(currentProduct.estiloOpciones || [])];
                      next[i] = { ...next[i], label: e.target.value };
                      update({ estiloOpciones: next });
                    }}
                    placeholder="Label"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={opt.value}
                    onChange={(e) => {
                      const next = [...(currentProduct.estiloOpciones || [])];
                      next[i] = { ...next[i], value: e.target.value };
                      update({ estiloOpciones: next });
                    }}
                    placeholder="Value"
                    className="h-8 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        estiloOpciones: currentProduct.estiloOpciones?.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                    className="shrink-0 text-destructive"
                    aria-label="Quitar opción de estilo"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update({
                    estiloOpciones: [
                      ...(currentProduct.estiloOpciones || []),
                      { label: "", value: "" },
                    ],
                  })
                }
                className="self-start text-xs text-primary"
              >
                + Agregar opción
              </button>
            </div>
          </>
        )}
      </EditPanelSection>

      <Button variant="ghost" size="sm" onClick={handleDelete}>
        <Trash2
          className="mr-1.5 size-3.5 text-destructive"
          aria-hidden="true"
        />
        Eliminar producto
      </Button>
    </div>
  );
}

function TagField({
  label,
  tags,
  onChange,
  placeholder,
  removable = false,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  removable?: boolean;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="mb-1 flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
          >
            {tag}
            {removable && (
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
                className="text-destructive hover:text-destructive/80"
                aria-label={`Quitar ${tag}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
      </div>
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            e.preventDefault();
            onChange([...tags, val.trim()]);
            setVal("");
          }
        }}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  );
}
