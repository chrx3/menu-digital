"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCart, Tag, Check } from "lucide-react";
import {
  Producto,
  Categoria,
  getVariantes,
  getPrecio,
  getPromo2x,
} from "../types";
// asset-map is only used as a local fallback during development;
// in production, images come from Supabase (producto.imagen field).
import { getSlideSrcForProduct } from "../data/asset-map";
import CardFloatingImage from "./CardFloatingImage";
import {
  SANDWICH_ESTILO_OPTIONS,
  type SandwichEstilo,
  buildSandwichCartVariante,
  isSandwichEstiloCombo,
} from "../lib/sandwich-options";

interface ProductCardProps {
  producto: Producto;
  categoria: Categoria;
  onAddToCart: (item: {
    categoriaId: string;
    categoriaTitulo: string;
    productoNombre: string;
    variante: string;
    precio: number;
    promo2x: number | null;
  }) => void;
  onUpdateQuantity: (id: string, cantidad: number) => void;
  getItemId: (
    categoriaId: string,
    productoNombre: string,
    variante: string,
  ) => string | undefined;
  getItemQuantity: (
    categoriaId: string,
    productoNombre: string,
    variante: string,
  ) => number;
  flyToCart: (payload: { fromRect: DOMRect }) => void;
  index: number;
  translations: Record<string, string>;
  /** Editor mode — called when product card is clicked */
  onSelectProduct?: (productSlug: string) => void;
  selected?: boolean;
}

