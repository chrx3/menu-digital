"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown, ShoppingBag } from "lucide-react";
import Header from "@/app/components/Header";
import MenuSection from "@/app/components/MenuSection";
import CategoryTabs from "@/app/components/CategoryTabs";
import Cart from "@/app/components/Cart";
import ParticleBackground from "@/app/components/ParticleBackground";
import { useActiveCategory } from "@/app/hooks/useActiveCategory";
import { useCart } from "@/app/hooks/useCart";
import { useCartFly } from "@/app/hooks/useCartFly";
import { filterMenuBySearch } from "@/app/lib/search-menu";
import type { WhatsAppConfig } from "@/app/lib/whatsapp-order";
import type { Categoria } from "@/app/types";
import type {
  BusinessConfig,
  BusinessTheme,
  ParticleIcon,
} from "@/app/config/types";

interface Config {
  business: BusinessConfig;
  theme: BusinessTheme | null;
  translations: Record<string, string>;
  particleIcons: ParticleIcon[];
}

interface LandingProps {
  config?: Config;
  menu?: Categoria[];
  mode?: "editor";
  onSelectElement?: (el: { type: string; slug?: string }) => void;
  selectedElement?: { type: string; slug?: string } | null;
  /** When set (editor desktop preview), scroll listeners use this container. */
  scrollRoot?: HTMLElement | null;
}

const defaultBusiness: BusinessConfig = {
  slug: "mc-tommy",
  name: "MC Tommy",
  description: "",
  year: 2025,
  locale: "es-CL",
  currency: "CLP",
  lang: "es",
  whatsappNumber: "56963725018",
  whatsappGreeting: "¡Hola! Quiero hacer un pedido en *MC Tommy*",
  phone: "",
  email: "",
  address: "",
  logoDesktop: "/mctommy.webp",
  logoMobile: ["/mctommy1.webp", "/mctommy2.webp"],
  logoRotationInterval: 4000,
  favicon: "",
  appleIcon: "",
  seoTitle: "",
  seoDescription: "",
  seoThemeColor: "#fff8f0",
  seoOgImage: "",
  orderChannels: { whatsapp: true, phone: false, telegram: false },
  promotionTypes: ["promo_2x"],
  isActive: true,
};
const defaultConfig: Config = {
  business: defaultBusiness,
  theme: null,
  translations: {},
  particleIcons: [],
};

function isSelected(
  selectedElement: { type: string; slug?: string } | null | undefined,
  type: string,
  slug?: string,
) {
  return selectedElement?.type === type && selectedElement?.slug === slug;
}

