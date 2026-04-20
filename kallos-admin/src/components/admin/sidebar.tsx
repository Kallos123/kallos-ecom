"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, FolderTree, Tag,
  Zap, RotateCcw, Star, Users, LogOut, ChevronRight,
  PanelLeftClose, PanelLeft, ShoppingCart, Settings,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logoutAdmin, clearUser } from "@/lib/auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/admin/sidebar-context";

const NAV = [
  { label: "Dashboard",   href: "/admin",              icon: LayoutDashboard, exact: true },
  { label: "Orders",      href: "/admin/orders",        icon: ShoppingBag },
  { label: "Products",    href: "/admin/products",      icon: Package },
  { label: "Categories",  href: "/admin/categories",    icon: FolderTree },
  { label: "Coupons",     href: "/admin/coupons",       icon: Tag },
  { label: "Flash Sales", href: "/admin/flash-sales",   icon: Zap },
  { label: "Returns",     href: "/admin/returns",       icon: RotateCcw },
  { label: "Reviews",     href: "/admin/reviews",       icon: Star },
  { label: "Users",       href: "/admin/users",         icon: Users },
  { label: "Carts",       href: "/admin/carts",         icon: ShoppingCart },
  { label: "Settings",    href: "/admin/settings",      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, toggle, mobileOpen, closeMobile } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleLogout() {
    logoutAdmin();
    clearUser();
    router.push("/login");
  }

  function handleNav(href: string) {
    router.push(href);
    if (isMobile) closeMobile();
  }

  // On mobile: 280px overlay, shown/hidden via transform
  // On desktop: 60px collapsed / 240px expanded, always visible
  const sidebarWidth = isMobile ? 280 : expanded ? 240 : 60;
  const showLabels = isMobile || expanded;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "oklch(0 0 0 / 0.35)", backdropFilter: "blur(2px)" }}
          onClick={closeMobile}
        />
      )}

      <aside
        className="fixed left-0 top-0 bottom-0 flex flex-col z-50 overflow-hidden"
        style={{
          width: sidebarWidth,
          background: "oklch(0.978 0.006 65)",
          borderRight: "1px solid oklch(0.89 0.007 65)",
          transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
          transition: "width 0.2s ease-in-out, transform 0.22s ease-in-out",
        }}
      >
        {/* Logo */}
        <div
          className="h-14 flex items-center shrink-0 overflow-hidden"
          style={{ borderBottom: "1px solid oklch(0.89 0.007 65)" }}
        >
          {showLabels ? (
            <div className="px-5 w-full">
              <Image src="/kallos-logo.png" alt="KALLOS" width={120} height={50} className="object-contain h-8 w-auto" priority />
            </div>
          ) : (
            <div className="w-[60px] flex items-center justify-center">
              <span className="text-2xl font-light leading-none" style={{ fontFamily: "var(--font-cormorant)", color: "oklch(0.55 0.20 18)" }}>
                K
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          className="flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden"
          style={{ padding: showLabels ? "12px 10px" : "12px 8px" }}
        >
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(href, exact);

            const navBtn = (
              <button
                onClick={() => handleNav(href)}
                className={cn(
                  "relative flex items-center h-9 w-full rounded-xl transition-all duration-150 cursor-pointer whitespace-nowrap select-none",
                  showLabels ? "gap-3 px-3" : "justify-center"
                )}
                style={
                  active
                    ? { background: "oklch(0.55 0.20 18 / 0.09)", color: "oklch(0.50 0.20 18)" }
                    : { color: "oklch(0.50 0.008 65)" }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "oklch(0.90 0.006 65)";
                    e.currentTarget.style.color = "oklch(0.22 0.010 65)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.color = "oklch(0.50 0.008 65)";
                  }
                }}
              >
                <Icon size={15} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
                {showLabels && (
                  <span className="text-[12px] font-mono tracking-[0.05em] truncate flex-1 text-left">{label}</span>
                )}
                {active && showLabels && (
                  <span className="size-1.5 rounded-full shrink-0" style={{ background: "oklch(0.55 0.20 18 / 0.55)" }} />
                )}
              </button>
            );

            if (!showLabels) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">{navBtn}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-[11px] font-mono tracking-wide rounded-lg">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={href}>{navBtn}</div>;
          })}
        </nav>

        {/* Bottom actions */}
        <div
          className="flex flex-col gap-0.5"
          style={{
            padding: showLabels ? "10px 10px" : "10px 8px",
            borderTop: "1px solid oklch(0.89 0.007 65)",
          }}
        >
          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={toggle}
              className={cn(
                "flex items-center h-9 w-full rounded-xl transition-all duration-150 cursor-pointer",
                expanded ? "gap-3 px-3" : "justify-center"
              )}
              style={{ color: "oklch(0.58 0.008 65)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "oklch(0.90 0.006 65)";
                e.currentTarget.style.color = "oklch(0.22 0.010 65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "oklch(0.58 0.008 65)";
              }}
            >
              {expanded ? (
                <>
                  <PanelLeftClose size={15} strokeWidth={1.5} className="shrink-0" />
                  <span className="text-[12px] font-mono tracking-[0.05em]">Collapse</span>
                </>
              ) : (
                <PanelLeft size={15} strokeWidth={1.5} />
              )}
            </button>
          )}

          {/* Sign Out */}
          {showLabels ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 h-9 px-3 w-full rounded-xl transition-all duration-150 cursor-pointer"
              style={{ color: "oklch(0.58 0.008 65)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "oklch(0.55 0.20 18 / 0.07)";
                e.currentTarget.style.color = "oklch(0.50 0.20 18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "oklch(0.58 0.008 65)";
              }}
            >
              <LogOut size={15} strokeWidth={1.5} className="shrink-0" />
              <span className="text-[12px] font-mono tracking-[0.05em]">Sign Out</span>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-9 w-full rounded-xl transition-all duration-150 cursor-pointer"
                  style={{ color: "oklch(0.58 0.008 65)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "oklch(0.55 0.20 18 / 0.07)";
                    e.currentTarget.style.color = "oklch(0.50 0.20 18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.color = "oklch(0.58 0.008 65)";
                  }}
                >
                  <LogOut size={15} strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px] font-mono tracking-wide rounded-lg">
                Sign Out
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: string[];
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5 sm:mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} style={{ color: "oklch(0.65 0.008 65)" }} />}
                <span
                  className="text-[10px] font-mono tracking-[0.15em] uppercase"
                  style={{ color: "oklch(0.60 0.008 65)" }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1
          className="text-xl sm:text-2xl font-semibold font-sans tracking-tight"
          style={{ color: "oklch(0.10 0.010 65)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] sm:text-[12px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.008 65)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