export default function ProductCard({
  producto,
  categoria,
  onAddToCart,
  onUpdateQuantity,
  getItemId,
  getItemQuantity,
  flyToCart,
  index,
  translations,
  onSelectProduct,
  selected,
}: ProductCardProps) {
  const t = (key: string, fallback: string) => translations[key] || fallback;
  const isSandwich = categoria.id === "sandwiches";
  const isEstiloCombo = isSandwichEstiloCombo(producto, categoria.id);
  const estiloOpciones = producto.estiloOpciones?.length
    ? producto.estiloOpciones
    : SANDWICH_ESTILO_OPTIONS;
  const variantes = getVariantes(producto, categoria.id, categoria.opciones);
  const carneOpciones = isSandwich ? variantes : [];

  const [selectedVariante, setSelectedVariante] = useState(
    variantes[0]?.value || "",
  );
  const [selectedEstilo, setSelectedEstilo] =
    useState<SandwichEstilo>("completo");
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const carneValue = selectedVariante;
  const precioActual = getPrecio(producto, carneValue);
  const promo2x = getPromo2x(producto, carneValue, categoria.id);

  const opcionesCarne = isSandwich ? carneOpciones : variantes;
  const carneLabel =
    opcionesCarne.find((v) => v.value === carneValue)?.label || carneValue;

  const varianteLabel = buildSandwichCartVariante(
    producto,
    categoria.id,
    isEstiloCombo ? selectedEstilo : null,
    carneLabel,
  );
  const itemId = getItemId(categoria.id, producto.nombre, varianteLabel);
  const quantity = getItemQuantity(
    categoria.id,
    producto.nombre,
    varianteLabel,
  );
  const isInCart = quantity > 0;

  const handleAddToCart = () => {
    if (!selectedVariante) return;

    // Trigger fly animation from button to cart
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      flyToCart({ fromRect: rect });
    }

    // Add to cart
    onAddToCart({
      categoriaId: categoria.id,
      categoriaTitulo: categoria.titulo,
      productoNombre: producto.nombre,
      variante: varianteLabel,
      precio: precioActual,
      promo2x: promo2x,
    });

    // Show success state briefly
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
  };

  const handleQuantityChange = (delta: number) => {
    if (!itemId) return;
    onUpdateQuantity(itemId, quantity + delta);
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString("es-CL")}`;
  };

  const imageSrc =
    producto.imagen || getSlideSrcForProduct(categoria.id, producto.nombre);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={
        onSelectProduct
          ? (e: React.MouseEvent) => {
              e.stopPropagation();
              onSelectProduct(producto.slug || producto.nombre);
            }
          : undefined
      }
      className={`group relative h-full ${onSelectProduct ? "cursor-pointer" : ""} ${selected ? "ring-2 ring-primary bg-primary/5 rounded-lg" : ""}`}
    >
      <motion.div
        className="relative flex h-full min-h-[17.5rem] flex-col bg-crema/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-marron-oscuro/10 hover:border-naranja-mc/40 transition-[box-shadow,border-color,transform] duration-300"
        animate={{
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered
            ? "0 20px 40px rgba(245, 130, 31, 0.12)"
            : "0 4px 6px rgba(0, 0, 0, 0.05)",
        }}
        transition={{ duration: 0.3 }}
      >
        {imageSrc && <CardFloatingImage src={imageSrc} alt={producto.nombre} />}

        <div className="relative z-10 flex flex-1 flex-col p-5">
          {/* Título + ingredientes en columna */}
          <div className="mb-3 shrink-0 pr-[6.75rem] sm:pr-32 lg:pr-36">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-naranja-texto mb-0.5 leading-none">
              {categoria.titulo}
            </p>
            <h3
              className="text-lg font-bold text-[#3D1F00] group-hover:text-[#F5821F] transition-colors duration-300 leading-snug"
              style={{
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
              }}
            >
              {producto.nombre}
            </h3>
            {producto.ingredientes && producto.ingredientes.length > 0 ? (
              <ul className="mt-1.5 list-disc pl-4 flex flex-col gap-0.5 text-[10px] sm:text-[11px] text-marron-oscuro/55 leading-snug marker:text-naranja-mc/70">
                {producto.ingredientes.map((ingrediente) => (
                  <li key={ingrediente} className="pl-0.5">
                    {ingrediente}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-1.5 min-h-[2.5rem]" aria-hidden />
            )}
          </div>

          <div className="flex flex-1 flex-col">
            {/* Incluye tags */}
            {producto.incluye && producto.incluye.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-naranja-texto/90 font-medium mb-1.5">
                  {t("product.includes", "Incluye:")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {producto.incluye.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 bg-[#F5821F]/10 text-naranja-texto text-xs rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle */}
            {producto.detalle && (
              <p className="text-sm text-[#3D1F00]/50 mb-4">
                {producto.detalle}
              </p>
            )}

            {/* Sándwich: estilo Completo o Italiano (solo ítem combinado) */}
            {isEstiloCombo && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-[#3D1F00]/40 font-semibold mb-2">
                  {t(
                    "product.sandwichStyle",
                    producto.estiloNombre || "Estilo del sándwich",
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {estiloOpciones.map((opcion) => (
                    <motion.button
                      key={opcion.value}
                      type="button"
                      onClick={() =>
                        setSelectedEstilo(opcion.value as SandwichEstilo)
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                      px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                      ${
                        selectedEstilo === opcion.value
                          ? "bg-[#F5821F] text-white shadow-md shadow-[#F5821F]/25"
                          : "bg-[#3D1F00]/5 text-[#3D1F00]/60 hover:text-[#3D1F00] hover:bg-[#3D1F00]/10 border border-[#3D1F00]/10"
                      }
                    `}
                    >
                      {opcion.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Sándwiches: tipo de carne */}
            {isSandwich && carneOpciones.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-[#3D1F00]/40 font-semibold mb-2">
                  {t(
                    "product.meatType",
                    categoria.opcionesNombre || "Tipo de carne",
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {carneOpciones.map((variante) => (
                    <motion.button
                      key={variante.value}
                      type="button"
                      onClick={() => setSelectedVariante(variante.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                      px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                      ${
                        selectedVariante === variante.value
                          ? "bg-[#F5821F] text-white shadow-md shadow-[#F5821F]/25"
                          : "bg-[#3D1F00]/5 text-[#3D1F00]/60 hover:text-[#3D1F00] hover:bg-[#3D1F00]/10 border border-[#3D1F00]/10"
                      }
                    `}
                    >
                      {variante.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Otras categorías: tamaño, proteína, etc. */}
            {!isSandwich && variantes.length > 1 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-[#3D1F00]/40 font-semibold mb-2">
                  {t(
                    "product.chooseOption",
                    categoria.opcionesNombre || "Elige tu opción",
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variantes.map((variante) => (
                    <motion.button
                      key={variante.value}
                      type="button"
                      onClick={() => setSelectedVariante(variante.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                      px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                      ${
                        selectedVariante === variante.value
                          ? "bg-[#F5821F] text-white shadow-md shadow-[#F5821F]/25"
                          : "bg-[#3D1F00]/5 text-[#3D1F00]/60 hover:text-[#3D1F00] hover:bg-[#3D1F00]/10 border border-[#3D1F00]/10"
                      }
                    `}
                    >
                      {variante.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Promo 2x */}
            {promo2x && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-2 bg-[#F5821F]/8 rounded-lg border border-[#F5821F]/20"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-naranja-texto" />
                  <span className="text-naranja-texto text-xs font-bold">
                    {t("product.promo2x", "Promo 2x:")} {formatPrice(promo2x)}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Price and Action */}
          <div className="mt-auto flex shrink-0 items-center justify-between gap-3 pt-3">
            <div>
              <span
                className="text-xl font-bold text-naranja-texto"
                style={{
                  fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                }}
              >
                {formatPrice(precioActual)}
              </span>
            </div>

            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {isInCart ? (
                  <motion.div
                    key="quantity-controls"
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    className="flex items-center bg-[#F5821F]/10 rounded-xl overflow-hidden"
                  >
                    <motion.button
                      onClick={() => handleQuantityChange(-1)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 text-[#3D1F00]/60 hover:text-[#3D1F00] transition-colors"
                      aria-label={`Quitar una unidad de ${producto.nombre}`}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.3, color: "#994500" }}
                      animate={{ scale: 1, color: "#3D1F00" }}
                      className="px-2 text-[#3D1F00] font-bold min-w-[1.5rem] text-center text-sm"
                    >
                      {quantity}
                    </motion.span>
                    <motion.button
                      onClick={() => handleQuantityChange(1)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 text-[#3D1F00]/60 hover:text-[#3D1F00] transition-colors"
                      aria-label={`Agregar una unidad de ${producto.nombre}`}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="add-button"
                    ref={buttonRef}
                    onClick={handleAddToCart}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-11 h-11 flex items-center justify-center bg-[#F5821F] text-white rounded-full shadow-lg shadow-[#F5821F]/30 disabled:opacity-70"
                    aria-label={`Agregar ${producto.nombre} al carrito`}
                  >
                    <AnimatePresence mode="wait">
                      {showSuccess ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="flex items-center justify-center"
                        >
                          <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 15,
                            }}
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="add"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative w-full h-full flex items-center justify-center"
                        >
                          <ShoppingCart className="w-5 h-5 relative z-10" />
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#3D1F00] rounded-full flex items-center justify-center border-2 border-[#F5821F] z-20">
                            <Plus className="w-2.5 h-2.5 text-[#F5821F]" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
