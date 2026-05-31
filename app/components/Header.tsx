"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Search, X } from "lucide-react";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ searchTerm, onSearchChange }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileLogoIndex, setMobileLogoIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);

  const mobileLogos = ["/mctommy1.webp", "/mctommy2.webp"] as const;

  const hasSearch = searchTerm.trim().length > 0;

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMobileLogoIndex((i) => (i + 1) % mobileLogos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [mobileLogos.length]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-marron-oscuro/95 backdrop-blur-lg shadow-lg shadow-marron-medio/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px] sm:h-[80px]">
            {/* Logo */}
            <motion.a
              href="#"
              className="flex items-center gap-2 sm:gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileLogos[mobileLogoIndex]}
                  initial={{ opacity: 0, rotate: -10 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 10 }}
                  transition={{ duration: 0.2 }}
                  className="sm:hidden"
                >
                  <Image
                    src={mobileLogos[mobileLogoIndex]}
                    alt="MC Tommy"
                    width={48}
                    height={48}
                    className="object-contain h-10 w-10"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              <Image
                src="/mctommy.webp"
                alt="MC Tommy"
                width={140}
                height={48}
                className="hidden sm:block object-contain h-10 sm:h-12 w-auto"
                priority
              />
            </motion.a>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-naranja-mc/60" aria-hidden="true" />
                <input
                  ref={desktopSearchRef}
                  type="search"
                  name="menu-search"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Buscar en el menú"
                  placeholder="Buscar en el menú…"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-crema/90 border-2 border-naranja-mc/30 rounded-xl text-marron-oscuro placeholder:text-marron-oscuro/40 focus-visible:outline-none focus-visible:border-naranja-mc focus-visible:ring-2 focus-visible:ring-naranja-mc/20 transition-[border-color,box-shadow] font-medium"
                  style={{
                    fontFamily: "var(--font-poppins), system-ui, sans-serif",
                  }}
                />
                {hasSearch && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={() => {
                      onSearchChange("");
                      desktopSearchRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-marron-oscuro/60 hover:text-marron-oscuro hover:bg-marron-oscuro/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja-mc/40"
                    whileTap={{ scale: 0.85 }}
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Toggle */}
              <motion.button
                onClick={() => {
                  if (isSearchOpen) {
                    onSearchChange("");
                  }
                  setIsSearchOpen(!isSearchOpen);
                }}
                className="md:hidden p-3 rounded-xl bg-naranja-mc/15 text-naranja-mc hover:bg-naranja-mc/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja-mc/40"
                whileTap={{ scale: 0.9 }}
                aria-label={isSearchOpen ? "Cerrar búsqueda" : "Buscar"}
              >
                {isSearchOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-[72px] left-0 right-0 z-40 bg-marron-oscuro/95 backdrop-blur-lg px-4 py-3 border-b border-naranja-mc/20"
          >
            <div className="relative max-w-7xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-naranja-mc/60" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                name="menu-search-mobile"
                autoComplete="off"
                spellCheck={false}
                aria-label="Buscar en el menú"
                placeholder="Buscar en el menú…"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-crema border-2 border-naranja-mc/30 rounded-xl text-marron-oscuro placeholder:text-marron-oscuro/40 focus-visible:outline-none focus-visible:border-naranja-mc focus-visible:ring-2 focus-visible:ring-naranja-mc/20 transition-[border-color,box-shadow] font-medium"
                style={{
                  fontFamily: "var(--font-poppins), system-ui, sans-serif",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
