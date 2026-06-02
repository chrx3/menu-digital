"use client";

import { useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ProductManager } from "@/components/admin/ProductManager";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const [tab, setTab] = useState<"categories" | "products">("categories");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menú</h1>
          <p className="text-muted-foreground">Gestiona categorías, productos, precios y promociones</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("categories")}
          className={cn(
            "pb-2 px-1 text-sm font-medium border-b-2 transition-colors",
            tab === "categories"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Categorías
        </button>
        <button
          onClick={() => setTab("products")}
          className={cn(
            "pb-2 px-1 text-sm font-medium border-b-2 transition-colors",
            tab === "products"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Productos
        </button>
      </div>

      {tab === "categories" ? <CategoryManager /> : <ProductManager />}
    </div>
  );
}
