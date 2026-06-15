"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setActiveBusinessSlug } from "@/app/actions/active-business";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
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
  SidebarRail,
  SidebarSeparator,
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
  Building2,
  FileUp,
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
      { href: "/admin/importar", label: "Importar menú", icon: FileUp },
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

const PLATFORM_NAV: NavItem[] = [
  { href: "/admin/negocios", label: "Negocios", icon: Building2 },
];

interface AdminSidebarProps {
  businessName: string;
  businessSlug: string;
  userEmail: string | null;
  isSuperAdmin?: boolean;
  businesses: { slug: string; name: string }[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminSidebar({ businessName, businessSlug, userEmail, isSuperAdmin = false, businesses }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState(businessSlug);
  const [pending, start] = useTransition();

  useEffect(() => {
    setActiveSlug(businessSlug);
  }, [businessSlug]);

  function switchBusiness(slug: string) {
    if (slug === activeSlug) return;
    start(async () => {
      const r = await setActiveBusinessSlug(slug);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Negocio cambiado");
      // ponytail: refresh server components without a full page reload.
      router.refresh();
    });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isDashboardActive = pathname === "/admin";
  const initials = getInitials(businessName);
  const accountLabel = userEmail ?? "Admin";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isSuperAdmin && businesses.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      isActive={isDashboardActive}
                      tooltip={businessName}
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <LayoutDashboard aria-hidden="true" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                        <span className="truncate font-semibold">{businessName}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          Cambiar negocio
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 shrink-0" aria-hidden="true" />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                >
                  {businesses.map((b) => (
                    <DropdownMenuItem
                      key={b.slug}
                      onClick={() => switchBusiness(b.slug)}
                      disabled={pending}
                    >
                      <span className="flex-1">{b.name}</span>
                      {b.slug === activeSlug && <Check className="size-4" aria-hidden="true" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size="lg"
                isActive={isDashboardActive}
                tooltip={businessName}
                render={<Link href="/admin" />}
              >
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard aria-hidden="true" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="truncate font-semibold">{businessName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Panel de administración
                  </span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

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
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {PLATFORM_NAV.map((item) => (
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={accountLabel}
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 shrink-0 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">
                        {initials || "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{accountLabel}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        Cuenta
                      </span>
                    </div>
                    <ChevronUp className="ml-auto shrink-0" aria-hidden="true" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                <DropdownMenuItem render={<Link href="/" target="_blank" />}>
                  <Store aria-hidden="true" />
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
                  <LogOut aria-hidden="true" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
