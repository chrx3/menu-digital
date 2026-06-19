"use client";

import { motion } from "framer-motion";
import { Categoria } from "../types";

interface CategoryTabsProps {
  categorias: Categoria[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  viewingLabel: string;
}

export default function CategoryTabs({
  categorias,
  activeCategory,
  onCategoryChange,
  viewingLabel,
}: CategoryTabsProps) {
  return (
    <div
      className="landing-category-top sticky z-40 -mx-4 mb-8 border-b border-marron-oscuro/8 bg-crema/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:border-marron-oscuro/8"
      style={{ boxShadow: "var(--shadow-pill)" }}
      role="navigation"
      aria-label="Categorías del menú"
    >
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-marron-oscuro/50 mb-2 sm:hidden">
          {viewingLabel}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
          {categorias.map((categoria) => (
            <motion.button
              key={categoria.id}
              onClick={() => onCategoryChange(categoria.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`
                 snap-start shrink-0 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200
                whitespace-nowrap relative overflow-hidden
                ${
                  activeCategory === categoria.id
                    ? "bg-marron-oscuro text-white shadow-md"
                    : "bg-white text-marron-oscuro/70 border border-marron-oscuro/10 hover:border-marron-oscuro/20 hover:text-marron-oscuro hover:bg-white"
                }
              `}
              style={{
                fontFamily: "var(--font-poppins), system-ui, sans-serif",
                boxShadow: activeCategory === categoria.id
                  ? "0 2px 8px rgba(61,31,0,0.15)"
                  : "var(--shadow-pill)",
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
