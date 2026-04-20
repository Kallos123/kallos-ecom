"use client";

import { Suspense, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { formatINR } from "@/lib/format";
import {
  ShoppingCart, Heart, Search, Package, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Clock, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartUser { id: string; firstName: string; lastName: string; email: string; }
interface CartVariant {
  id: string; size: string | null; color: string | null; colorHex: string | null;
  price: number | null; stock: number;
  product: { id: string; name: string; basePrice: number; images: { url: string }[] };
}
interface CartItem { id: string; quantity: number; variant: CartVariant; }
interface Cart {
  id: string; userId: string; updatedAt: string;
  user: CartUser; items: CartItem[]; subtotal: number; totalItems: number;
}
interface CartsResponse {
  data: Cart[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

interface WishlistUser { id: string; firstName: string; lastName: string; email: string; }
interface WishlistProduct {
  id: string; name: string; basePrice: number; isActive: boolean;
  images: { url: string }[];
  _count: { variants: number };
}
interface WishlistItem { id: string; createdAt: string; product: WishlistProduct; }
interface Wishlist {
  id: string; userId: string; createdAt: string;
  user: WishlistUser; items: WishlistItem[];
  _count: { items: number };
}
interface WishlistsResponse {
  data: Wishlist[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return "just now";
}

function variantLabel(v: CartVariant) {
  const parts = [v.size, v.color].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Default";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchBar({ value, onSearch, placeholder }: {
  value: string; onSearch: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "oklch(0.62 0.008 65)" }} />
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={value}
        onKeyDown={(e) => { if (e.key === "Enter") onSearch((e.target as HTMLInputElement).value); }}
        className="w-full h-9 rounded-full pl-9 pr-4 text-[12px] font-mono focus:outline-none transition-all duration-150"
        style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.18 0.010 65)" }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "oklch(0.55 0.20 18)";
          e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.55 0.20 18 / 0.09)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "oklch(0.88 0.008 65)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function Pagination({ pagination, page, onPage }: {
  pagination: CartsResponse["meta"] | WishlistsResponse["meta"];
  page: number;
  onPage: (p: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-5 py-3"
      style={{ borderTop: "1px solid oklch(0.92 0.006 65)" }}>
      <p className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.008 65)" }}>
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={!pagination.hasPrev}
          className="h-8 w-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}>
          <ChevronLeft size={13} />
        </button>
        <button onClick={() => onPage(page + 1)} disabled={!pagination.hasNext}
          className="h-8 w-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Carts tab ────────────────────────────────────────────────────────────────

function CartsTab() {
  const router   = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("csearch") ?? "";
  const page   = parseInt(searchParams.get("cpage") ?? "1", 10);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const setParam = useCallback((key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val); else params.delete(key);
    if (key !== "cpage") params.delete("cpage");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const { data, isLoading } = useQuery<CartsResponse>({
    queryKey: ["admin-carts", search, page],
    queryFn: () => api.get(`/cart/admin/all?page=${page}&limit=15${search ? `&search=${encodeURIComponent(search)}` : ""}`),
  });

  const carts      = data?.data       ?? [];
  const pagination = data?.meta;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <SearchBar value={search} placeholder="Search by name or email..." onSearch={(v) => setParam("csearch", v)} />
        {pagination && (
          <span className="text-[11px] font-mono ml-auto" style={{ color: "oklch(0.55 0.008 65)" }}>
            {pagination.total} active carts
          </span>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "oklch(1 0 0)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                {["Customer", "Items", "Cart Value", "Last Active", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.18em] uppercase whitespace-nowrap"
                    style={{ color: "oklch(0.48 0.008 65)", background: "oklch(0.985 0.005 65)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                  {[140, 60, 80, 80].map((w, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: w }} />
                    </td>
                  ))}
                  <td className="px-4 py-3.5" />
                </tr>
              ))}

              {!isLoading && carts.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center">
                  <div className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "oklch(0.94 0.006 65)" }}>
                    <ShoppingCart size={22} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No active carts</p>
                  <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>
                    {search ? "No carts match that search" : "No customers have items in their cart"}
                  </p>
                </td></tr>
              )}

              {carts.map((cart) => {
                const isExpanded = expandedId === cart.id;
                return [
                  // ── Main row ──
                  <tr
                    key={cart.id}
                    onClick={() => setExpandedId(isExpanded ? null : cart.id)}
                    className="group transition-colors duration-100 cursor-pointer"
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid oklch(0.94 0.004 65)",
                      background: isExpanded ? "oklch(0.988 0.005 65)" : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                    onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "oklch(0.55 0.20 18 / 0.10)" }}>
                          <User size={13} strokeWidth={1.5} style={{ color: "oklch(0.55 0.20 18)" }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium leading-tight" style={{ color: "oklch(0.15 0.010 65)" }}>
                            {cart.user.firstName} {cart.user.lastName}
                          </p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.60 0.006 65)" }}>
                            {cart.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Items count + preview thumbnails */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono font-medium" style={{ color: "oklch(0.35 0.008 65)" }}>
                          {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
                        </span>
                        <div className="flex -space-x-1.5">
                          {cart.items.slice(0, 4).map((item) => {
                            const img = item.variant.product.images[0];
                            return img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={item.id} src={img.url} alt=""
                                className="size-6 rounded-md object-cover ring-2 ring-white shrink-0"
                              />
                            ) : (
                              <div key={item.id} className="size-6 rounded-md flex items-center justify-center ring-2 ring-white shrink-0"
                                style={{ background: "oklch(0.94 0.006 65)" }}>
                                <Package size={9} style={{ color: "oklch(0.62 0.006 65)" }} />
                              </div>
                            );
                          })}
                          {cart.items.length > 4 && (
                            <div className="size-6 rounded-md flex items-center justify-center ring-2 ring-white text-[9px] font-mono font-bold shrink-0"
                              style={{ background: "oklch(0.93 0.006 65)", color: "oklch(0.45 0.008 65)" }}>
                              +{cart.items.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-semibold font-mono" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {formatINR(cart.subtotal)}
                      </span>
                    </td>

                    {/* Last active */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} strokeWidth={1.5} style={{ color: "oklch(0.62 0.006 65)" }} />
                        <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.006 65)" }}>
                          {timeAgo(cart.updatedAt)}
                        </span>
                      </div>
                    </td>

                    {/* Expand chevron */}
                    <td className="px-4 py-3.5 w-8">
                      <div style={{ color: "oklch(0.62 0.006 65)" }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </td>
                  </tr>,

                  // ── Expanded items ──
                  isExpanded && (
                    <tr key={`${cart.id}-items`} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                      <td colSpan={5} className="px-0 pb-0 pt-0">
                        <div style={{ background: "oklch(0.985 0.004 65)", borderTop: "1px solid oklch(0.92 0.006 65)" }}>
                          <table className="w-full">
                            <thead>
                              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                                {["Product", "Variant", "Qty", "Unit Price", "Line Total"].map((h) => (
                                  <th key={h} className="px-5 py-2 text-left text-[9px] font-mono tracking-[0.15em] uppercase"
                                    style={{ color: "oklch(0.58 0.008 65)" }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cart.items.map((item) => {
                                const price = item.variant.price ?? item.variant.product.basePrice;
                                const img   = item.variant.product.images[0];
                                return (
                                  <tr key={item.id} style={{ borderBottom: "1px solid oklch(0.92 0.006 65 / 0.6)" }}>
                                    <td className="px-5 py-2.5">
                                      <div className="flex items-center gap-2.5">
                                        {img ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={img.url} alt="" className="size-9 rounded-lg object-cover shrink-0"
                                            style={{ border: "1px solid oklch(0.91 0.006 65)" }} />
                                        ) : (
                                          <div className="size-9 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: "oklch(0.94 0.006 65)" }}>
                                            <Package size={12} style={{ color: "oklch(0.62 0.006 65)" }} />
                                          </div>
                                        )}
                                        <Link href={`/admin/products/${item.variant.product.id}`}
                                          className="text-[12px] font-medium hover:underline"
                                          style={{ color: "oklch(0.22 0.010 65)" }}
                                          onClick={(e) => e.stopPropagation()}>
                                          {item.variant.product.name}
                                        </Link>
                                      </div>
                                    </td>
                                    <td className="px-5 py-2.5">
                                      <div className="flex items-center gap-1.5">
                                        {item.variant.colorHex && (
                                          <span className="size-3 rounded-full border border-black/10 shrink-0"
                                            style={{ background: item.variant.colorHex }} />
                                        )}
                                        <span className="text-[11px] font-mono" style={{ color: "oklch(0.48 0.008 65)" }}>
                                          {variantLabel(item.variant)}
                                        </span>
                                        {item.variant.stock <= 5 && (
                                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                                            style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" }}>
                                            {item.variant.stock === 0 ? "Out of stock" : `${item.variant.stock} left`}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-5 py-2.5">
                                      <span className="text-[12px] font-mono font-medium" style={{ color: "oklch(0.35 0.008 65)" }}>
                                        ×{item.quantity}
                                      </span>
                                    </td>
                                    <td className="px-5 py-2.5">
                                      <span className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.008 65)" }}>
                                        {formatINR(Number(price))}
                                      </span>
                                    </td>
                                    <td className="px-5 py-2.5">
                                      <span className="text-[12px] font-mono font-semibold" style={{ color: "oklch(0.22 0.010 65)" }}>
                                        {formatINR(Number(price) * item.quantity)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={4} className="px-5 py-2.5 text-right text-[11px] font-mono"
                                  style={{ color: "oklch(0.52 0.008 65)" }}>
                                  Cart Total
                                </td>
                                <td className="px-5 py-2.5">
                                  <span className="text-[13px] font-mono font-bold" style={{ color: "oklch(0.55 0.20 18)" }}>
                                    {formatINR(cart.subtotal)}
                                  </span>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ),
                ].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination pagination={pagination} page={page} onPage={(p) => setParam("cpage", String(p))} />
        )}
      </div>
    </div>
  );
}

// ─── Wishlists tab ────────────────────────────────────────────────────────────

function WishlistsTab() {
  const router   = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("wsearch") ?? "";
  const page   = parseInt(searchParams.get("wpage") ?? "1", 10);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const setParam = useCallback((key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val); else params.delete(key);
    if (key !== "wpage") params.delete("wpage");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const { data, isLoading } = useQuery<WishlistsResponse>({
    queryKey: ["admin-wishlists", search, page],
    queryFn: () => api.get(`/wishlist/admin/all?page=${page}&limit=15${search ? `&search=${encodeURIComponent(search)}` : ""}`),
  });

  const wishlists  = data?.data       ?? [];
  const pagination = data?.meta;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <SearchBar value={search} placeholder="Search by name or email..." onSearch={(v) => setParam("wsearch", v)} />
        {pagination && (
          <span className="text-[11px] font-mono ml-auto" style={{ color: "oklch(0.55 0.008 65)" }}>
            {pagination.total} wishlists
          </span>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "oklch(1 0 0)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                {["Customer", "Items", "Preview", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.18em] uppercase whitespace-nowrap"
                    style={{ color: "oklch(0.48 0.008 65)", background: "oklch(0.985 0.005 65)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                  {[140, 60, 120, 80].map((w, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: w }} />
                    </td>
                  ))}
                  <td className="px-4 py-3.5" />
                </tr>
              ))}

              {!isLoading && wishlists.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center">
                  <div className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "oklch(0.94 0.006 65)" }}>
                    <Heart size={22} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No wishlists</p>
                  <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>
                    {search ? "No wishlists match that search" : "No customers have saved products to a wishlist"}
                  </p>
                </td></tr>
              )}

              {wishlists.map((wl) => {
                const isExpanded = expandedId === wl.id;
                return [
                  // ── Main row ──
                  <tr
                    key={wl.id}
                    onClick={() => setExpandedId(isExpanded ? null : wl.id)}
                    className="group transition-colors duration-100 cursor-pointer"
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid oklch(0.94 0.004 65)",
                      background: isExpanded ? "oklch(0.988 0.005 65)" : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                    onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "oklch(0.55 0.20 18 / 0.10)" }}>
                          <User size={13} strokeWidth={1.5} style={{ color: "oklch(0.55 0.20 18)" }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium leading-tight" style={{ color: "oklch(0.15 0.010 65)" }}>
                            {wl.user.firstName} {wl.user.lastName}
                          </p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.60 0.006 65)" }}>
                            {wl.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Count */}
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-mono font-medium" style={{ color: "oklch(0.35 0.008 65)" }}>
                        {wl._count.items} item{wl._count.items !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Preview thumbnails */}
                    <td className="px-4 py-3.5">
                      <div className="flex -space-x-1.5">
                        {wl.items.slice(0, 5).map((item) => {
                          const img = item.product.images[0];
                          return img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={item.id} src={img.url} alt=""
                              className="size-7 rounded-lg object-cover ring-2 ring-white shrink-0"
                            />
                          ) : (
                            <div key={item.id} className="size-7 rounded-lg flex items-center justify-center ring-2 ring-white shrink-0"
                              style={{ background: "oklch(0.94 0.006 65)" }}>
                              <Package size={9} style={{ color: "oklch(0.62 0.006 65)" }} />
                            </div>
                          );
                        })}
                        {wl._count.items > 5 && (
                          <div className="size-7 rounded-lg flex items-center justify-center ring-2 ring-white text-[9px] font-mono font-bold shrink-0"
                            style={{ background: "oklch(0.93 0.006 65)", color: "oklch(0.45 0.008 65)" }}>
                            +{wl._count.items - 5}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} strokeWidth={1.5} style={{ color: "oklch(0.62 0.006 65)" }} />
                        <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.006 65)" }}>
                          {timeAgo(wl.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Expand */}
                    <td className="px-4 py-3.5 w-8">
                      <div style={{ color: "oklch(0.62 0.006 65)" }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </td>
                  </tr>,

                  // ── Expanded items ──
                  isExpanded && (
                    <tr key={`${wl.id}-items`} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                      <td colSpan={5} className="px-0 pb-0 pt-0">
                        <div style={{ background: "oklch(0.985 0.004 65)", borderTop: "1px solid oklch(0.92 0.006 65)" }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                            {wl.items.map((item) => {
                              const img  = item.product.images[0];
                              const inStock = item.product._count.variants > 0;
                              return (
                                <div key={item.id}
                                  className="flex items-center gap-3 p-3 rounded-xl"
                                  style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.006 65)" }}>
                                  {img ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={img.url} alt="" className="size-12 rounded-xl object-cover shrink-0"
                                      style={{ border: "1px solid oklch(0.91 0.006 65)" }} />
                                  ) : (
                                    <div className="size-12 rounded-xl flex items-center justify-center shrink-0"
                                      style={{ background: "oklch(0.94 0.006 65)" }}>
                                      <Package size={14} style={{ color: "oklch(0.62 0.006 65)" }} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <Link
                                      href={`/admin/products/${item.product.id}`}
                                      className="text-[12px] font-medium leading-tight hover:underline block truncate"
                                      style={{ color: "oklch(0.18 0.010 65)" }}
                                      onClick={(e) => e.stopPropagation()}>
                                      {item.product.name}
                                    </Link>
                                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.52 0.008 65)" }}>
                                      {formatINR(item.product.basePrice)}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {!item.product.isActive && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                                          style={{ background: "oklch(0.93 0.006 65)", color: "oklch(0.52 0.008 65)" }}>
                                          Inactive
                                        </span>
                                      )}
                                      {!inStock && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                                          style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" }}>
                                          Out of stock
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination pagination={pagination} page={page} onPage={(p) => setParam("wpage", String(p))} />
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "carts" | "wishlists";

function CartsPageContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const tab          = (searchParams.get("tab") as Tab) ?? "carts";

  function setTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    params.delete("cpage"); params.delete("csearch");
    params.delete("wpage"); params.delete("wsearch");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <PageHeader title="Carts & Wishlists" subtitle="Customer shopping activity" />

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-full w-fit"
        style={{ background: "oklch(0.96 0.004 65)" }}>
        {([
          { key: "carts",     label: "Active Carts",  icon: ShoppingCart },
          { key: "wishlists", label: "Wishlists",      icon: Heart },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="h-8 px-4 rounded-full text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all duration-150"
            style={tab === key
              ? { background: "oklch(1 0 0)", color: "oklch(0.22 0.010 65)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.08)" }
              : { color: "oklch(0.55 0.008 65)" }
            }
          >
            <Icon size={12} strokeWidth={tab === key ? 2 : 1.5} />
            {label}
          </button>
        ))}
      </div>

      {tab === "carts"     && <CartsTab />}
      {tab === "wishlists" && <WishlistsTab />}
    </div>
  );
}

export default function CartsPage() {
  return (
    <Suspense>
      <CartsPageContent />
    </Suspense>
  );
}
