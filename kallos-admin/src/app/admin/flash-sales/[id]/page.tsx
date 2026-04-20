"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { FormField, inputCls, inputErrCls } from "@/components/admin/form-field";
import { formatINR, formatDateTime } from "@/lib/format";
import { ArrowLeft, Trash2, Loader2, Plus, Package, Zap, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/sidebar";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
}

interface FlashSaleItem {
  id: string;
  productId: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  product: Product;
}

interface FlashSale {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  items: FlashSaleItem[];
}

const addItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().positive("Must be a positive number"),
});

type AddItemValues = z.infer<typeof addItemSchema>;

function getSaleStatus(sale: FlashSale): "live" | "upcoming" | "ended" | "inactive" {
  const now = new Date();
  if (!sale.isActive) return "inactive";
  if (new Date(sale.startTime) > now) return "upcoming";
  if (new Date(sale.endTime) >= now) return "live";
  return "ended";
}

const STATUS_STYLE: Record<string, { color: string; bg: string; borderColor: string }> = {
  live:     { color: "oklch(0.38 0.12 155)", bg: "oklch(0.93 0.06 155 / 0.30)", borderColor: "oklch(0.72 0.10 155 / 0.40)" },
  upcoming: { color: "oklch(0.38 0.10 250)", bg: "oklch(0.93 0.06 250 / 0.25)", borderColor: "oklch(0.72 0.08 250 / 0.40)" },
  ended:    { color: "oklch(0.50 0.006 65)",  bg: "oklch(0.93 0.003 65)",         borderColor: "oklch(0.85 0.004 65)" },
  inactive: { color: "oklch(0.50 0.006 65)",  bg: "oklch(0.93 0.003 65)",         borderColor: "oklch(0.85 0.004 65)" },
};

function getSalePrice(basePrice: number, type: string, value: number) {
  if (type === "PERCENTAGE") return basePrice - (basePrice * value) / 100;
  return Math.max(0, basePrice - value);
}

