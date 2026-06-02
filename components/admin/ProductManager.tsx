"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { getCategories } from "@/app/actions/categories";
import { getBusinessConfig } from "@/app/actions/business";
import {
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Settings2,
  X,
  Search,
  Copy,
  Power,
} from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { slugify } from "@/lib/utils";

interface CategoryOption {
  label: string;
  value: string;
  orden: number;
}

interface CategoryData {
  id: string;
  slug: string;
  titulo: string;
  tipo_precio: string;
  opciones_nombre: string;
  category_options: CategoryOption[];
}

interface ProductData {
  id: string;
  category_id: string;
  nombre: string;
  slug: string;
  imagen: string;
  precio_unico: number | null;
  destacado: boolean;
  tiene_estilo: boolean;
  estilo_nombre: string;
  estilo_opciones: { label: string; value: string }[];
  incluye: string[];
  incluye_texto: string;
  orden: number;
  is_active: boolean;
  product_ingredients: { id: string; nombre: string; orden: number }[];
  product_prices: { id: string; option_value: string; precio: number }[];
  promotions: {
    id: string;
    type: string;
    option_value: string;
    precio: number;
  }[];
}

const EMPTY_PRODUCT: ProductData = {
  id: "",
  category_id: "",
  nombre: "",
  slug: "",
  imagen: "",
  precio_unico: null,
  destacado: false,
  tiene_estilo: false,
  estilo_nombre: "Completo ó Italiano",
  estilo_opciones: [
    { label: "Italiano", value: "italiano" },
    { label: "Completo", value: "completo" },
  ],
  incluye: [],
  incluye_texto: "",
  orden: 0,
  is_active: true,
  product_ingredients: [],
  product_prices: [],
  promotions: [],
};

