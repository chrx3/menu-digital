"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSandwichDisplayName } from "../lib/sandwich-options";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { CartItem } from "../types";

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  total: number;
  itemCount: number;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClearCart: () => void;
  generateWhatsAppMessage: () => string;
  cartPulse?: boolean;
}

export default function Cart({
  items,
  isOpen,
  setIsOpen,
  total,
  itemCount,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  generateWhatsAppMessage,
  cartPulse = false,
}: CartProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleWhatsAppSend = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/56963725018?text=${encodedMessage}`, "_blank");
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString("es-CL")}`;
  };

  // Calcular subtotal considerando promo 2x
  const calculateItemSubtotal = (item: CartItem) => {
    if (item.promo2x && item.cantidad >= 2) {
      const pairs = Math.floor(item.cantidad / 2);
      const remainder = item.cantidad % 2;
      return pairs * item.promo2x + remainder * item.precio;
    }
    return item.precio * item.cantidad;
  };

  return (
    <>
      {/* Mobile Floating Cart Button — circular con burbuja de total */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-14 right-4 z-40 lg:hidden flex items-center gap-3"
      >
        {/* Burbuja de total */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.8 }}
              className="relative bg-marron-oscuro/90 backdrop-blur-sm text-naranja-mc font-bold text-sm px-3 py-1.5 rounded-xl border border-naranja-mc/30 shadow-lg whitespace-nowrap"
              style={{
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
              }}
            >
              {formatPrice(total)}
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-marron-oscuro/90 backdrop-blur-sm rotate-45 shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(true)}
          animate={{
            ...(cartPulse && { scale: [1, 1.25, 1] }),
          }}
          className="relative w-14 h-14 bg-gradient-to-br from-naranja-mc to-naranja-claro rounded-full shadow-xl shadow-naranja-mc/40 flex items-center justify-center shrink-0"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-cart-fly-target
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-marron-oscuro text-naranja-mc text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow-md"
              >
                {itemCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Desktop Side Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          ...(cartPulse && { scale: [1, 1.15, 1] }),
        }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden lg:flex items-center gap-2 bg-gradient-to-r from-naranja-mc to-naranja-claro text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-naranja-mc/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-cart-fly-target
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 bg-[#3D1F00] text-[#F5821F] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold overflow-hidden whitespace-nowrap"
            >
              {formatPrice(total)}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-marron-oscuro to-marron-medio rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-marron-oscuro/30 lg:fixed lg:right-0 lg:top-0 lg:left-auto lg:w-[420px] lg:h-full lg:rounded-none lg:border-t-0 lg:border-l-2 lg:border-naranja-mc/25 lg:max-h-none overscroll-behavior-contain"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#F5821F]" />
                  <h2
                    className="text-xl font-bold text-[#F5821F]"
                    style={{
                      fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                    }}
                  >
                    Tu Pedido
                  </h2>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">
                      Tu carrito está vacío
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      Agrega productos para comenzar tu pedido
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 100, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                          className="glass rounded-xl p-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-[#3D1F00] font-semibold text-sm">
                                {item.categoriaId === "sandwiches"
                                  ? formatSandwichDisplayName(
                                      item.productoNombre,
                                      item.variante,
                                    )
                                  : item.productoNombre}
                              </p>
                              {item.categoriaId !== "sandwiches" && (
                                <p className="text-[#3D1F00]/50 text-xs">
                                  {item.variante}
                                </p>
                              )}
                              <p className="text-[#F5821F] text-xs font-medium">
                                {item.categoriaTitulo}
                              </p>
                            </div>
                            <motion.button
                              onClick={() => onRemoveItem(item.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 text-[#3D1F00]/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-[#F5821F]/10 rounded-lg border border-[#F5821F]/20">
                              <motion.button
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.cantidad - 1)
                                }
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 text-[#3D1F00]/60 hover:text-[#3D1F00] transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <motion.span
                                key={item.cantidad}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="px-2 text-[#3D1F00] font-semibold text-sm min-w-[1.5rem] text-center"
                              >
                                {item.cantidad}
                              </motion.span>
                              <motion.button
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.cantidad + 1)
                                }
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 text-[#3D1F00]/60 hover:text-[#3D1F00] transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            <span className="text-naranja-texto font-bold text-sm">
                              {formatPrice(calculateItemSubtotal(item))}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-4 border-t border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Total</span>
                    <motion.span
                      key={total}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-[#F5821F]"
                      style={{
                        fontFamily:
                          "var(--font-fredoka), system-ui, sans-serif",
                      }}
                    >
                      {formatPrice(total)}
                    </motion.span>
                  </div>

                  <motion.button
                    onClick={handleWhatsAppSend}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-500/30"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar Pedido por WhatsApp
                  </motion.button>

                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full text-white/50 text-sm hover:text-white/70 transition-colors py-1"
                  >
                    Vaciar carrito
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Clear Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-[#5C3410] to-[#3D1F00] border-2 border-[#F5821F]/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3
                  className="text-xl font-bold text-[#F5821F] mb-3"
                  style={{
                    fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                  }}
                >
                  ¿Vaciar carrito?
                </h3>
                <p className="text-white/80 mb-6">
                  ¿Estás seguro de que quieres eliminar todos los productos de
                  tu carrito?
                </p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowConfirm(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/15 transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      onClearCart();
                      setShowConfirm(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Vaciar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
