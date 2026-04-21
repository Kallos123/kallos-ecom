"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { NotificationsBell } from "@/components/admin/notifications-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAdmin, clearUser, getStoredUser } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { useSidebar } from "@/components/admin/sidebar-context";

export function Topbar() {
  const router = useRouter();
  const { expanded, openMobile } = useSidebar();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function handleLogout() {
    logoutAdmin();
    clearUser();
    router.push("/login");
  }

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "AD";
  const fullName = user ? `${user.firstName} ${user.lastName}` : null;

  const leftOffset = isMobile ? 0 : expanded ? 240 : 60;

  return (
    <header
      className="fixed top-0 right-0 h-14 flex items-center justify-between px-4 sm:px-5 z-30"
      style={{
        left: leftOffset,
        background: "oklch(1 0 0)",
        boxShadow: "0 1px 0 oklch(0.89 0.007 65)",
        transition: "left 0.2s ease-in-out",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={openMobile}
            className="flex items-center justify-center size-8 rounded-xl transition-colors cursor-pointer"
            style={{ color: "oklch(0.40 0.008 65)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "oklch(0.94 0.008 65)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
          >
            <Menu size={17} strokeWidth={1.8} />
          </button>
        )}

        {/* Brand label */}
        <span
          className="text-[12px] sm:text-[13px] tracking-[0.15em] sm:tracking-[0.18em] uppercase font-semibold font-sans select-none"
          style={{ color: "oklch(0.28 0.008 65)" }}
        >
          {isMobile ? "KALLOS" : "Admin Console"}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        <NotificationsBell />

        <div className="h-5 w-px mx-1" style={{ background: "oklch(0.89 0.007 65)" }} />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 h-8 px-2 sm:px-2.5 rounded-xl outline-none transition-all duration-150 cursor-pointer"
              style={{ color: "oklch(0.35 0.008 65)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "oklch(0.94 0.008 65)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            >
              <div
                className="size-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "oklch(0.55 0.20 18 / 0.11)",
                  border: "1.5px solid oklch(0.55 0.20 18 / 0.22)",
                }}
              >
                <span className="text-[9px] font-mono font-bold leading-none" style={{ color: "oklch(0.48 0.20 18)" }}>
                  {initials}
                </span>
              </div>

              {fullName && !isMobile && (
                <span className="text-[12px] font-mono" style={{ color: "oklch(0.40 0.008 65)" }}>
                  {fullName}
                </span>
              )}

              {!isMobile && (
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ color: "oklch(0.62 0.006 65)" }}>
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 rounded-2xl overflow-hidden p-1.5"
            style={{
              boxShadow: "0 8px 30px -4px oklch(0 0 0 / 0.10), 0 2px 8px -2px oklch(0 0 0 / 0.06)",
              border: "1px solid oklch(0.89 0.007 65)",
            }}
          >
            {user && (
              <>
                <div className="px-3 pt-2 pb-2.5">
                  <p className="text-[10px] font-mono tracking-[0.12em] uppercase mb-0.5" style={{ color: "oklch(0.65 0.008 65)" }}>
                    Signed in as
                  </p>
                  <p className="text-[12px] font-mono truncate" style={{ color: "oklch(0.25 0.010 65)" }}>
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator style={{ background: "oklch(0.90 0.006 65)" }} />
              </>
            )}
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-xl mx-0 my-0.5 font-mono text-[12px]"
              style={{ color: "oklch(0.50 0.20 18)" }}
            >
              <LogOut size={12} className="mr-2 shrink-0" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
