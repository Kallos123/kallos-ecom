"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?sort=newest", label: "New In" },
  { href: "/collections", label: "Collections" },
] as const;

const easeOutQuart = [0.25, 1, 0.5, 1] as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

function navLinkActive(href: string, pathname: string, sp: URLSearchParams) {
  if (href === "/shop?sort=newest") {
    return pathname === "/shop" && sp.get("sort") === "newest";
  }
  if (href === "/shop") {
    return pathname === "/shop" && sp.get("sort") !== "newest";
  }
  if (href === "/collections") {
    return pathname === "/collections" || pathname.startsWith("/collections/");
  }
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("size-9 rounded-full bg-muted/50", className)} aria-hidden />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "size-9 rounded-full text-foreground/60 hover:bg-foreground/8 hover:text-foreground",
        className
      )}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </Button>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = navLinkActive(href, pathname, searchParams);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.28em] transition-[color,background-color] duration-200",
        active
          ? "bg-kallos-gold/15 text-foreground"
          : "text-foreground/45 hover:bg-foreground/6 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function FloatingNavLink({
  href,
  children,
  onClick,
  index,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : 0.14 + index * 0.06,
        duration: reduceMotion ? 0 : 0.42,
        ease: easeOutQuart,
      }}
    >
      <NavLink href={href} onClick={onClick}>
        {children}
      </NavLink>
    </motion.div>
  );
}

function NavIconButton({
  children,
  label,
  href,
  onClick,
  badge,
  delay = 0,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const inner = (
    <motion.span
      className="relative inline-flex items-center justify-center"
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      transition={{ duration: 0.12, ease: easeOut }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-kallos-gold px-1 text-[9px] font-semibold text-kallos-black">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </motion.span>
  );

  const className =
    "relative size-9 rounded-full text-foreground/55 transition-colors duration-200 hover:bg-foreground/8 hover:text-foreground";

  const button = href ? (
    <Button variant="ghost" size="icon" className={className} asChild aria-label={label}>
      <Link href={href}>{inner}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      onClick={onClick}
    >
      {inner}
    </Button>
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: reduceMotion ? 0 : delay,
        duration: reduceMotion ? 0 : 0.38,
        ease: easeOutQuart,
      }}
      className="relative"
    >
      {button}
    </motion.div>
  );
}

function DesktopNavLinks() {
  return (
    <div className="hidden min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex">
      {NAV_LINKS.map((link, i) => (
        <FloatingNavLink key={link.href} href={link.href} index={i}>
          {link.label}
        </FloatingNavLink>
      ))}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get<{ items: { quantity: number }[] }>("/cart"),
    enabled: !!user,
  });
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api.get<{ items: unknown[] }>("/wishlist"),
    enabled: !!user,
  });

  const cartCount =
    cartData?.items?.reduce((n, item) => n + item.quantity, 0) ?? 0;
  const wishlistCount = wishlistData?.items?.length ?? 0;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-mobile-nav-toggle]")) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="pointer-events-auto flex w-full max-w-[min(88rem,calc(100vw-2rem))] flex-col gap-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -22 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: reduceMotion ? 1 : isScrolled ? 0.992 : 1,
            }}
            transition={{
              y: { duration: reduceMotion ? 0 : 0.58, ease: easeOutQuart },
              opacity: { duration: reduceMotion ? 0 : 0.5, ease: easeOutQuart },
              scale: { duration: 0.45, ease: easeOutQuart },
            }}
            className={cn(
              "rounded-2xl border bg-background/95 shadow-lg ring-1 transition-shadow duration-500 ease-out",
              "border-foreground/10 ring-black/5 dark:border-white/10 dark:ring-white/10",
              isScrolled
                ? "shadow-2xl shadow-black/12 dark:shadow-black/50"
                : "shadow-lg shadow-black/8 dark:shadow-black/30"
            )}
          >
            <div className="relative flex h-14 items-center gap-2 px-3 sm:h-[3.75rem] sm:gap-3 sm:px-5 lg:px-6">
              <Suspense
                fallback={<div className="hidden min-h-8 min-w-0 flex-1 lg:flex" aria-hidden />}
              >
                <DesktopNavLinks />
              </Suspense>

              <motion.div
                className="flex flex-1 justify-center lg:absolute lg:left-1/2 lg:flex-none lg:-translate-x-1/2"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.2,
                  duration: reduceMotion ? 0 : 0.45,
                  ease: easeOutQuart,
                }}
                whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              >
                <Link href="/" className="flex items-center py-1">
                  <Image
                    src="/kallos-logo.svg"
                    alt="KALLOS"
                    width={112}
                    height={36}
                    className="h-6 w-auto dark:hidden sm:h-7"
                    priority
                  />
                  <Image
                    src="/kallos-logo.light.svg"
                    alt="KALLOS"
                    width={112}
                    height={36}
                    className="hidden h-6 w-auto dark:block sm:h-7"
                    priority
                  />
                </Link>
              </motion.div>

              <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
                <NavIconButton
                  label="Search"
                  delay={0.24}
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="size-[18px]" strokeWidth={1.5} />
                </NavIconButton>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.28,
                    duration: reduceMotion ? 0 : 0.35,
                    ease: easeOutQuart,
                  }}
                  className="hidden sm:block"
                >
                  <ThemeToggle />
                </motion.div>
                <NavIconButton
                  label={user ? "Account" : "Sign in"}
                  href={user ? "/account" : "/login"}
                  delay={0.32}
                >
                  <User className="size-[18px]" strokeWidth={1.5} />
                </NavIconButton>
                <NavIconButton
                  label="Wishlist"
                  href="/wishlist"
                  badge={wishlistCount}
                  delay={0.36}
                >
                  <Heart className="size-[18px]" strokeWidth={1.5} />
                </NavIconButton>
                <NavIconButton label="Cart" href="/cart" badge={cartCount} delay={0.4}>
                  <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
                </NavIconButton>

                <div className="flex items-center lg:hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-mobile-nav-toggle
                    className="size-9 rounded-full text-foreground/70 hover:bg-foreground/8"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    onClick={() => setMobileMenuOpen((o) => !o)}
                  >
                    {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="lg:hidden" ref={menuRef}>
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
                  transition={{ duration: reduceMotion ? 0 : 0.26, ease: easeOutQuart }}
                  className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/95 shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:ring-white/10"
                >
                <div className="flex flex-col px-4 py-3">
                  {NAV_LINKS.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: reduceMotion ? 0 : 0.04 + i * 0.05,
                        duration: 0.28,
                        ease: easeOutQuart,
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block border-b border-foreground/5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground dark:border-white/5"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    <ThemeToggle />
                    {user ? (
                      <>
                        <Button variant="ghost" size="sm" className="uppercase tracking-wider" asChild>
                          <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                            Account
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="uppercase tracking-wider text-destructive"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logout();
                          }}
                        >
                          <LogOut className="mr-1 size-4" />
                          Out
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" className="uppercase tracking-wider" asChild>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Sign in
                        </Link>
                      </Button>
                    )}
                  </div>
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 justify-start uppercase tracking-wider"
                      asChild
                    >
                      <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>
                        <Package className="mr-2 size-4" />
                        Orders
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-60 bg-black/50 dark:bg-black/70"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: easeOutQuart }}
              className="mx-auto mt-20 max-w-xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={handleSearch}
                className="flex gap-2 rounded-2xl border border-foreground/10 bg-background/95 p-4 shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:ring-white/10"
              >
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <Button type="submit" size="sm" className="shrink-0">
                  Go
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                >
                  <X className="size-5" />
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
