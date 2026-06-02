"use client";

import { useState, useCallback } from "react";
import { CartItem } from "../types";
import {
  formatWhatsAppOrder,
  type WhatsAppConfig,
} from "../lib/whatsapp-order";

export function useCart(config?: WhatsAppConfig & { disabled?: boolean }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "id" | "cantidad">) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.categoriaId === item.categoriaId &&
          i.productoNombre === item.productoNombre &&
          i.variante === item.variante,
      );

      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          cantidad: newItems[existingIndex].cantidad + 1,
        };
        return newItems;
      }

      return [
        ...prev,
        {
          ...item,
          id: `${item.categoriaId}-${item.productoNombre}-${item.variante}-${Date.now()}`,
          cantidad: 1,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad } : item)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const calculateItemSubtotal = useCallback((item: CartItem): number => {
    if (item.promo2x && item.cantidad >= 2) {
      const pairs = Math.floor(item.cantidad / 2);
      const remainder = item.cantidad % 2;
      return pairs * item.promo2x + remainder * item.precio;
    }
    return item.precio * item.cantidad;
  }, []);

  const total = items.reduce(
    (sum, item) => sum + calculateItemSubtotal(item),
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  const getItemQuantity = useCallback(
    (categoriaId: string, productoNombre: string, variante: string) => {
      const item = items.find(
        (i) =>
          i.categoriaId === categoriaId &&
          i.productoNombre === productoNombre &&
          i.variante === variante,
      );
      return item?.cantidad || 0;
    },
    [items],
  );

  const getItemId = useCallback(
    (categoriaId: string, productoNombre: string, variante: string) => {
      const item = items.find(
        (i) =>
          i.categoriaId === categoriaId &&
          i.productoNombre === productoNombre &&
          i.variante === variante,
      );
      return item?.id;
    },
    [items],
  );

  const generateWhatsAppMessage = useCallback(() => {
    return formatWhatsAppOrder(items, total, config);
  }, [items, total, config]);

  if (config?.disabled) {
    return {
      items: [] as CartItem[],
      isOpen: false,
      setIsOpen: () => {},
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      total: 0,
      itemCount: 0,
      getItemQuantity: () => 0,
      getItemId: () => undefined as string | undefined,
      generateWhatsAppMessage: () => "",
    };
  }

  return {
    items,
    isOpen,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    getItemQuantity,
    getItemId,
    generateWhatsAppMessage,
  };
}