export function ProductManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [editing, setEditing] = useState<ProductData>(EMPTY_PRODUCT);
  const [showForm, setShowForm] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [incluyeInput, setIncluyeInput] = useState("");
  const [newPriceOption, setNewPriceOption] = useState("");
  const [newPriceValue, setNewPriceValue] = useState("");
  const [newPromoOption, setNewPromoOption] = useState("");
  const [newPromoValue, setNewPromoValue] = useState("");
  const [newPromoType, setNewPromoType] = useState("promo_2x");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [locale, setLocale] = useState("es-CL");
  const [currency, setCurrency] = useState("CLP");

  useEffect(() => {
    loadCategories();
    getBusinessConfig().then((res) => {
      if (res.data) {
        if (res.data.locale) setLocale(res.data.locale);
        if (res.data.currency) setCurrency(res.data.currency);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) loadProducts(selectedCategory);
  }, [selectedCategory]);

  async function loadCategories() {
    setLoading(true);
    const result = await getCategories();
    if (result.error) {
      toast.error(result.error);
    }
    setCategories(result.data || []);
    if (result.data && result.data.length > 0 && !selectedCategory) {
      setSelectedCategory(result.data[0].id);
    }
    setLoading(false);
  }

  async function loadProducts(catId: string) {
    setLoading(true);
    const result = await getProductsByCategory(catId);
    setProducts(result.data || []);
    setLoading(false);
  }

  const handleEdit = (prod: ProductData) => {
    setEditing({
      ...prod,
      category_id: selectedCategory || prod.category_id,
      imagen: prod.imagen || "",
      incluye_texto: prod.incluye_texto || "",
      estilo_nombre: prod.estilo_nombre || "",
      incluye: prod.incluye || [],
      estilo_opciones: prod.estilo_opciones || [
        { label: "Italiano", value: "italiano" },
        { label: "Completo", value: "completo" },
      ],
      product_ingredients: prod.product_ingredients || [],
      product_prices: prod.product_prices || [],
      promotions: prod.promotions || [],
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing({
      ...EMPTY_PRODUCT,
      category_id: selectedCategory,
      orden: products.length,
    });
    setShowForm(true);
  };

  const selectedCat = categories.find((c) => c.id === selectedCategory);
  const priceOptions = selectedCat?.category_options || [];

  const addIngredient = () => {
    const name = ingredientInput.trim();
    if (!name) return;
    setEditing((prev) => ({
      ...prev,
      product_ingredients: [
        ...prev.product_ingredients,
        { id: "", nombre: name, orden: prev.product_ingredients.length },
      ],
    }));
    setIngredientInput("");
  };

  const removeIngredient = (idx: number) => {
    setEditing((prev) => ({
      ...prev,
      product_ingredients: prev.product_ingredients.filter((_, i) => i !== idx),
    }));
  };

  const addIncluye = () => {
    const item = incluyeInput.trim();
    if (!item) return;
    setEditing((prev) => ({ ...prev, incluye: [...prev.incluye, item] }));
    setIncluyeInput("");
  };

  const addPrice = () => {
    const opt = newPriceOption || priceOptions[0]?.value || "unico";
    const val = Number(newPriceValue);
    if (!val) return;
    setEditing((prev) => ({
      ...prev,
      product_prices: [
        ...prev.product_prices,
        { id: "", option_value: opt, precio: val },
      ],
    }));
    setNewPriceValue("");
  };

  const removePrice = (idx: number) => {
    setEditing((prev) => ({
      ...prev,
      product_prices: prev.product_prices.filter((_, i) => i !== idx),
    }));
  };

  const addPromo = () => {
    const opt = newPromoOption || priceOptions[0]?.value || "";
    const val = Number(newPromoValue);
    if (!opt || !val) return;
    setEditing((prev) => ({
      ...prev,
      promotions: [
        ...prev.promotions,
        { id: "", type: newPromoType, option_value: opt, precio: val },
      ],
    }));
    setNewPromoOption("");
    setNewPromoValue("");
    setNewPromoType("promo_2x");
  };

  const removePromo = (idx: number) => {
    setEditing((prev) => ({
      ...prev,
      promotions: prev.promotions.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!editing.nombre.trim() || !editing.slug.trim()) {
      toast.error("El nombre y el slug son obligatorios.");
      return;
    }

    if (!selectedCategory) {
      toast.error("Selecciona una categoría válida.");
      return;
    }

    const isEdit = Boolean(editing.id);

    setSaving(true);
    const data = {
      category_id: selectedCategory,
      nombre: editing.nombre,
      slug: editing.slug,
      imagen: editing.imagen,
      precio_unico: editing.precio_unico,
      destacado: editing.destacado,
      tiene_estilo: editing.tiene_estilo,
      estilo_nombre: editing.estilo_nombre,
      estilo_opciones: editing.estilo_opciones,
      incluye: editing.incluye,
      incluye_texto: editing.incluye_texto,
      orden: editing.orden,
      is_active: editing.is_active,
      ingredients: editing.product_ingredients.map((i) => i.nombre),
      prices: editing.product_prices.map((p) => ({
        option_value: p.option_value,
        precio: p.precio,
      })),
      promotions: editing.promotions.map((p) => ({
        type: p.type,
        option_value: p.option_value,
        precio: p.precio,
      })),
    };

    let result;
    if (isEdit) {
      result = await updateProduct(editing.id, data);
    } else {
      result = await createProduct(data);
    }

    if (result.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success(isEdit ? "Producto actualizado" : "Producto creado");
    loadProducts(selectedCategory);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    const result = await deleteProduct(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Producto eliminado");
      loadProducts(selectedCategory);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(price);

  // Auto-slug: keep slug in sync with nombre until the user edits it manually.
  const setNombre = (nombre: string) => {
    setEditing((p) => {
      const autoSlug = !p.slug || p.slug === slugify(p.nombre);
      return { ...p, nombre, slug: autoSlug ? slugify(nombre) : p.slug };
    });
  };

  const handleDuplicate = async (prod: ProductData) => {
    const data = {
      category_id: selectedCategory,
      nombre: `${prod.nombre} (copia)`,
      slug: slugify(`${prod.slug || prod.nombre}_copia`),
      imagen: prod.imagen || "",
      precio_unico: prod.precio_unico,
      destacado: prod.destacado,
      tiene_estilo: prod.tiene_estilo,
      estilo_nombre: prod.estilo_nombre || "",
      estilo_opciones: prod.estilo_opciones || [],
      incluye: prod.incluye || [],
      incluye_texto: prod.incluye_texto || "",
      orden: products.length,
      is_active: prod.is_active,
      ingredients: (prod.product_ingredients || []).map((i) => i.nombre),
      prices: (prod.product_prices || []).map((pp) => ({
        option_value: pp.option_value,
        precio: pp.precio,
      })),
      promotions: (prod.promotions || []).map((pp) => ({
        type: pp.type,
        option_value: pp.option_value,
        precio: pp.precio,
      })),
    };
    const result = await createProduct(data);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Producto duplicado");
      loadProducts(selectedCategory);
    }
  };

  const handleToggleActive = async (prod: ProductData) => {
    const result = await updateProduct(prod.id, {
      category_id: prod.category_id || selectedCategory,
      nombre: prod.nombre,
      slug: prod.slug,
      imagen: prod.imagen || "",
      precio_unico: prod.precio_unico,
      destacado: prod.destacado,
      tiene_estilo: prod.tiene_estilo,
      estilo_nombre: prod.estilo_nombre || "",
      estilo_opciones: prod.estilo_opciones || [],
      incluye: prod.incluye || [],
      incluye_texto: prod.incluye_texto || "",
      orden: prod.orden,
      is_active: !prod.is_active,
      ingredients: (prod.product_ingredients || []).map((i) => i.nombre),
      prices: (prod.product_prices || []).map((pp) => ({
        option_value: pp.option_value,
        precio: pp.precio,
      })),
      promotions: (prod.promotions || []).map((pp) => ({
        type: pp.type,
        option_value: pp.option_value,
        precio: pp.precio,
      })),
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(prod.is_active ? "Producto desactivado" : "Producto activado");
      loadProducts(selectedCategory);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (activeFilter === "active" && !p.is_active) return false;
      if (activeFilter === "inactive" && p.is_active) return false;
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, searchQuery, activeFilter]);

  if (!categories.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 gap-2">
          <p className="text-muted-foreground">
            No hay categorías. Crea una primero.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Select
            value={selectedCategory}
            onValueChange={(v) => v && setSelectedCategory(v)}
          >
            <SelectTrigger size="sm" className="w-48" aria-label="Categoría">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} de {products.length} productos
          </span>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-2 size-4" />
          Nuevo Producto
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar producto…"
            className="pl-9"
            aria-label="Buscar producto"
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(v) =>
            setActiveFilter((v as "all" | "active" | "inactive") || "all")
          }
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && editing.category_id && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing.id ? "Editar Producto" : "Nuevo Producto"}
            </CardTitle>
            <CardDescription>
              {selectedCat?.titulo} — Precios:{" "}
              {selectedCat?.opciones_nombre || "Únicos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Nombre *</Label>
                <Input
                  value={editing.nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Cheddar"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Slug *</Label>
                <Input
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, slug: e.target.value }))
                  }
                  placeholder="cheddar"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <ImagePicker
                  value={editing.imagen || ""}
                  onChange={(url) => setEditing((p) => ({ ...p, imagen: url }))}
                  bucket="products"
                  label="Imagen"
                  placeholder="/products/imagen.webp"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={editing.orden}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, orden: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            {selectedCat?.tipo_precio === "unico" ? (
              <div className="flex flex-col gap-2">
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={editing.precio_unico ?? ""}
                  onChange={(e) =>
                    setEditing((p) => ({
                      ...p,
                      precio_unico: Number(e.target.value) || null,
                    }))
                  }
                  placeholder="4500"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Precios por variante</Label>
                <div className="flex flex-col gap-2">
                  {editing.product_prices.map((pp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <code className="text-xs w-24 text-muted-foreground">
                        {pp.option_value}
                      </code>
                      <code className="text-xs">{formatPrice(pp.precio)}</code>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => removePrice(idx)}
                        aria-label={`Quitar precio ${pp.option_value}`}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={newPriceOption}
                      onValueChange={(v) => setNewPriceOption(v ?? "")}
                    >
                      <SelectTrigger size="sm" aria-label="Variante de precio">
                        <SelectValue placeholder="Elegir variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-32"
                      type="number"
                      value={newPriceValue}
                      onChange={(e) => setNewPriceValue(e.target.value)}
                      placeholder="Precio"
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={addPrice}
                      aria-label="Agregar precio"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Ingredientes</Label>
              <div className="flex flex-wrap gap-1 mb-1">
                {editing.product_ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                  >
                    {ing.nombre}
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="min-h-8 min-w-8 hover:text-destructive"
                      aria-label={`Quitar ingrediente ${ing.nombre}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="Tomate"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addIngredient())
                  }
                />
                <Button
                  size="xs"
                  variant="outline"
                  onClick={addIngredient}
                  aria-label="Agregar ingrediente"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>

            {selectedCat?.tipo_precio === "proteina" && (
              <div className="flex flex-col gap-2">
                <Label>Promociones 2x (precio total del combo)</Label>
                <div className="flex flex-col gap-2">
                  {editing.promotions.map((promo, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <code className="text-xs w-16 text-muted-foreground">
                        {promo.type || "2x1"}
                      </code>
                      <code className="text-xs w-24 text-muted-foreground">
                        {promo.option_value}
                      </code>
                      <code className="text-xs">
                        2x = {formatPrice(promo.precio)}
                      </code>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => removePromo(idx)}
                        aria-label={`Quitar promoción ${promo.option_value}`}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={newPromoType}
                      onValueChange={(v) => setNewPromoType(v || "promo_2x")}
                    >
                      <SelectTrigger size="sm" className="w-28" aria-label="Tipo de promoción">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promo_2x">2x1</SelectItem>
                        <SelectItem value="descuento">Desc %</SelectItem>
                        <SelectItem value="combo">Combo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newPromoOption}
                      onValueChange={(v) => setNewPromoOption(v ?? "")}
                    >
                      <SelectTrigger size="sm" aria-label="Variante de promoción">
                        <SelectValue placeholder="Variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-28"
                      type="number"
                      value={newPromoValue}
                      onChange={(e) => setNewPromoValue(e.target.value)}
                      placeholder="6500"
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={addPromo}
                      aria-label="Agregar promoción"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Incluye (para combos)</Label>
              <div className="flex flex-wrap gap-1 mb-1">
                {editing.incluye.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing((p) => ({
                          ...p,
                          incluye: p.incluye.filter((_, i) => i !== idx),
                        }))
                      }
                      className="min-h-8 min-w-8 hover:text-destructive"
                      aria-label={`Quitar ${item}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={incluyeInput}
                  onChange={(e) => setIncluyeInput(e.target.value)}
                  placeholder="Pollo entero"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addIncluye())
                  }
                />
                <Input
                  value={editing.incluye_texto || ""}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, incluye_texto: e.target.value }))
                  }
                  placeholder="Texto descriptivo"
                />
                <Button
                  size="xs"
                  variant="outline"
                  onClick={addIncluye}
                  aria-label="Agregar contenido del combo"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Label className="cursor-pointer">
                <Checkbox
                  checked={editing.destacado}
                  onCheckedChange={(c) =>
                    setEditing((p) => ({ ...p, destacado: c === true }))
                  }
                />
                Destacado
              </Label>
              <Label className="cursor-pointer">
                <Checkbox
                  checked={editing.tiene_estilo}
                  onCheckedChange={(c) =>
                    setEditing((p) => ({ ...p, tiene_estilo: c === true }))
                  }
                />
                Tiene estilo (Completo/Italiano)
              </Label>
              {editing.id && (
                <Label className="cursor-pointer">
                  <Checkbox
                    checked={editing.is_active}
                    onCheckedChange={(c) =>
                      setEditing((p) => ({ ...p, is_active: c === true }))
                    }
                  />
                  Activo
                </Label>
              )}
            </div>

            {editing.tiene_estilo && (
              <div className="flex flex-col gap-2">
                <Label>Nombre del estilo</Label>
                <Input
                  value={editing.estilo_nombre}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, estilo_nombre: e.target.value }))
                  }
                  placeholder="Completo ó Italiano"
                />
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleSave}
                disabled={saving || !editing.nombre || !editing.slug}
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

      <div className="grid gap-3">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 gap-2">
              <p className="text-muted-foreground">
                {products.length === 0
                  ? "No hay productos en esta categoría"
                  : "Ningún producto coincide con el filtro"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((prod) => (
            <Card key={prod.id} className={prod.is_active ? "" : "opacity-60"}>
              <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {prod.nombre}
                    </span>
                    {prod.destacado && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                        DEST
                      </span>
                    )}
                    {prod.tiene_estilo && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded shrink-0">
                        ESTILO
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prod.product_ingredients?.map((i) => (
                      <code
                        key={i.id || i.nombre}
                        className="text-[10px] text-muted-foreground"
                      >
                        {i.nombre}
                      </code>
                    ))}
                    {prod.product_prices?.map((pp) => (
                      <code
                        key={pp.id || pp.option_value}
                        className="text-[10px] bg-muted px-1 rounded"
                      >
                        {pp.option_value}: {formatPrice(pp.precio)}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleEdit(prod)}
                  >
                    <Settings2 className="size-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDuplicate(prod)}
                    aria-label={`Duplicar ${prod.nombre}`}
                  >
                    <Copy className="size-3" />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleToggleActive(prod)}
                    aria-label={`${prod.is_active ? "Desactivar" : "Activar"} ${prod.nombre}`}
                  >
                    <Power
                      className={`size-3 ${prod.is_active ? "text-emerald-600" : "text-muted-foreground"}`}
                    />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(prod.id, prod.nombre)}
                    aria-label={`Eliminar ${prod.nombre}`}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