export default function FlashSaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: saleData, isLoading } = useQuery<{ data: FlashSale }>({
    queryKey: ["admin-flash-sale", id],
    queryFn: () => api.get(`/coupons/flash-sales/${id}`),
  });

  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ["products-list"],
    queryFn: () => api.get("/products?limit=200"),
  });

  const sale = saleData?.data;
  const allProducts = productsData?.data ?? [];
  const assignedIds = new Set(sale?.items.map((i) => i.productId) ?? []);
  const availableProducts = allProducts.filter((p) => !assignedIds.has(p.id));

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddItemValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { discountType: "PERCENTAGE", discountValue: undefined as any },
  });

  const discountType = watch("discountType");

  const addItemMutation = useMutation({
    mutationFn: (values: AddItemValues) =>
      api.post(`/coupons/flash-sales/${id}/items`, values),
    onSuccess: () => {
      toast.success("Product added to flash sale");
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sale", id] });
      reset({ discountType: "PERCENTAGE", discountValue: undefined as any, productId: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/coupons/flash-sales/${id}/items/${itemId}`),
    onSuccess: () => {
      toast.success("Product removed");
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sale", id] });
      setRemoveTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      api.patch(`/coupons/flash-sales/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sale", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 rounded-full animate-pulse mb-6" style={{ background: "oklch(0.93 0.004 65)" }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 rounded-2xl animate-pulse" style={{ background: "oklch(0.96 0.004 65)" }} />
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: "oklch(0.96 0.004 65)" }} />
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const status = getSaleStatus(sale);
  const ss = STATUS_STYLE[status];

  return (
    <div>
      <PageHeader
        title={sale.name}
        subtitle={`${sale.items.length} products · ${formatDateTime(sale.startTime)} → ${formatDateTime(sale.endTime)}`}
        breadcrumb={["Flash Sales", sale.name]}
        action={
          <button
            onClick={() => router.back()}
            className="h-9 px-4 rounded-full text-[11px] font-mono font-medium flex items-center gap-2 transition-all hover:opacity-80"
            style={{
              border: "1px solid oklch(0.88 0.008 65)",
              color: "oklch(0.42 0.008 65)",
              background: "oklch(1 0 0)",
            }}
          >
            <ArrowLeft size={12} />
            Back
          </button>
        }
      />

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border",
            status === "live" && "animate-pulse"
          )}
          style={{ color: ss.color, background: ss.bg, borderColor: ss.borderColor }}
        >
          {status === "live" && (
            <span className="size-1.5 rounded-full" style={{ background: ss.color }} />
          )}
          {status === "live" ? "Live" : status === "upcoming" ? "Upcoming" : status === "ended" ? "Ended" : "Inactive"}
        </span>
        <span className="text-[11px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>
          {formatDateTime(sale.startTime)} — {formatDateTime(sale.endTime)}
        </span>

        {/* Active toggle */}
        <div
          className="ml-auto flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
          style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.91 0.006 65)" }}
        >
          <Power size={12} style={{ color: sale.isActive ? "oklch(0.38 0.12 155)" : "oklch(0.62 0.006 65)" }} />
          <span className="text-[11px] font-mono font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>
            {sale.isActive ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={sale.isActive}
            onCheckedChange={(v) => toggleActiveMutation.mutate(v)}
            disabled={toggleActiveMutation.isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Products in sale */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{
            background: "oklch(1 0 0)",
            boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.985 0.005 65)" }}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} strokeWidth={2} style={{ color: "oklch(0.55 0.20 18)" }} />
              <span className="text-[11px] font-mono tracking-[0.15em] uppercase font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>
                Products in Sale
              </span>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium"
              style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" }}
            >
              {sale.items.length} items
            </span>
          </div>

          {sale.items.length === 0 ? (
            <div className="py-16 text-center">
              <div
                className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "oklch(0.94 0.006 65)" }}
              >
                <Package size={20} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No products assigned</p>
              <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>Use the form to add discounted products</p>
            </div>
          ) : (
            <div>
              {sale.items.map((item, idx) => {
                const salePrice = getSalePrice(Number(item.product.basePrice), item.discountType, item.discountValue);
                const isLast = idx === sale.items.length - 1;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5 group transition-colors duration-100"
                    style={{ borderBottom: isLast ? "none" : "1px solid oklch(0.94 0.004 65)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <div
                      className="size-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "oklch(0.95 0.004 65)" }}
                    >
                      <Package size={13} strokeWidth={1.5} style={{ color: "oklch(0.55 0.006 65)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono line-through" style={{ color: "oklch(0.62 0.006 65)" }}>
                          {formatINR(Number(item.product.basePrice))}
                        </span>
                        <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.48 0.18 18)" }}>
                          {formatINR(salePrice)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border"
                      style={{
                        color: "oklch(0.38 0.10 250)",
                        background: "oklch(0.93 0.06 250 / 0.25)",
                        borderColor: "oklch(0.72 0.08 250 / 0.40)",
                      }}
                    >
                      {item.discountType === "PERCENTAGE" ? `${item.discountValue}% off` : `₹${item.discountValue} off`}
                    </span>
                    <button
                      onClick={() => setRemoveTarget({ id: item.id, name: item.product.name })}
                      disabled={removeItemMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: "oklch(0.62 0.006 65)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.50 0.18 18)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add product form */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "oklch(1 0 0)",
            boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
          }}
        >
          <p className="text-[10px] font-mono tracking-[0.18em] uppercase font-medium mb-1" style={{ color: "oklch(0.55 0.20 18)" }}>
            Add Product
          </p>
          <p className="text-[15px] font-medium mb-5" style={{ color: "oklch(0.18 0.010 65)" }}>
            Assign Discount
          </p>

          {availableProducts.length === 0 && allProducts.length > 0 ? (
            <p className="text-[12px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>
              All products are already in this sale.
            </p>
          ) : (
            <form onSubmit={handleSubmit((v) => addItemMutation.mutate(v))} className="flex flex-col gap-4">
              <FormField label="Product" error={errors.productId?.message} required>
                <Controller
                  control={control}
                  name="productId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={cn(
                          "h-10 rounded-xl bg-input border-border text-[13px] w-full",
                          errors.productId && "border-destructive"
                        )}
                      >
                        <span style={{ color: field.value ? "oklch(0.18 0.010 65)" : "oklch(0.62 0.006 65)" }}>
                          {field.value
                            ? availableProducts.find((p) => p.id === field.value)?.name ?? "Select product..."
                            : "Select product..."}
                        </span>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start" className="rounded-2xl border-[oklch(0.90_0.006_65)] shadow-lg p-1">
                        <SelectGroup>
                          {availableProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="rounded-xl text-[13px] font-mono cursor-pointer">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Discount Type" error={errors.discountType?.message} required>
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-xl bg-input border-border text-[13px] w-full">
                        <span style={{ color: "oklch(0.18 0.010 65)" }}>
                          {field.value === "PERCENTAGE" ? "% Percentage" : "₹ Flat Amount"}
                        </span>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start" className="rounded-2xl border-[oklch(0.90_0.006_65)] shadow-lg p-1">
                        <SelectGroup>
                          <SelectItem value="PERCENTAGE" className="rounded-xl text-[13px] font-mono cursor-pointer">% Percentage</SelectItem>
                          <SelectItem value="FLAT" className="rounded-xl text-[13px] font-mono cursor-pointer">₹ Flat Amount</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label={discountType === "PERCENTAGE" ? "Discount %" : "Discount ₹"}
                error={errors.discountValue?.message}
                required
              >
                <input
                  {...register("discountValue", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"}
                  className={cn(inputCls, errors.discountValue && inputErrCls)}
                />
              </FormField>

              <button
                type="submit"
                disabled={addItemMutation.isPending}
                className="h-10 px-4 rounded-full text-[11px] font-mono tracking-[0.15em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
              >
                {addItemMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add to Sale
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove "${removeTarget?.name}" from sale?`}
        description="The product will no longer be part of this flash sale."
        confirmLabel="Remove"
        loading={removeItemMutation.isPending}
        onConfirm={() => { if (removeTarget) { removeItemMutation.mutate(removeTarget.id); } }}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
