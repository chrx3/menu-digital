"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Store,
  Palette,
  UtensilsCrossed,
  Languages,
  Image as ImageIcon,
  Sparkles,
  Eye,
  LogOut,
  ChevronUp,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Trabajo",
    items: [
      { href: "/admin/editor", label: "Editor Visual", icon: Eye },
      { href: "/admin/menu", label: "Menú", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Apariencia",
    items: [
      { href: "/admin/tema", label: "Tema", icon: Palette },
      { href: "/admin/particulas", label: "Partículas", icon: Sparkles },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/admin/negocio", label: "Negocio", icon: Store },
      { href: "/admin/traducciones", label: "Traducciones", icon: Languages },
      { href: "/admin/imagenes", label: "Imágenes", icon: ImageIcon },
    ],
  },
];

interface AdminSidebarProps {
  businessName: string;
  userEmail: string | null;
}

export function AdminSidebar({ businessName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const initials = businessName
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              isActive={pathname === "/admin"}
              render={<Link href="/admin" />}
              tooltip="Dashboard"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="size-4" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate font-semibold">{businessName}</span>
                <span className="text-xs text-muted-foreground">
                  Panel de administración
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <Avatar className="size-6 rounded-md">
                      <AvatarFallback className="rounded-md text-xs">
                        {initials || "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{userEmail ?? "Admin"}</span>
                    <ChevronUp className="ml-auto size-4" aria-hidden="true" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                <DropdownMenuItem render={<Link href="/" target="_blank" />}>
                  <Store className="mr-2 size-4" aria-hidden="true" />
                  Ver Landing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const { createClient } =
                      await import("@/lib/supabase/client");
                    await createClient().auth.signOut();
                    window.location.href = "/admin/auth/login";
                  }}
                >
                  <LogOut className="mr-2 size-4" aria-hidden="true" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
