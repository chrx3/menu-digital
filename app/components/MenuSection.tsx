"use client";

import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import ScrollReveal from "./ScrollReveal";
import type { Categoria } from "../types";

type CartHandlers = {
  onAddToCart: React.ComponentProps<typeof ProductCard>["onAddToCart"];
  onUpdateQuantity: React.ComponentProps<typeof ProductCard>["onUpdateQuantity"];
  getItemId: React.ComponentProps<typeof ProductCard>["getItemId"];
  getItemQuantity: React.ComponentProps<typeof ProductCard>["getItemQuantity"];
  flyToCart: React.ComponentProps<typeof ProductCard>["flyToCart"];
};

interface MenuSectionProps extends CartHandlers {
  categoria: Categoria;
  isSearching: boolean;
  menuRevealKey: number;
}

export default function MenuSection({
  categoria,
  isSearching,
  menuRevealKey,
  onAddToCart,
  onUpdateQuantity,
  getItemId,
  getItemQuantity,
  flyToCart,
}: MenuSectionProps) {
  return (
    <section
      id={categoria.id}
      className="scroll-mt-[11.5rem] sm:scroll-mt-[10.5rem] pt-10 pb-12 first:pt-2"
    >
      <ScrollReveal
        key={`${categoria.id}-header-${menuRevealKey}-${isSearching}`}
        disabled={isSearching}
      >
        <header className="mb-6 pb-3 border-b-2 border-naranja-mc/25">
          <h2
            className="text-2xl sm:text-3xl font-bold text-naranja-texto text-pretty"
            style={{
              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
            }}
          >
            {categoria.titulo}
          </h2>
          <p className="text-marron-oscuro/65 text-sm sm:text-base mt-1 max-w-2xl">
            {categoria.descripcion}
          </p>
        </header>
      </ScrollReveal>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: isSearching ? 0.03 : 0.06,
            },
          },
        }}
        className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {categoria.items.map((producto, index) => (
          <motion.div
            key={`${categoria.id}-${producto.nombre}`}
            className="h-full"
            variants={{
              hidden: { opacity: 0, y: isSearching ? 8 : 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: isSearching ? 0.2 : 0.35,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            <ProductCard
              producto={producto}
              categoria={categoria}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              getItemId={getItemId}
              getItemQuantity={getItemQuantity}
              flyToCart={flyToCart}
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
