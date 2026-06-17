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
  { href: "/shop?sort=newest", label: "New in" },
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
      <div className={cn("size-9 bg-muted/40", className)} aria-hidden />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "size-9 rounded-none text-foreground/45 hover:bg-transparent hover:text-foreground",
        className
      )}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
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
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative py-1 text-[10px] font-medium uppercase tracking-[0.32em] transition-colors duration-300",
        active ? "text-foreground" : "text-foreground/40 hover:text-foreground/80"
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-px left-0 h-px bg-kallos-crimson transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          active ? "w-full scale-x-100" : "w-full origin-left scale-x-0 group-hover:scale-x-100"
        )}
      />
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
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : 0.1 + index * 0.05,
        duration: reduceMotion ? 0 : 0.4,
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
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.12, ease: easeOut }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 z-10 flex h-3.5 min-w-3.5 items-center justify-center bg-kallos-crimson px-0.5 text-[8px] font-semibold leading-none text-kallos-ivory">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </motion.span>
  );

  const className =
    "relative size-9 rounded-none text-foreground/45 transition-colors duration-200 hover:bg-transparent hover:text-foreground";

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
      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : delay,
        duration: reduceMotion ? 0 : 0.35,
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
    <nav
      className="hidden items-center justify-center gap-10 lg:flex"
      aria-label="Main"
    >
      {NAV_LINKS.map((link, i) => (
        <FloatingNavLink key={link.href} href={link.href} index={i}>
          {link.label}
        </FloatingNavLink>
      ))}
    </nav>
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
    const onScroll = () => setIsScrolled(window.scrollY > 12);
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

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-out",
          isScrolled
            ? "border-b border-border/70 bg-background/88 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]"
            : "border-b border-transparent bg-background/40 backdrop-blur-sm"
        )}
      >
        <div className="mx-auto flex h-15 max-w-[1400px] items-center px-5 sm:h-16 sm:px-8 lg:px-12">
          <div className="relative flex w-full items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-mobile-nav-toggle
              className="relative z-20 size-9 shrink-0 rounded-none text-foreground/70 hover:bg-transparent hover:text-foreground lg:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              {mobileMenuOpen ? (
                <X className="size-4.5" strokeWidth={1.5} />
              ) : (
                <Menu className="size-4.5" strokeWidth={1.5} />
              )}
            </Button>

            <div className="pointer-events-none absolute inset-x-0 flex justify-center lg:static lg:col-start-1 lg:justify-start lg:justify-self-start">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.45,
                  ease: easeOutQuart,
                }}
                className="pointer-events-auto"
              >
                <Link href="/" className="flex items-center py-0.5">
                  <Image
                    src="/kallos-logo.svg"
                    alt="KALLOS"
                    width={168}
                    height={56}
                    className="h-8 w-auto dark:hidden sm:h-9 lg:h-10"
                    priority
                  />
                  <Image
                    src="/kallos-logo.light.svg"
                    alt="KALLOS"
                    width={168}
                    height={56}
                    className="hidden h-8 w-auto dark:block sm:h-9 lg:h-10"
                    priority
                  />
                </Link>
              </motion.div>
            </div>

            <div className="hidden lg:col-start-2 lg:flex lg:justify-center">
              <Suspense
                fallback={<div className="h-8 w-[280px]" aria-hidden />}
              >
                <DesktopNavLinks />
              </Suspense>
            </div>

            <div className="relative z-20 flex shrink-0 items-center justify-end gap-0 sm:gap-0.5 lg:col-start-3">
              <span className="mr-1 hidden h-3 w-px bg-border/80 sm:block" aria-hidden />
              <NavIconButton
                label="Search"
                delay={0.12}
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-[17px]" strokeWidth={1.25} />
              </NavIconButton>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.16,
                  duration: reduceMotion ? 0 : 0.32,
                  ease: easeOutQuart,
                }}
                className="hidden sm:block"
              >
                <ThemeToggle />
              </motion.div>
              <NavIconButton
                label={user ? "Account" : "Sign in"}
                href={user ? "/account" : "/login"}
                delay={0.2}
              >
                <User className="size-[17px]" strokeWidth={1.25} />
              </NavIconButton>
              <NavIconButton
                label="Wishlist"
                href="/wishlist"
                badge={wishlistCount}
                delay={0.24}
              >
                <Heart className="size-[17px]" strokeWidth={1.25} />
              </NavIconButton>
              <NavIconButton label="Cart" href="/cart" badge={cartCount} delay={0.28}>
                <ShoppingBag className="size-[17px]" strokeWidth={1.25} />
              </NavIconButton>
            </div>
          </div>
        </div>

        <div className="lg:hidden" ref={menuRef}>
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.32, ease: easeOutQuart }}
                id="mobile-nav-menu"
                className="overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-md"
              >
                <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8">
                  <nav className="flex flex-col gap-1" aria-label="Mobile main">
                    {NAV_LINKS.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: reduceMotion ? 0 : 0.04 + i * 0.04,
                          duration: 0.28,
                          ease: easeOutQuart,
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block border-b border-border/50 py-3.5 text-[10px] font-medium uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/40 pt-6">
                    <ThemeToggle />
                    {user ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-none px-3 text-[10px] uppercase tracking-[0.2em]"
                          asChild
                        >
                          <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                            Account
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-none px-3 text-[10px] uppercase tracking-[0.2em] text-destructive hover:text-destructive"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logout();
                          }}
                        >
                          <LogOut className="mr-1.5 size-3.5" strokeWidth={1.5} />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-none px-3 text-[10px] uppercase tracking-[0.2em]"
                        asChild
                      >
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
                      className="mt-2 h-9 justify-start rounded-none px-0 text-[10px] uppercase tracking-[0.2em]"
                      asChild
                    >
                      <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>
                        <Package className="mr-2 size-3.5" strokeWidth={1.5} />
                        Orders
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-100 bg-background/85 dark:bg-background/90"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOutQuart }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="site-search-heading"
              className="mx-auto max-w-2xl px-6 pt-20 sm:px-10 sm:pt-24"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-baseline justify-between gap-6">
                <h2
                  id="site-search-heading"
                  className="text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/35"
                >
                  Search
                </h2>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-[10px] font-medium uppercase tracking-[0.35em] text-foreground/35 transition-colors duration-300 hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <form
                onSubmit={handleSearch}
                className="mt-10 flex flex-col gap-6 border-b border-foreground/15 pb-4 transition-colors focus-within:border-foreground/35 sm:flex-row sm:items-end sm:gap-5"
              >
                <label htmlFor="site-search-input" className="sr-only">
                  Search the store
                </label>
                <div className="flex min-w-0 flex-1 items-end gap-3">
                  <Search
                    className="size-4.5 shrink-0 text-foreground/25"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <input
                    id="site-search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type a product name…"
                    aria-label="Search the store"
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 font-editorial text-2xl leading-tight text-foreground outline-none placeholder:text-foreground/25 sm:text-3xl"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 self-start text-left text-[10px] font-medium uppercase tracking-[0.35em] text-kallos-crimson/90 transition-colors duration-300 hover:text-kallos-crimson sm:self-auto sm:pb-1"
                >
                  Submit
                </button>
              </form>

              <p className="mt-8 text-[10px] tracking-[0.12em] text-foreground/30">
                Press <kbd className="font-sans text-foreground/45">Esc</kbd> to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
