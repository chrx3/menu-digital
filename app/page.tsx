"use client";

import { useState, useMemo, useEffect, useDeferredValue, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Header from "./components/Header";
import MenuSection from "./components/MenuSection";
import CategoryTabs from "./components/CategoryTabs";
import { useActiveCategory } from "./hooks/useActiveCategory";
import Cart from "./components/Cart";
import ParticleBackground from "./components/ParticleBackground";
import ScrollReveal from "./components/ScrollReveal";
import { useCart } from "./hooks/useCart";
import { useCartFly } from "./hooks/useCartFly";
import { menuData } from "./data/menu";
import { filterMenuBySearch } from "./lib/search-menu";
import { Flame, Clock, Award, ChevronDown, ShoppingBag } from "lucide-react";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [menuRevealKey, setMenuRevealKey] = useState(0);
  const hadSearchRef = useRef(false);
  const cart = useCart();
  const { flyToCart, cartPulse, FlyPortal } = useCartFly();

  const isSearching = deferredSearch.trim().length > 0;
  const isSearchPending = searchTerm !== deferredSearch;

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const hasSearch = searchTerm.trim().length > 0;
    if (hadSearchRef.current && !hasSearch) {
      setMenuRevealKey((key) => key + 1);
    }
    hadSearchRef.current = hasSearch;
  }, [searchTerm]);

  const filteredMenu = useMemo(
    () => filterMenuBySearch(menuData, deferredSearch),
    [deferredSearch],
  );

  const totalResults = filteredMenu.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  const categoryIds = useMemo(
    () => filteredMenu.map((c) => c.id),
    [filteredMenu],
  );
  const activeCategory = useActiveCategory(categoryIds);

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen relative text-marron-oscuro">
      <ParticleBackground />

      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Spacer for fixed header */}
      <div className="h-[140px] sm:h-[130px]" />

      {/* Quick Info Bar */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-marron-oscuro/70">
              <Flame className="w-4 h-4 text-naranja-mc" aria-hidden="true" />
              <span>Sabores Auténticos</span>
            </div>
            <div className="flex items-center gap-1.5 text-marron-oscuro/70">
              <Clock className="w-4 h-4 text-naranja-mc" aria-hidden="true" />
              <span>Entrega Rápida</span>
            </div>
            <div className="flex items-center gap-1.5 text-marron-oscuro/70">
              <Award className="w-4 h-4 text-naranja-mc" aria-hidden="true" />
              <span>Recetas Caseras</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Counter */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 sm:px-6 lg:px-8 pb-4"
          >
            <div className="max-w-7xl mx-auto">
              <p className="text-naranja-mc text-sm font-medium">
                {isSearchPending ? (
                  "Buscando…"
                ) : (
                  <>
                    {totalResults}{" "}
                    {totalResults === 1
                      ? "producto encontrado"
                      : "productos encontrados"}
                  </>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Sections */}
      <div
        id="menu"
        className="relative z-10 px-4 sm:px-6 lg:px-8 pb-24"
      >
        <div className="max-w-7xl mx-auto">
          {!isSearchPending && filteredMenu.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <ShoppingBag className="w-16 h-16 text-marron-oscuro/15 mx-auto mb-4" />
              <p className="text-marron-oscuro/50 text-lg">
                No se encontraron productos
              </p>
              <p className="text-marron-oscuro/30 text-sm mt-1">
                Prueba con otra palabra o revisa la ortografía
              </p>
            </motion.div>
          ) : (
            <div
              key={isSearching ? `search-${deferredSearch}` : `menu-${menuRevealKey}`}
              className="flex flex-col"
            >
              {!isSearchPending && filteredMenu.length > 0 && (
                <CategoryTabs
                  categorias={filteredMenu}
                  activeCategory={activeCategory}
                  onCategoryChange={scrollToCategory}
                />
              )}
              {filteredMenu.map((categoria) => (
                <MenuSection
                  key={categoria.id}
                  categoria={categoria}
                  isSearching={isSearching}
                  menuRevealKey={menuRevealKey}
                  onAddToCart={cart.addItem}
                  onUpdateQuantity={cart.updateQuantity}
                  getItemId={cart.getItemId}
                  getItemQuantity={cart.getItemQuantity}
                  flyToCart={flyToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-6 z-30 p-3 bg-[#F5821F] text-[#3D1F00] rounded-full shadow-lg lg:hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronDown className="w-5 h-5 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-marron-oscuro/10 bg-crema-oscuro/40">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-3">
            <Image
              src="/mctommy.webp"
              alt="MC Tommy"
              width={120}
              height={40}
              className="object-contain h-10 w-auto"
            />
          </div>
          <p className="text-marron-oscuro/40 text-sm mt-1">
            © 2025 MC Tommy. Todos los derechos reservados
          </p>
        </div>
      </footer>

      <Cart
        items={cart.items}
        isOpen={cart.isOpen}
        setIsOpen={cart.setIsOpen}
        total={cart.total}
        itemCount={cart.itemCount}
        onRemoveItem={cart.removeItem}
        onUpdateQuantity={cart.updateQuantity}
        onClearCart={cart.clearCart}
        generateWhatsAppMessage={cart.generateWhatsAppMessage}
        cartPulse={cartPulse}
      />

      <FlyPortal />
    </main>
  );
}
