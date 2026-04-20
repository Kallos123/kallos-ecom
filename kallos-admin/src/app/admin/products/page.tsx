"use client";

import { Suspense, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { formatINR } from "@/lib/format";
import {
  Plus, Search, Package, ChevronLeft, ChevronRight, ArrowRight,
  TriangleAlert, Eye, EyeOff, X, PackageX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface ProductVariant { id: string; stock: number; }

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  images: { id: string; url: string; sortOrder: number }[];
  variants: ProductVariant[];
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number; page: number; limit: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

interface CategoriesResponse { data: { id: string; name: string; slug: string }[] }
interface SubcategoriesResponse { data: { id: string; name: string; slug: string; categoryId: string }[] }

const LOW_STOCK_THRESHOLD = 10;

function totalStock(variants: ProductVariant[]) {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium"
        style={{ color: "oklch(0.45 0.18 18)", background: "oklch(0.55 0.20 18 / 0.08)", border: "1px solid oklch(0.55 0.20 18 / 0.20)" }}>
        Out of stock
      </span>
    );
  if (stock <= LOW_STOCK_THRESHOLD)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium"
        style={{ color: "oklch(0.50 0.14 65)", background: "oklch(0.97 0.08 65 / 0.5)", border: "1px solid oklch(0.80 0.10 65 / 0.50)" }}>
        <TriangleAlert size={9} strokeWidth={2.5} />
        Low · {stock}
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium"
      style={{ color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.30)", border: "1px solid oklch(0.72 0.10 155 / 0.40)" }}>
      {stock} in stock
    </span>
  );
}

function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="size-4 rounded flex items-center justify-center shrink-0 transition-all"
      style={{
        border: checked || indeterminate
          ? "1.5px solid oklch(0.55 0.20 18)"
          : "1.5px solid oklch(0.78 0.008 65)",
        background: checked || indeterminate ? "oklch(0.55 0.20 18)" : "oklch(1 0 0)",
      }}
    >
      {indeterminate && !checked
        ? <span style={{ width: 8, height: 1.5, background: "white", display: "block", borderRadius: 2 }} />
        : checked
          ? <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          : null}
    </button>
  );
}

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingBulk, setPendingBulk] = useState<{ ids: string[]; isActive: boolean } | null>(null);

  const search      = searchParams.get("search")      ?? "";
  const parentCat   = searchParams.get("parentCat")   ?? "";
  const category    = searchParams.get("category")    ?? "";
  const stockAlert  = searchParams.get("stockAlert")  ?? ""; // "low" | "out" | ""
  const page        = parseInt(searchParams.get("page") ?? "1", 10);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      if (key !== "page") params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  function setParentCat(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("parentCat", value); else params.delete("parentCat");
    params.delete("category");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const qs = new URLSearchParams({
    ...(search                       ? { search }                    : {}),
    ...(parentCat                    ? { category: parentCat }       : {}),
    ...(category                     ? { subcategory: category }     : {}),
    ...(stockAlert === "low"         ? { lowStock: "true" }          : {}),
    ...(stockAlert === "out"         ? { outOfStock: "true" }        : {}),
    page: String(page),
    limit: "20",
  }).toString();

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["admin-products", search, parentCat, category, stockAlert, page],
    queryFn: () => api.get(`/products/admin/all?${qs}`),
  });

  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: subcategoriesData } = useQuery<SubcategoriesResponse>({
    queryKey: ["subcategories"],
    queryFn: () => api.get("/categories/subcategories"),
    staleTime: 5 * 60 * 1000,
  });

  const products   = productsData?.data       ?? [];
  const pagination = productsData?.meta;
  const categories = categoriesData?.data     ?? [];
  const allSubs    = subcategoriesData?.data  ?? [];
  const visibleSubs = parentCat ? allSubs.filter((s) => s.categoryId === parentCat) : [];

  // Stock counts from current page (only meaningful when no stock filter is active)
  const lowStockCount   = products.filter((p) => { const s = totalStock(p.variants); return s > 0 && s <= LOW_STOCK_THRESHOLD; }).length;
  const outOfStockCount = products.filter((p) => totalStock(p.variants) === 0).length;

  // Bulk status mutation
  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      api.patch("/products/admin/bulk-status", { ids, isActive }),
    onSuccess: (_res, vars) => {
      toast.success(`${vars.ids.length} product(s) ${vars.isActive ? "activated" : "deactivated"}`);
      setSelected(new Set());
      setPendingBulk(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Selection helpers
  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));
  const someSelected = products.some((p) => selected.has(p.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selectedIds = [...selected];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={pagination ? `${pagination.total} products` : undefined}
        action={
          <Link
            href="/admin/products/new"
            className="h-9 px-4 rounded-full text-[11px] font-mono font-semibold flex items-center gap-2 transition-opacity hover:opacity-85"
            style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
          >
            <Plus size={13} strokeWidth={2.5} /> New Product
          </Link>
        }
      />

      {/* ── Bulk action bar ── */}
      {selectedIds.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-4 flex-wrap"
          style={{
            background: "oklch(1 0 0)",
            border: "1px solid oklch(0.55 0.20 18 / 0.25)",
            boxShadow: "0 1px 4px oklch(0 0 0 / 0.06)",
          }}
        >
          <span className="text-[12px] font-mono font-medium shrink-0" style={{ color: "oklch(0.35 0.010 65)" }}>
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setPendingBulk({ ids: selectedIds, isActive: true })}
              disabled={bulkStatusMutation.isPending}
              className="h-7 px-3 rounded-full text-[10px] font-mono font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "oklch(0.93 0.06 155 / 0.30)", color: "oklch(0.38 0.10 155)", border: "1px solid oklch(0.72 0.10 155 / 0.40)" }}
            >
              <Eye size={11} /> Activate
            </button>
            <button
              onClick={() => setPendingBulk({ ids: selectedIds, isActive: false })}
              disabled={bulkStatusMutation.isPending}
              className="h-7 px-3 rounded-full text-[10px] font-mono font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)", border: "1px solid oklch(0.65 0.15 18 / 0.35)" }}
            >
              <EyeOff size={11} /> Deactivate
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="size-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 ml-1"
              style={{ color: "oklch(0.62 0.006 65)" }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "oklch(0.62 0.008 65)" }} />
          <input
            type="text"
            placeholder="Search products..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value);
            }}
            className="w-full sm:w-60 h-9 rounded-full pl-9 pr-4 text-[12px] font-mono focus:outline-none transition-all duration-150"
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

        {/* Category */}
        <Select value={parentCat} onValueChange={(val) => setParentCat(val as string)}>
          <SelectTrigger className="h-9 rounded-full px-4 text-[12px] font-mono min-w-[148px] border-[oklch(0.88_0.008_65)] focus-visible:ring-[oklch(0.55_0.20_18_/_0.15)] focus-visible:border-[oklch(0.55_0.20_18)]">
            <span className="text-[12px] font-mono" style={{ color: parentCat ? "oklch(0.18 0.010 65)" : "oklch(0.52 0.008 65)" }}>
              {parentCat ? (categories.find((c) => c.id === parentCat)?.name ?? "All Categories") : "All Categories"}
            </span>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="rounded-2xl border-[oklch(0.90_0.006_65)] shadow-lg p-1">
            <SelectItem value="" className="rounded-xl text-[12px] font-mono cursor-pointer">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id} className="rounded-xl text-[12px] font-mono cursor-pointer">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Subcategory */}
        {visibleSubs.length > 0 && (
          <Select value={category} onValueChange={(val) => setParam("category", val as string)}>
            <SelectTrigger className="h-9 rounded-full px-4 text-[12px] font-mono min-w-[168px] border-[oklch(0.88_0.008_65)] focus-visible:ring-[oklch(0.55_0.20_18_/_0.15)] focus-visible:border-[oklch(0.55_0.20_18)]">
              <span className="text-[12px] font-mono" style={{ color: category ? "oklch(0.18 0.010 65)" : "oklch(0.52 0.008 65)" }}>
                {category ? (visibleSubs.find((s) => s.id === category)?.name ?? "All Subcategories") : "All Subcategories"}
              </span>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start" className="rounded-2xl border-[oklch(0.90_0.006_65)] shadow-lg p-1">
              <SelectItem value="" className="rounded-xl text-[12px] font-mono cursor-pointer">All Subcategories</SelectItem>
              {visibleSubs.map((s) => (
                <SelectItem key={s.id} value={s.id} className="rounded-xl text-[12px] font-mono cursor-pointer">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Low stock chip */}
        <button
          onClick={() => setParam("stockAlert", stockAlert === "low" ? "" : "low")}
          className="h-9 px-3.5 rounded-full text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all"
          style={stockAlert === "low"
            ? { background: "oklch(0.97 0.08 65 / 0.7)", color: "oklch(0.42 0.14 65)", border: "1.5px solid oklch(0.78 0.10 65 / 0.60)" }
            : { background: "oklch(1 0 0)", color: "oklch(0.52 0.008 65)", border: "1px solid oklch(0.88 0.008 65)" }
          }
        >
          <TriangleAlert size={12} strokeWidth={2} />
          Low Stock
          {lowStockCount > 0 && !stockAlert && (
            <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-mono font-bold"
              style={{ background: "oklch(0.62 0.12 65)", color: "white" }}>
              {lowStockCount}
            </span>
          )}
        </button>

        {/* Out of stock chip */}
        <button
          onClick={() => setParam("stockAlert", stockAlert === "out" ? "" : "out")}
          className="h-9 px-3.5 rounded-full text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all"
          style={stockAlert === "out"
            ? { background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)", border: "1.5px solid oklch(0.65 0.15 18 / 0.40)" }
            : { background: "oklch(1 0 0)", color: "oklch(0.52 0.008 65)", border: "1px solid oklch(0.88 0.008 65)" }
          }
        >
          <PackageX size={12} strokeWidth={2} />
          Out of Stock
          {outOfStockCount > 0 && !stockAlert && (
            <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-mono font-bold"
              style={{ background: "oklch(0.55 0.20 18)", color: "white" }}>
              {outOfStockCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Stock filter summary strip ── */}
      {stockAlert === "low" && !isLoading && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 flex-wrap text-[11px] font-mono"
          style={{ background: "oklch(0.97 0.08 65 / 0.35)", border: "1px solid oklch(0.82 0.10 65 / 0.40)", color: "oklch(0.42 0.14 65)" }}
        >
          <TriangleAlert size={13} strokeWidth={2} />
          <span>Products with 1–{LOW_STOCK_THRESHOLD} units in at least one variant</span>
          <button onClick={() => setParam("stockAlert", "")}
            className="ml-auto text-[10px] underline underline-offset-2 opacity-70 hover:opacity-100">
            Clear filter
          </button>
        </div>
      )}
      {stockAlert === "out" && !isLoading && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 flex-wrap text-[11px] font-mono"
          style={{ background: "oklch(0.55 0.20 18 / 0.06)", border: "1px solid oklch(0.65 0.15 18 / 0.30)", color: "oklch(0.48 0.18 18)" }}
        >
          <PackageX size={13} strokeWidth={2} />
          <span>Products with zero stock across all variants</span>
          <button onClick={() => setParam("stockAlert", "")}
            className="ml-auto text-[10px] underline underline-offset-2 opacity-70 hover:opacity-100">
            Clear filter
          </button>
        </div>
      )}

      {/* ── Table card ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "oklch(1 0 0)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                {/* Select-all checkbox */}
                <th className="pl-4 pr-2 py-3 w-8" style={{ background: "oklch(0.985 0.005 65)" }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                  />
                </th>
                {["Product", "Category", "Price", "Variants", "Stock", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.18em] uppercase font-medium whitespace-nowrap"
                    style={{ color: "oklch(0.48 0.008 65)", background: "oklch(0.985 0.005 65)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                  <td className="pl-4 pr-2 py-3.5">
                    <div className="size-4 rounded animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl animate-pulse shrink-0" style={{ background: "oklch(0.93 0.004 65)" }} />
                      <div className="space-y-1.5">
                        <div className="h-3 w-32 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                        <div className="h-2.5 w-20 rounded-full animate-pulse" style={{ background: "oklch(0.95 0.003 65)" }} />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3 w-16 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                    </td>
                  ))}
                  <td className="px-4 py-3.5" />
                </tr>
              ))}

              {/* Empty */}
              {!isLoading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-20 text-center">
                    <div className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.94 0.006 65)" }}>
                      <Package size={22} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No products found</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>
                      {stockAlert === "low" ? "No products with low stock right now 🎉"
                        : stockAlert === "out" ? "No out-of-stock products right now 🎉"
                        : "Try adjusting your filters or add a new product"}
                    </p>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {products.map((product) => {
                const stock = totalStock(product.variants);
                const thumb = product.images.sort((a, b) => a.sortOrder - b.sortOrder)[0];
                const isChecked = selected.has(product.id);

                return (
                  <tr
                    key={product.id}
                    className="group transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid oklch(0.94 0.004 65)",
                      background: isChecked ? "oklch(0.55 0.20 18 / 0.04)" : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-3.5">
                      <Checkbox checked={isChecked} onChange={() => toggleOne(product.id)} />
                    </td>

                    {/* Product + thumbnail */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
                          style={{ background: "oklch(0.94 0.006 65)" }}>
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb.url} alt={product.name} className="size-11 object-cover" />
                          ) : (
                            <Package size={16} strokeWidth={1.5} style={{ color: "oklch(0.65 0.008 65)" }} />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium leading-tight" style={{ color: "oklch(0.15 0.010 65)" }}>
                            {product.name}
                          </p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.60 0.006 65)" }}>
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[12px]" style={{ color: "oklch(0.45 0.008 65)" }}>
                        {product.category?.name ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-semibold font-mono" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {formatINR(product.basePrice)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.008 65)" }}>
                        {product.variants.length}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <StockBadge stock={stock} />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border",
                          product.isActive
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-neutral-500 bg-neutral-100 border-neutral-200"
                        )}>
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                        {product.isFeatured && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border"
                            style={{ color: "oklch(0.48 0.18 18)", background: "oklch(0.55 0.20 18 / 0.07)", borderColor: "oklch(0.55 0.20 18 / 0.22)" }}>
                            Featured
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-1 text-[11px] font-mono opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                        style={{ color: "oklch(0.55 0.20 18)" }}
                      >
                        Edit <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-5 py-3"
            style={{ borderTop: "1px solid oklch(0.92 0.006 65)" }}
          >
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.008 65)" }}>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} products
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setParam("page", String(page - 1))}
                disabled={!pagination.hasPrev}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setParam("page", String(page + 1))}
                disabled={!pagination.hasNext}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── Bulk action confirm ── */}
      <ConfirmDialog
        open={!!pendingBulk}
        variant={pendingBulk?.isActive ? "success" : "danger"}
        title={pendingBulk?.isActive
          ? `Activate ${pendingBulk.ids.length} product${pendingBulk.ids.length > 1 ? "s" : ""}?`
          : `Deactivate ${pendingBulk?.ids.length} product${(pendingBulk?.ids.length ?? 0) > 1 ? "s" : ""}?`}
        description={pendingBulk?.isActive
          ? "These products will become visible to customers on the storefront."
          : "These products will be hidden from the storefront immediately."}
        confirmLabel={pendingBulk?.isActive ? "Activate" : "Deactivate"}
        loading={bulkStatusMutation.isPending}
        onConfirm={() => pendingBulk && bulkStatusMutation.mutate(pendingBulk)}
        onCancel={() => setPendingBulk(null)}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
