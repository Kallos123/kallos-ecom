"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().optional(),
  color: z.string().optional(),
  priceOverride: z.number().positive().optional(),
  stock: z.number().int().min(0, "Stock must be 0+"),
});

type VariantForm = z.infer<typeof variantSchema>;

export interface Variant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceOverride: number | null;
  stock: number;
}

interface VariantsManagerProps {
  productId: string;
  variants: Variant[];
  basePrice: number;
}

const inputCls =
  "h-8 rounded-lg bg-input border border-border px-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors w-full";

function AddVariantForm({
  productId,
  onAdded,
}: {
  productId: string;
  onAdded: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantForm>({
    resolver: zodResolver(variantSchema),
    defaultValues: { stock: 0, sku: "", size: "", color: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: VariantForm) =>
      api.post(`/products/${productId}/variants`, data),
    onSuccess: () => {
      toast.success("Variant added");
      reset({ stock: 0 });
      onAdded();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="rounded-2xl p-4"
    style={{ border: "1.5px dashed oklch(0.82 0.008 65)", background: "oklch(0.992 0.003 65)" }}
    >
      <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-3">
        Add Variant
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-muted-foreground/70 uppercase">
            SKU <span className="text-primary">*</span>
          </label>
          <input
            {...register("sku")}
            placeholder="KLS-001-S-BLK"
            className={cn(inputCls, errors.sku && "border-destructive")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-muted-foreground/70 uppercase">
            Size
          </label>
          <input {...register("size")} placeholder="S / M / L / XL" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-muted-foreground/70 uppercase">
            Color
          </label>
          <input {...register("color")} placeholder="Black" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-muted-foreground/70 uppercase">
            Price Override (₹)
          </label>
          <input
            {...register("priceOverride", {
              setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
            })}
            type="number"
            step="0.01"
            placeholder="Optional"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-muted-foreground/70 uppercase">
            Stock <span className="text-primary">*</span>
          </label>
          <input
            {...register("stock", { valueAsNumber: true })}
            type="number"
            placeholder="0"
            className={cn(inputCls, errors.stock && "border-destructive")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-muted-foreground/70 uppercase opacity-0">
            &nbsp;
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-mono hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 justify-center"
          >
            {mutation.isPending ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Plus size={11} />
            )}
            Add
          </button>
        </div>
      </div>
    </form>
  );
}

function VariantRow({
  variant,
  productId,
  basePrice,
  onMutated,
}: {
  variant: Variant;
  productId: string;
  basePrice: number;
  onMutated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [stockVal, setStockVal] = useState(String(variant.stock));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/products/${productId}/variants/${variant.id}`, {
        stock: parseInt(stockVal, 10),
      }),
    onSuccess: () => {
      toast.success("Stock updated");
      setEditing(false);
      onMutated();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      api.delete(`/products/${productId}/variants/${variant.id}`),
    onSuccess: () => {
      toast.success("Variant removed");
      onMutated();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const stockNum = variant.stock;
  const stockColor =
    stockNum === 0
      ? "text-red-600"
      : stockNum <= 5
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <tr className="group" style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
      <td className="px-4 py-2.5">
        <span className="text-[12px] font-mono text-foreground">{variant.sku}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[12px] text-muted-foreground">{variant.size ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[12px] text-muted-foreground">{variant.color ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[12px] font-mono text-foreground">
          {variant.priceOverride
            ? formatINR(variant.priceOverride)
            : formatINR(basePrice)}
        </span>
      </td>
      <td className="px-4 py-2.5">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={stockVal}
              onChange={(e) => setStockVal(e.target.value)}
              className="w-16 h-6 rounded bg-input border border-primary px-1.5 text-[12px] font-mono text-foreground focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="text-emerald-600 hover:text-emerald-700"
            >
              {updateMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
            </button>
            <button
              onClick={() => {
                setStockVal(String(variant.stock));
                setEditing(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={cn(
              "text-[12px] font-mono flex items-center gap-1.5 hover:underline",
              stockColor
            )}
          >
            {variant.stock}
            <Edit2 size={10} className="opacity-0 group-hover:opacity-60" />
          </button>
        )}
      </td>
      <td className="px-4 py-2.5">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={deleteMutation.isPending}
          className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
        >
          {deleteMutation.isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </td>
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete variant "${variant.sku}"?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </tr>
  );
}

export function VariantsManager({
  productId,
  variants,
  basePrice,
}: VariantsManagerProps) {
  const queryClient = useQueryClient();

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["product", productId] });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing variants table */}
      {variants.length > 0 ? (
        <div
          className="rounded-2xl overflow-x-auto"
          style={{
            background: "oklch(1 0 0)",
            boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                {["SKU", "Size", "Color", "Price", "Stock", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-mono tracking-[0.15em] uppercase whitespace-nowrap"
                    style={{ color: "oklch(0.48 0.008 65)", background: "oklch(0.985 0.005 65)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  productId={productId}
                  basePrice={basePrice}
                  onMutated={refresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="rounded-2xl py-10 text-center"
          style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.006 65)" }}
        >
          <p className="text-[12px] font-mono text-muted-foreground">
            No variants yet — add one below
          </p>
        </div>
      )}

      <AddVariantForm productId={productId} onAdded={refresh} />
    </div>
  );
}
