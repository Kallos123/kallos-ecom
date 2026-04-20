"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Layers, FolderTree,
  GripVertical, ImagePlus, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  _count?: { subcategories: number; products: number };
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  imageUrl: string | null;
  sortOrder: number;
  category?: { id: string; name: string };
  _count?: { products: number };
}

const categorySchema = z.object({
  name: z.string().min(2, "Minimum 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens"),
  description: z.string().optional(),
});

const subcategorySchema = z.object({
  name: z.string().min(2, "Minimum 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens"),
  categoryId: z.string().min(1, "Parent category required"),
  description: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;
type SubcategoryForm = z.infer<typeof subcategorySchema>;
type SheetMode = "category" | "subcategory";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

const inputCls =
  "w-full h-10 rounded-xl bg-input border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors";

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormRow({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono tracking-[0.15em] uppercase" style={{ color: "oklch(0.52 0.008 65)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "oklch(0.55 0.20 18)" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] font-mono" style={{ color: "oklch(0.50 0.18 18)" }}>{error}</p>}
    </div>
  );
}

function ImageUploadWidget({
  currentUrl,
  onUpload,
  onRemove,
  loading,
}: {
  currentUrl: string | null;
  onUpload: (base64: string) => void;
  onRemove: () => void;
  loading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className="relative size-24 rounded-2xl overflow-hidden shrink-0 cursor-pointer select-none"
        onClick={() => !loading && inputRef.current?.click()}
        style={{
          border: currentUrl
            ? "1px solid oklch(0.91 0.006 65)"
            : "1.5px dashed oklch(0.82 0.006 65)",
          background: "oklch(0.97 0.003 65)",
        }}
      >
        {currentUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "oklch(0 0 0 / 0.35)" }}>
                <Loader2 size={16} className="animate-spin" style={{ color: "#fff" }} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            {loading
              ? <Loader2 size={16} className="animate-spin" style={{ color: "oklch(0.55 0.20 18)" }} />
              : (
                <>
                  <ImagePlus size={16} strokeWidth={1.5} style={{ color: "oklch(0.62 0.006 65)" }} />
                  <span className="text-[9px] font-mono" style={{ color: "oklch(0.62 0.006 65)" }}>Upload</span>
                </>
              )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="h-7 px-3 text-[11px] font-mono rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)", background: "oklch(1 0 0)" }}
        >
          {currentUrl ? "Change" : "Upload"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={loading}
            className="h-7 px-3 text-[11px] font-mono rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.52 0.18 18)", background: "oklch(1 0 0)" }}
          >
            Remove
          </button>
        )}
        <p className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.006 65)" }}>JPG, PNG · max 5MB</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("category");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; kind: "cat" | "sub" } | null>(null);

  // Drag state
  const [dragCatIdx, setDragCatIdx] = useState<number | null>(null);
  const [dragSubIdx, setDragSubIdx] = useState<number | null>(null);
  const [overCatIdx, setOverCatIdx] = useState<number | null>(null);
  const [overSubIdx, setOverSubIdx] = useState<number | null>(null);

  // Local ordered lists for optimistic drag
  const [orderedCats, setOrderedCats] = useState<Category[]>([]);
  const [orderedSubs, setOrderedSubs] = useState<Subcategory[]>([]);

  // ── Queries
  const { data: catData, isLoading: catsLoading } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories?includeInactive=true"),
  });

  const { data: subData, isLoading: subsLoading } = useQuery<{ data: Subcategory[] }>({
    queryKey: ["subcategories"],
    queryFn: () => api.get("/categories/subcategories?includeInactive=true"),
  });

  const categories = catData?.data ?? [];
  const subcategories = subData?.data ?? [];

  // Sync ordered lists when data arrives
  useEffect(() => {
    if (catData?.data) {
      setOrderedCats([...catData.data].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [catData]);

  useEffect(() => {
    if (subData?.data) {
      setOrderedSubs([...subData.data].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [subData]);

  // ── Forms
  const catForm = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });
  const subForm = useForm<SubcategoryForm>({ resolver: zodResolver(subcategorySchema) });

  // ── CRUD mutations
  const saveCatMutation = useMutation({
    mutationFn: (values: CategoryForm) => {
      if (editingCat) return api.patch(`/categories/${editingCat.id}`, values);
      return api.post("/categories", values);
    },
    onSuccess: () => {
      toast.success(editingCat ? "Category updated" : "Category created");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSheetOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveSubMutation = useMutation({
    mutationFn: (values: SubcategoryForm) => {
      if (editingSub) return api.patch(`/categories/subcategories/${editingSub.id}`, values);
      return api.post("/categories/subcategories", values);
    },
    onSuccess: () => {
      toast.success(editingSub ? "Subcategory updated" : "Subcategory created");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      setSheetOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/subcategories/${id}`),
    onSuccess: () => {
      toast.success("Subcategory deleted");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Image mutations
  const uploadCatImageMutation = useMutation({
    mutationFn: ({ id, image }: { id: string; image: string }) =>
      api.post(`/categories/${id}/image`, { image }),
    onSuccess: (res: any) => {
      toast.success("Image updated");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Also update editingCat so the widget shows new image
      if (editingCat) setEditingCat({ ...editingCat, imageUrl: res.data?.imageUrl ?? null });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeCatImageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}/image`),
    onSuccess: () => {
      toast.success("Image removed");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (editingCat) setEditingCat({ ...editingCat, imageUrl: null });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadSubImageMutation = useMutation({
    mutationFn: ({ id, image }: { id: string; image: string }) =>
      api.post(`/categories/subcategories/${id}/image`, { image }),
    onSuccess: (res: any) => {
      toast.success("Image updated");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      if (editingSub) setEditingSub({ ...editingSub, imageUrl: res.data?.imageUrl ?? null });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeSubImageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/subcategories/${id}/image`),
    onSuccess: () => {
      toast.success("Image removed");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      if (editingSub) setEditingSub({ ...editingSub, imageUrl: null });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Sort order mutations
  const reorderCatMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.patch("/categories/sort-order", { items }),
    onError: (err: Error) => {
      toast.error(err.message);
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const reorderSubMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.patch("/categories/subcategories/sort-order", { items }),
    onError: (err: Error) => {
      toast.error(err.message);
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });

  // ── Sheet openers
  function openCreateCategory() {
    setEditingCat(null);
    setSheetMode("category");
    catForm.reset({ name: "", slug: "", description: "" });
    setSheetOpen(true);
  }

  function openCreateSub() {
    setEditingSub(null);
    setSheetMode("subcategory");
    subForm.reset({ name: "", slug: "", categoryId: categories[0]?.id ?? "", description: "" });
    setSheetOpen(true);
  }

  function openEditCat(cat: Category) {
    setEditingCat(cat);
    setSheetMode("category");
    catForm.reset({ name: cat.name, slug: cat.slug, description: "" });
    setSheetOpen(true);
  }

  function openEditSub(sub: Subcategory) {
    setEditingSub(sub);
    setSheetMode("subcategory");
    subForm.reset({ name: sub.name, slug: sub.slug, categoryId: sub.categoryId, description: "" });
    setSheetOpen(true);
  }

  // ── Drag handlers — categories
  function handleCatDragStart(idx: number) { setDragCatIdx(idx); }
  function handleCatDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setOverCatIdx(idx);
  }
  function handleCatDrop(idx: number) {
    if (dragCatIdx === null || dragCatIdx === idx) {
      setDragCatIdx(null); setOverCatIdx(null); return;
    }
    const next = [...orderedCats];
    const [item] = next.splice(dragCatIdx, 1);
    next.splice(idx, 0, item);
    setOrderedCats(next);
    setDragCatIdx(null);
    setOverCatIdx(null);
    reorderCatMutation.mutate(next.map((c, i) => ({ id: c.id, sortOrder: i })));
  }
  function handleCatDragEnd() { setDragCatIdx(null); setOverCatIdx(null); }

  // ── Drag handlers — subcategories
  function handleSubDragStart(idx: number) { setDragSubIdx(idx); }
  function handleSubDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setOverSubIdx(idx);
  }
  function handleSubDrop(idx: number) {
    if (dragSubIdx === null || dragSubIdx === idx) {
      setDragSubIdx(null); setOverSubIdx(null); return;
    }
    const next = [...orderedSubs];
    const [item] = next.splice(dragSubIdx, 1);
    next.splice(idx, 0, item);
    setOrderedSubs(next);
    setDragSubIdx(null);
    setOverSubIdx(null);
    reorderSubMutation.mutate(next.map((s, i) => ({ id: s.id, sortOrder: i })));
  }
  function handleSubDragEnd() { setDragSubIdx(null); setOverSubIdx(null); }

  const selectedCatId = subForm.watch("categoryId");
  const catImgLoading = uploadCatImageMutation.isPending || removeCatImageMutation.isPending;
  const subImgLoading = uploadSubImageMutation.isPending || removeSubImageMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories · ${subcategories.length} subcategories`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── Categories ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "oklch(1 0 0)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.985 0.005 65)" }}
          >
            <div className="flex items-center gap-2">
              <Layers size={13} strokeWidth={1.5} style={{ color: "oklch(0.55 0.20 18)" }} />
              <p className="text-[11px] font-mono tracking-[0.15em] uppercase font-medium" style={{ color: "oklch(0.35 0.010 65)" }}>
                Categories
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
                style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" }}>
                {categories.length}
              </span>
            </div>
            <button
              onClick={openCreateCategory}
              className="h-7 px-3 rounded-full text-[10px] font-mono tracking-wide flex items-center gap-1.5 transition-opacity hover:opacity-85"
              style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
            >
              <Plus size={11} strokeWidth={2.5} /> New
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                  {["", "Name", "Subcats", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono tracking-[0.15em] uppercase"
                      style={{ color: "oklch(0.48 0.008 65)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catsLoading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                    {[28, 120, 40, 40].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: w }} />
                      </td>
                    ))}
                  </tr>
                ))}
                {!catsLoading && orderedCats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-14 text-center">
                      <FolderTree size={22} className="mx-auto mb-2.5" strokeWidth={1.2} style={{ color: "oklch(0.72 0.006 65)" }} />
                      <p className="text-[12px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>No categories yet</p>
                    </td>
                  </tr>
                )}
                {orderedCats.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    draggable
                    onDragStart={() => handleCatDragStart(idx)}
                    onDragOver={(e) => handleCatDragOver(e, idx)}
                    onDrop={() => handleCatDrop(idx)}
                    onDragEnd={handleCatDragEnd}
                    className="group transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid oklch(0.94 0.004 65)",
                      opacity: dragCatIdx === idx ? 0.4 : 1,
                      background: overCatIdx === idx && dragCatIdx !== idx
                        ? "oklch(0.55 0.20 18 / 0.04)"
                        : undefined,
                      outline: overCatIdx === idx && dragCatIdx !== idx
                        ? "2px solid oklch(0.55 0.20 18 / 0.25)"
                        : undefined,
                      outlineOffset: "-2px",
                    }}
                    onMouseEnter={(e) => {
                      if (overCatIdx !== idx) (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)";
                    }}
                    onMouseLeave={(e) => {
                      if (overCatIdx !== idx) (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    {/* Drag handle */}
                    <td className="px-2 py-3 w-8" style={{ cursor: "grab" }}>
                      <GripVertical size={13} strokeWidth={1.5} style={{ color: "oklch(0.72 0.006 65)" }} />
                    </td>
                    {/* Name + thumbnail */}
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        {cat.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="size-7 rounded-lg object-cover shrink-0"
                            style={{ border: "1px solid oklch(0.91 0.006 65)" }}
                          />
                        ) : (
                          <div
                            className="size-7 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ background: "oklch(0.94 0.006 65)" }}
                          >
                            <Layers size={11} strokeWidth={1.5} style={{ color: "oklch(0.62 0.006 65)" }} />
                          </div>
                        )}
                        <div>
                          <p className="text-[13px] font-medium leading-tight" style={{ color: "oklch(0.18 0.010 65)" }}>{cat.name}</p>
                          <p className="text-[10px] font-mono" style={{ color: "oklch(0.62 0.006 65)" }}>{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.008 65)" }}>
                        {cat._count?.subcategories ?? subcategories.filter((s) => s.categoryId === cat.id).length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditCat(cat)}
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.25 0.010 65)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: cat.id, name: cat.name, kind: "cat" })}
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.50 0.18 18)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orderedCats.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid oklch(0.93 0.004 65)", background: "oklch(0.988 0.003 65)" }}>
              <p className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.006 65)" }}>
                Drag rows to reorder · order is saved automatically
              </p>
            </div>
          )}
        </div>

        {/* ── Subcategories ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "oklch(1 0 0)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.985 0.005 65)" }}
          >
            <div className="flex items-center gap-2">
              <FolderTree size={13} strokeWidth={1.5} style={{ color: "oklch(0.55 0.20 18)" }} />
              <p className="text-[11px] font-mono tracking-[0.15em] uppercase font-medium" style={{ color: "oklch(0.35 0.010 65)" }}>
                Subcategories
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
                style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" }}>
                {subcategories.length}
              </span>
            </div>
            <button
              onClick={openCreateSub}
              disabled={categories.length === 0}
              className="h-7 px-3 rounded-full text-[10px] font-mono tracking-wide flex items-center gap-1.5 transition-opacity hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
            >
              <Plus size={11} strokeWidth={2.5} /> New
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                  {["", "Name", "Parent", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono tracking-[0.15em] uppercase"
                      style={{ color: "oklch(0.48 0.008 65)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subsLoading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                    {[28, 120, 80, 40].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: w }} />
                      </td>
                    ))}
                  </tr>
                ))}
                {!subsLoading && orderedSubs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-14 text-center">
                      <FolderTree size={22} className="mx-auto mb-2.5" strokeWidth={1.2} style={{ color: "oklch(0.72 0.006 65)" }} />
                      <p className="text-[12px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>No subcategories yet</p>
                    </td>
                  </tr>
                )}
                {orderedSubs.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    draggable
                    onDragStart={() => handleSubDragStart(idx)}
                    onDragOver={(e) => handleSubDragOver(e, idx)}
                    onDrop={() => handleSubDrop(idx)}
                    onDragEnd={handleSubDragEnd}
                    className="group transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid oklch(0.94 0.004 65)",
                      opacity: dragSubIdx === idx ? 0.4 : 1,
                      background: overSubIdx === idx && dragSubIdx !== idx
                        ? "oklch(0.55 0.20 18 / 0.04)"
                        : undefined,
                      outline: overSubIdx === idx && dragSubIdx !== idx
                        ? "2px solid oklch(0.55 0.20 18 / 0.25)"
                        : undefined,
                      outlineOffset: "-2px",
                    }}
                    onMouseEnter={(e) => {
                      if (overSubIdx !== idx) (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)";
                    }}
                    onMouseLeave={(e) => {
                      if (overSubIdx !== idx) (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    {/* Drag handle */}
                    <td className="px-2 py-3 w-8" style={{ cursor: "grab" }}>
                      <GripVertical size={13} strokeWidth={1.5} style={{ color: "oklch(0.72 0.006 65)" }} />
                    </td>
                    {/* Name + thumbnail */}
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        {sub.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.imageUrl}
                            alt={sub.name}
                            className="size-7 rounded-lg object-cover shrink-0"
                            style={{ border: "1px solid oklch(0.91 0.006 65)" }}
                          />
                        ) : (
                          <div
                            className="size-7 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ background: "oklch(0.94 0.006 65)" }}
                          >
                            <FolderTree size={10} strokeWidth={1.5} style={{ color: "oklch(0.62 0.006 65)" }} />
                          </div>
                        )}
                        <div>
                          <p className="text-[13px] font-medium leading-tight" style={{ color: "oklch(0.18 0.010 65)" }}>{sub.name}</p>
                          <p className="text-[10px] font-mono" style={{ color: "oklch(0.62 0.006 65)" }}>{sub.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono"
                        style={{ background: "oklch(0.94 0.006 65)", color: "oklch(0.42 0.008 65)" }}
                      >
                        {sub.category?.name ?? categories.find((c) => c.id === sub.categoryId)?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditSub(sub)}
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.25 0.010 65)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: sub.id, name: sub.name, kind: "sub" })}
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.50 0.18 18)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orderedSubs.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid oklch(0.93 0.004 65)", background: "oklch(0.988 0.003 65)" }}>
              <p className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.006 65)" }}>
                Drag rows to reorder · order is saved automatically
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto p-0 gap-0"
          style={{ background: "oklch(0.988 0.004 65)", borderLeft: "1px solid oklch(0.91 0.006 65)" }}
        >
          <SheetHeader
            className="px-6 py-5"
            style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(1 0 0)" }}
          >
            <SheetTitle className="text-[16px] font-semibold" style={{ color: "oklch(0.15 0.010 65)" }}>
              {sheetMode === "category"
                ? (editingCat ? "Edit Category" : "New Category")
                : (editingSub ? "Edit Subcategory" : "New Subcategory")}
            </SheetTitle>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.006 65)" }}>
              {sheetMode === "category"
                ? "Categories group your products at the top level"
                : "Subcategories sit beneath a parent category"}
            </p>
          </SheetHeader>

          {sheetMode === "category" ? (
            <form
              onSubmit={catForm.handleSubmit((v) => saveCatMutation.mutate(v))}
              className="flex flex-col gap-5 px-6 py-6"
            >
              <FormRow label="Name" error={catForm.formState.errors.name?.message} required>
                <input
                  {...catForm.register("name", {
                    onChange: (e) => {
                      if (!editingCat) catForm.setValue("slug", slugify(e.target.value));
                    },
                  })}
                  placeholder="e.g. Clothing"
                  className={cn(inputCls, catForm.formState.errors.name && "border-destructive")}
                />
              </FormRow>
              <FormRow label="Slug" error={catForm.formState.errors.slug?.message} required>
                <input
                  {...catForm.register("slug")}
                  placeholder="e.g. clothing"
                  className={cn(inputCls, catForm.formState.errors.slug && "border-destructive")}
                />
              </FormRow>
              <FormRow label="Description">
                <textarea
                  {...catForm.register("description")}
                  rows={3}
                  placeholder="Optional..."
                  className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </FormRow>

              {/* Image upload — edit mode only */}
              {editingCat && (
                <>
                  <div style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }} />
                  <FormRow label="Category Image">
                    <ImageUploadWidget
                      currentUrl={editingCat.imageUrl}
                      loading={catImgLoading}
                      onUpload={(b64) => uploadCatImageMutation.mutate({ id: editingCat.id, image: b64 })}
                      onRemove={() => removeCatImageMutation.mutate(editingCat.id)}
                    />
                  </FormRow>
                </>
              )}

              <div className="pt-2" style={{ borderTop: "1px solid oklch(0.92 0.006 65)" }}>
                <button
                  type="submit"
                  disabled={saveCatMutation.isPending}
                  className="h-10 px-6 rounded-full text-[11px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
                >
                  {saveCatMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  {editingCat ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={subForm.handleSubmit((v) => saveSubMutation.mutate(v))}
              className="flex flex-col gap-5 px-6 py-6"
            >
              <FormRow label="Name" error={subForm.formState.errors.name?.message} required>
                <input
                  {...subForm.register("name", {
                    onChange: (e) => {
                      if (!editingSub) subForm.setValue("slug", slugify(e.target.value));
                    },
                  })}
                  placeholder="e.g. Oversized Tees"
                  className={cn(inputCls, subForm.formState.errors.name && "border-destructive")}
                />
              </FormRow>
              <FormRow label="Slug" error={subForm.formState.errors.slug?.message} required>
                <input
                  {...subForm.register("slug")}
                  placeholder="e.g. oversized-tees"
                  className={cn(inputCls, subForm.formState.errors.slug && "border-destructive")}
                />
              </FormRow>
              <FormRow label="Parent Category" error={subForm.formState.errors.categoryId?.message} required>
                <Controller
                  control={subForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full rounded-xl bg-input text-[13px] border-border">
                        <span style={{ color: field.value ? "oklch(0.18 0.010 65)" : "oklch(0.52 0.008 65)" }}>
                          {field.value ? categories.find((c) => c.id === field.value)?.name : "Select category"}
                        </span>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start" className="rounded-2xl border-[oklch(0.90_0.006_65)] shadow-lg p-1">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="rounded-xl text-[13px] font-mono cursor-pointer">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormRow>
              <FormRow label="Description">
                <textarea
                  {...subForm.register("description")}
                  rows={3}
                  placeholder="Optional..."
                  className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </FormRow>

              {/* Image upload — edit mode only */}
              {editingSub && (
                <>
                  <div style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }} />
                  <FormRow label="Subcategory Image">
                    <ImageUploadWidget
                      currentUrl={editingSub.imageUrl}
                      loading={subImgLoading}
                      onUpload={(b64) => uploadSubImageMutation.mutate({ id: editingSub.id, image: b64 })}
                      onRemove={() => removeSubImageMutation.mutate(editingSub.id)}
                    />
                  </FormRow>
                </>
              )}

              <div className="pt-2" style={{ borderTop: "1px solid oklch(0.92 0.006 65)" }}>
                <button
                  type="submit"
                  disabled={saveSubMutation.isPending}
                  className="h-10 px-6 rounded-full text-[11px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
                >
                  {saveSubMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  {editingSub ? "Save Changes" : "Create Subcategory"}
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description={deleteTarget?.kind === "cat" ? "This will also delete all its subcategories." : "This action cannot be undone."}
        confirmLabel="Delete"
        loading={deleteCatMutation.isPending || deleteSubMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === "cat") deleteCatMutation.mutate(deleteTarget.id);
          else deleteSubMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
