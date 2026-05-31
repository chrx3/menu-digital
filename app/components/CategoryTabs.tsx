"use client";

import { motion } from "framer-motion";
import { Categoria } from "../types";

interface CategoryTabsProps {
  categorias: Categoria[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export default function CategoryTabs({
  categorias,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div
      className="sticky top-[72px] sm:top-[80px] z-40 -mx-4 sm:mx-0 mb-6 border-b border-naranja-mc/20 bg-crema/95 py-3 px-4 shadow-md shadow-marron-oscuro/8 backdrop-blur-md sm:rounded-2xl sm:border sm:border-marron-oscuro/10"
      role="navigation"
      aria-label="Categorías del menú"
    >
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-marron-oscuro/45 mb-2 sm:hidden">
          Estás viendo
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
          {categorias.map((categoria) => (
            <motion.button
              key={categoria.id}
              onClick={() => onCategoryChange(categoria.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                snap-start shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-300
                whitespace-nowrap relative overflow-hidden
                ${
                  activeCategory === categoria.id
                    ? "bg-gradient-to-r from-naranja-mc to-naranja-claro text-white shadow-md shadow-naranja-mc/25"
                    : "bg-marron-oscuro/6 text-marron-oscuro/75 border border-marron-oscuro/12 hover:border-naranja-mc/35 hover:bg-naranja-mc/10 hover:text-marron-oscuro"
                }
              `}
              style={{
                fontFamily: "var(--font-poppins), system-ui, sans-serif",
              }}
            >
              {categoria.titulo}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
