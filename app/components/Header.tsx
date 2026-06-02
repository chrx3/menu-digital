"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Search, X } from "lucide-react";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  businessName: string;
  logoDesktop: string;
  mobileLogos: string[];
  logoRotationInterval: number;
  searchPlaceholder: string;
  /** Editor mode overrides: header becomes relative instead of fixed */
  mode?: "editor";
}

export default function Header({
  searchTerm,
  onSearchChange,
  businessName,
  logoDesktop,
  mobileLogos,
  logoRotationInterval,
  searchPlaceholder,
  mode,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileLogoIndex, setMobileLogoIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const logos = mobileLogos.length
    ? mobileLogos
    : [logoDesktop || "/mctommy.webp"];
  const hasSearch = searchTerm.trim().length > 0;

  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (logos.length < 2) return;
    const interval = window.setInterval(
      () => setMobileLogoIndex((index) => (index + 1) % logos.length),
      logoRotationInterval || 4000,
    );
    return () => window.clearInterval(interval);
  }, [logoRotationInterval, logos.length]);

  const isEditor = mode === "editor";

  return (
    <div className={isEditor ? "relative" : undefined}>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`${isEditor ? "relative" : "fixed"} inset-x-0 top-0 z-50 bg-marron-oscuro/95 shadow-lg shadow-marron-medio/30 backdrop-blur-lg`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="landing-header-height flex items-center justify-between">
            <motion.a
              href="#menu"
              aria-label={`Ir al menú de ${businessName}`}
              className="flex items-center gap-2 sm:gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={logos[mobileLogoIndex]}
                  initial={{ opacity: 0, rotate: -10 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 10 }}
                  transition={{ duration: 0.2 }}
                  className="sm:hidden"
                >
                  <Image
                    src={logos[mobileLogoIndex]}
                    alt={businessName}
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain"
                    priority
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>
              <Image
                src={logoDesktop || "/mctommy.webp"}
                alt={businessName}
                width={140}
                height={48}
                className="hidden h-10 w-auto object-contain sm:block sm:h-12"
                priority
                unoptimized
              />
            </motion.a>
            <div className="mx-8 hidden max-w-md flex-1 md:flex">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-naranja-mc/60"
                  aria-hidden="true"
                />
                <input
                  ref={desktopSearchRef}
                  type="search"
                  name="menu-search"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="w-full rounded-xl border-2 border-naranja-mc/30 bg-crema/90 py-2.5 pl-10 pr-10 font-medium text-marron-oscuro placeholder:text-marron-oscuro/40 focus-visible:border-naranja-mc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja-mc/20"
                />
                {hasSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange("");
                      desktopSearchRef.current?.focus();
                    }}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 min-h-9 min-w-9 -translate-y-1/2 rounded-lg text-marron-oscuro/60 hover:bg-marron-oscuro/10 hover:text-marron-oscuro focus-visible:ring-2 focus-visible:ring-naranja-mc/40"
                  >
                    <X className="mx-auto h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isSearchOpen) onSearchChange("");
                setIsSearchOpen(!isSearchOpen);
              }}
              className="min-h-11 min-w-11 rounded-xl bg-naranja-mc/15 text-naranja-mc hover:bg-naranja-mc/25 focus-visible:ring-2 focus-visible:ring-naranja-mc/40 md:hidden"
              aria-label={isSearchOpen ? "Cerrar búsqueda" : "Buscar"}
            >
              {isSearchOpen ? (
                <X className="mx-auto h-6 w-6" aria-hidden="true" />
              ) : (
                <Search className="mx-auto h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`${
              isEditor
                ? "absolute inset-x-0 top-full"
                : "landing-mobile-search fixed inset-x-0"
            } z-40 border-b border-naranja-mc/20 bg-marron-oscuro/95 px-4 py-3 backdrop-blur-lg md:hidden`}
          >
            <div className="relative mx-auto max-w-7xl">
              <Search
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-naranja-mc/60"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                name="menu-search-mobile"
                autoComplete="off"
                spellCheck={false}
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full rounded-xl border-2 border-naranja-mc/30 bg-crema py-2.5 pl-10 pr-4 font-medium text-marron-oscuro placeholder:text-marron-oscuro/40 focus-visible:border-naranja-mc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja-mc/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
