"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  businessName: string;
  businessSlug: string;
  isActive: boolean;
  userEmail: string | null;
  primaryColor: string | null;
  primaryTextColor: string | null;
  isSuperAdmin?: boolean;
  businesses: { slug: string; name: string }[];
}

export function AdminShell({
  children,
  businessName,
  businessSlug,
  isActive,
  userEmail,
  primaryColor,
  primaryTextColor,
  isSuperAdmin = false,
  businesses,
}: AdminShellProps) {
  const pathname = usePathname();
  const isEditorRoute = pathname.startsWith("/admin/editor");

  const brandStyle = {
    "--sidebar": "var(--crema)",
    "--sidebar-foreground": "var(--marron-oscuro)",
    "--sidebar-accent": "var(--crema-oscuro)",
    "--sidebar-accent-foreground": "var(--marron-oscuro)",
    "--sidebar-border": "var(--crema-profundo)",
    "--primary": primaryColor ?? "var(--naranja-mc)",
    "--sidebar-primary": primaryColor ?? "var(--naranja-mc)",
    "--primary-foreground": primaryTextColor ?? "var(--blanco)",
    "--sidebar-primary-foreground": primaryTextColor ?? "var(--blanco)",
  } as CSSProperties;

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider
        className="h-dvh min-h-0 overflow-hidden"
        style={brandStyle}
      >
        <AdminSidebar
          businessName={businessName}
          businessSlug={businessSlug}
          userEmail={userEmail}
          isSuperAdmin={isSuperAdmin}
          businesses={businesses}
        />
        <SidebarInset className="min-w-0 h-full overflow-hidden">
          <div className="flex h-full flex-col">
            <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
              <SidebarTrigger aria-label="Abrir navegación" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{businessName}</p>
                  <span
                    className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    }`}
                  >
                    {isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Panel de administración
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/" target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                Ver landing
              </Button>
            </header>
            <main
              id="admin-content"
              className={cn(
                "flex-1 overscroll-contain",
                isEditorRoute
                  ? "flex min-h-0 flex-col overflow-hidden p-0"
                  : "overflow-y-auto p-4 sm:p-6",
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 flex-col",
                  isEditorRoute ? "min-h-0 flex-1" : "gap-6",
                )}
              >
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  );
}