export default function MenuLandingClient({
  config = defaultConfig,
  menu,
  mode,
  onSelectElement,
  selectedElement,
  scrollRoot,
}: LandingProps) {
  const { business, theme, translations } = config;
  const t = (key: string, fallback: string) => translations[key] || fallback;
  const data = useMemo<Categoria[]>(() => menu ?? [], [menu]);
  const isEditor = mode === "editor";

  const whatsappConfig: WhatsAppConfig = {
    businessName: business.name,
    greeting: business.whatsappGreeting,
  };
  const cart = useCart(
    isEditor ? { ...whatsappConfig, disabled: true } : whatsappConfig,
  );
  const { flyToCart, cartPulse, FlyPortal } = useCartFly({
    duration: theme?.cartFlyDuration,
    ballSize: theme?.cartFlyBallSize,
    disabled: isEditor || theme?.reducedMotion,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [menuRevealKey, setMenuRevealKey] = useState(0);
  const hadSearchRef = useRef(false);
  const isSearching = deferredSearch.trim().length > 0;
  const isSearchPending = searchTerm !== deferredSearch;
  const filteredMenu = useMemo(
    () => filterMenuBySearch(data, deferredSearch),
    [data, deferredSearch],
  );
  const totalResults = filteredMenu.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const categoryIds = useMemo(
    () => filteredMenu.map((category) => category.id),
    [filteredMenu],
  );
  const activeCategory = useActiveCategory(categoryIds, scrollRoot);

  const themeStyle = theme
    ? ({
        "--naranja-mc": theme.colorPrimary,
        "--naranja-claro": theme.colorPrimaryLight,
        "--naranja-intenso": theme.colorPrimaryIntense,
        "--naranja-texto": theme.colorPrimaryText,
        "--crema": theme.colorBackground,
        "--crema-oscuro": theme.colorBackgroundDark,
        "--crema-profundo": theme.colorBackgroundDeep,
        "--marron-oscuro": theme.colorTextDark,
        "--marron-medio": theme.colorTextMedium,
        "--marron-claro": theme.colorTextLight,
        "--blanco": theme.colorWhite,
        "--header-height-desktop": theme.headerHeightDesktop,
        "--header-height-mobile": theme.headerHeightMobile,
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    const target = scrollRoot ?? window;
    const handleScroll = () => {
      const scrollTop = scrollRoot ? scrollRoot.scrollTop : window.scrollY;
      setShowScrollTop(scrollTop > 300);
    };
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [scrollRoot]);

  useEffect(() => {
    const hasSearch = searchTerm.trim().length > 0;
    if (hadSearchRef.current && !hasSearch) setMenuRevealKey((key) => key + 1);
    hadSearchRef.current = hasSearch;
  }, [searchTerm]);

  const scrollToCategory = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  const particleIconKey =
    config.particleIcons?.map((i) => i.name).join("\0") ?? "";
  const particleIconNames = useMemo(
    () => (particleIconKey ? particleIconKey.split("\0") : []),
    [particleIconKey],
  );

  const wrapEdit = (
    type: string,
    slug: string | undefined,
    label: string,
    children: React.ReactNode,
  ) => {
    if (!isEditor) return children;
    const sel = isSelected(selectedElement, type, slug);
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement?.({ type, slug });
        }}
        className={`relative cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 hover:bg-primary/[0.02] ${
          sel ? "ring-2 ring-primary bg-primary/5 z-10" : ""
        }`}
      >
        <span
          className={`absolute -top-2.5 left-2 z-20 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all bg-primary text-primary-foreground ${
            sel
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 hover:opacity-100"
          }`}
        >
          {label}
        </span>
        {children}
      </div>
    );
  };

  return (
    <main
      className={`${isEditor ? "editor-preview min-h-full" : "min-h-dvh"} relative text-marron-oscuro`}
      style={themeStyle}
    >
      <ParticleBackground
        desktopCount={theme?.particlesDesktop}
        mobileCount={theme?.particlesMobile}
        disabled={theme?.reducedMotion}
        icons={particleIconNames}
        fixed={!isEditor}
      />
      {wrapEdit(
        "navbar",
        undefined,
        "Navbar",
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          businessName={business.name}
          logoDesktop={business.logoDesktop}
          mobileLogos={business.logoMobile}
          logoRotationInterval={business.logoRotationInterval}
          searchPlaceholder={t("search.placeholder", "Buscar en el menú…")}
          mode={mode}
        />,
      )}
      {!isEditor && <div className="landing-header-spacer" />}

      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 sm:px-6 lg:px-8"
          >
            <p
              className="mx-auto max-w-7xl text-sm font-medium text-naranja-texto"
              aria-live="polite"
            >
              {isSearchPending
                ? t("search.searching", "Buscando…")
                : `${totalResults} ${totalResults === 1 ? t("search.resultSingular", "producto encontrado") : t("search.resultPlural", "productos encontrados")}`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="menu" className="relative z-10 px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {!isSearchPending && !filteredMenu.length ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <ShoppingBag
                className="mx-auto mb-4 h-16 w-16 text-marron-oscuro/15"
                aria-hidden="true"
              />
              <p className="text-lg text-marron-oscuro/50">
                {t("search.noResults", "No se encontraron productos")}
              </p>
              <p className="mt-1 text-sm text-marron-oscuro/40">
                {t(
                  "search.noResultsHint",
                  "Prueba con otra palabra o revisa la ortografía",
                )}
              </p>
            </motion.div>
          ) : (
            <div
              key={
                isSearching
                  ? `search-${deferredSearch}`
                  : `menu-${menuRevealKey}`
              }
              className="flex flex-col"
            >
              {!isSearchPending && filteredMenu.length > 0 && (
                <CategoryTabs
                  categorias={filteredMenu}
                  activeCategory={activeCategory}
                  onCategoryChange={scrollToCategory}
                  viewingLabel={t("category.viewing", "Estás viendo")}
                />
              )}
              {filteredMenu.map((category) => (
                <div key={category.id}>
                  {wrapEdit(
                    "category",
                    category.id,
                    category.titulo,
                    <MenuSection
                      categoria={category}
                      isSearching={isSearching}
                      menuRevealKey={menuRevealKey}
                      onAddToCart={cart.addItem}
                      onUpdateQuantity={cart.updateQuantity}
                      getItemId={cart.getItemId}
                      getItemQuantity={cart.getItemQuantity}
                      flyToCart={flyToCart}
                      translations={translations}
                      onSelectProduct={
                        onSelectElement
                          ? (slug) => onSelectElement({ type: "product", slug })
                          : undefined
                      }
                      selectedProductSlug={
                        selectedElement?.type === "product"
                          ? (selectedElement.slug ?? null)
                          : null
                      }
                    />,
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!isEditor && showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            onClick={() => {
              if (scrollRoot) {
                scrollRoot.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="fixed bottom-32 right-6 z-30 rounded-full bg-naranja-mc p-3 text-marron-oscuro shadow-lg lg:hidden"
            aria-label="Volver al inicio"
          >
            <ChevronDown className="h-5 w-5 rotate-180" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {wrapEdit(
        "footer",
        undefined,
        "Footer",
        <footer className="relative z-10 border-t border-marron-oscuro/10 bg-crema-oscuro/40 px-4 py-8 text-center">
          <Image
            src={business.logoDesktop || "/mctommy.webp"}
            alt={business.name}
            width={120}
            height={40}
            className="mx-auto h-10 w-auto object-contain"
          />
          <p className="mt-2 text-sm text-marron-oscuro/50">
            {t(
              "footer.copyright",
              "© {year} {name}. Todos los derechos reservados",
            )
              .replace("{year}", String(business.year))
              .replace("{name}", business.name)}
          </p>
        </footer>,
      )}
      {!isEditor && (
        <>
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
            whatsappNumber={business.whatsappNumber}
            whatsappEnabled={business.orderChannels?.whatsapp}
            translations={translations}
          />
          <FlyPortal />
        </>
      )}
    </main>
  );
}
