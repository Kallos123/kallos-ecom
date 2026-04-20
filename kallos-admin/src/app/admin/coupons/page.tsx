"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Tag, History, ChevronLeft, ChevronRight, ExternalLink, User } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { FormField, inputCls, inputErrCls } from "@/components/admin/form-field";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { formatINR, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type CouponType = "PERCENTAGE" | "FLAT" | "FREE_SHIPPING";

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  isFirstTimeOnly: boolean;
  totalUsageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface UsageEntry {
  id: string;
  orderId: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface UsageResponse {
  data: {
    coupon: Coupon;
    usages: UsageEntry[];
  };
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const schema = z.object({
  code: z.string().min(2, "Minimum 2 characters").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FLAT", "FREE_SHIPPING"]),
  value: z.number().min(0, "Required").optional(),
  minOrderValue: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  isFirstTimeOnly: z.boolean(),
  totalUsageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENTAGE: "% Off",
  FLAT: "₹ Off",
  FREE_SHIPPING: "Free Shipping",
};

const TYPE_COLOR: Record<CouponType, { bg: string; color: string }> = {
  PERCENTAGE: { bg: "oklch(0.93 0.06 155 / 0.25)", color: "oklch(0.38 0.10 155)" },
  FLAT:       { bg: "oklch(0.93 0.06 250 / 0.25)", color: "oklch(0.38 0.10 250)" },
  FREE_SHIPPING: { bg: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" },
};

const PAGE_SIZE = 10;

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");

  // History sheet
  const [historyTarget, setHistoryTarget] = useState<Coupon | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: Coupon[] }>({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get("/coupons?limit=50"),
  });

  const { data: usageData, isLoading: usageLoading } = useQuery<UsageResponse>({
    queryKey: ["coupon-usages", historyTarget?.id, historyPage],
    queryFn: () => api.get(`/coupons/${historyTarget!.id}/usages?page=${historyPage}&limit=${PAGE_SIZE}`),
    enabled: !!historyTarget,
  });

  const coupons = data?.data ?? [];
  const usages = usageData?.data.usages ?? [];
  const usageMeta = usageData?.meta;

  const {
    register, handleSubmit, control, watch, reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "PERCENTAGE", value: 10, isFirstTimeOnly: false, isActive: true },
  });

  const couponType = watch("type");

  function openCreate() {
    setEditing(null);
    reset({ type: "PERCENTAGE", value: 10, isFirstTimeOnly: false, isActive: true });
    setSheetOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? undefined,
      maxDiscount: coupon.maxDiscount ?? undefined,
      isFirstTimeOnly: coupon.isFirstTimeOnly,
      totalUsageLimit: coupon.totalUsageLimit ?? undefined,
      perUserLimit: coupon.perUserLimit ?? undefined,
      startsAt: coupon.startsAt ? coupon.startsAt.split("T")[0] : undefined,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : undefined,
      isActive: coupon.isActive,
    });
    setSheetOpen(true);
  }

  function openHistory(coupon: Coupon) {
    setHistoryTarget(coupon);
    setHistoryPage(1);
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        startsAt: values.startsAt ? `${values.startsAt}T00:00:00.000Z` : undefined,
        expiresAt: values.expiresAt ? `${values.expiresAt}T00:00:00.000Z` : undefined,
        value: couponType === "FREE_SHIPPING" ? 0 : values.value,
      };
      if (editing) return api.patch(`/coupons/${editing.id}`, payload);
      return api.post("/coupons", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Coupon updated" : "Coupon created");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setSheetOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? undefined : n; };
  const numInput = (field: string) => ({ ...register(field as any, { setValueAs: toNum }) });

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.length} coupons`}
        action={
          <button
            onClick={openCreate}
            className="h-9 px-4 rounded-full text-[11px] font-mono font-semibold flex items-center gap-2 transition-opacity hover:opacity-85"
            style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            New Coupon
          </button>
        }
      />

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "oklch(1 0 0)",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                {["Code", "Type", "Value", "Min Order", "Usage", "Valid Until", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.18em] uppercase font-medium whitespace-nowrap"
                    style={{ color: "oklch(0.48 0.008 65)", background: "oklch(0.985 0.005 65)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: "60%" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.94 0.006 65)" }}
                    >
                      <Tag size={22} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No coupons yet</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>Create your first discount code</p>
                  </td>
                </tr>
              )}

              {coupons.map((coupon) => {
                const typeColor = TYPE_COLOR[coupon.type];
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const usagePct = coupon.totalUsageLimit
                  ? Math.min(100, (coupon.usageCount / coupon.totalUsageLimit) * 100)
                  : null;
                return (
                  <tr
                    key={coupon.id}
                    className="group transition-colors duration-100"
                    style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className="text-[12px] font-mono font-semibold tracking-wider"
                        style={{ color: "oklch(0.55 0.20 18)" }}
                      >
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium"
                        style={{ background: typeColor.bg, color: typeColor.color }}
                      >
                        {TYPE_LABEL[coupon.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-semibold font-mono" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.value}%`
                          : coupon.type === "FLAT"
                          ? formatINR(coupon.value)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                        {coupon.minOrderValue ? formatINR(coupon.minOrderValue) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                          {coupon.usageCount}
                          {coupon.totalUsageLimit ? (
                            <span style={{ color: "oklch(0.68 0.006 65)" }}>/{coupon.totalUsageLimit}</span>
                          ) : ""}
                        </span>
                        {usagePct !== null && (
                          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.91 0.006 65)" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${usagePct}%`,
                                background: usagePct >= 90
                                  ? "oklch(0.55 0.20 18)"
                                  : "oklch(0.55 0.15 155)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: isExpired ? "oklch(0.50 0.18 18)" : "oklch(0.52 0.006 65)" }}
                      >
                        {coupon.expiresAt ? formatDate(coupon.expiresAt) : "No expiry"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border"
                        style={coupon.isActive
                          ? { color: "oklch(0.42 0.12 155)", background: "oklch(0.94 0.06 155 / 0.3)", borderColor: "oklch(0.75 0.10 155 / 0.4)" }
                          : { color: "oklch(0.50 0.006 65)", background: "oklch(0.93 0.003 65)", borderColor: "oklch(0.85 0.004 65)" }
                        }
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openHistory(coupon)}
                          title="Usage history"
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.38 0.10 250)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <History size={13} />
                        </button>
                        <button
                          onClick={() => openEdit(coupon)}
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.25 0.010 65)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { setDeleteLabel(coupon.code); setDeleteId(coupon.id); }}
                          style={{ color: "oklch(0.62 0.006 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.50 0.18 18)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.006 65)"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto p-0 gap-0"
          style={{
            background: "oklch(0.988 0.004 65)",
            borderLeft: "1px solid oklch(0.91 0.006 65)",
          }}
        >
          <SheetHeader
            className="px-6 py-5"
            style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(1 0 0)" }}
          >
            <SheetTitle className="text-[16px] font-semibold" style={{ color: "oklch(0.15 0.010 65)" }}>
              {editing ? "Edit Coupon" : "New Coupon"}
            </SheetTitle>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.006 65)" }}>
              {editing ? `Editing ${editing.code}` : "Configure a new discount code"}
            </p>
          </SheetHeader>

          <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="flex flex-col px-6 py-5">

            {/* ── Basics ── */}
            <p className="text-[10px] font-mono tracking-[0.18em] uppercase mb-3" style={{ color: "oklch(0.62 0.008 65)" }}>Basics</p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Code" error={errors.code?.message} required>
                  <input
                    {...register("code")}
                    placeholder="SUMMER20"
                    className={cn(inputCls, "uppercase tracking-widest", errors.code && inputErrCls)}
                  />
                </FormField>
                <FormField label="Type" error={errors.type?.message} required>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10 rounded-xl bg-input border-border text-[13px] w-full">
                          <span style={{ color: "oklch(0.18 0.010 65)" }}>
                            {field.value === "PERCENTAGE" ? "% Percentage" : field.value === "FLAT" ? "₹ Flat Amount" : "Free Shipping"}
                          </span>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} align="start" className="rounded-2xl border-[oklch(0.90_0.006_65)] shadow-lg p-1">
                          <SelectGroup>
                            <SelectItem value="PERCENTAGE" className="rounded-xl text-[13px] font-mono cursor-pointer">% Percentage</SelectItem>
                            <SelectItem value="FLAT" className="rounded-xl text-[13px] font-mono cursor-pointer">₹ Flat Amount</SelectItem>
                            <SelectItem value="FREE_SHIPPING" className="rounded-xl text-[13px] font-mono cursor-pointer">Free Shipping</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              {couponType !== "FREE_SHIPPING" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={couponType === "PERCENTAGE" ? "Discount %" : "Discount ₹"} error={errors.value?.message} required>
                    <input {...numInput("value")} type="number" step="0.01" placeholder="10" className={cn(inputCls, errors.value && inputErrCls)} />
                  </FormField>
                  {couponType === "PERCENTAGE" && (
                    <FormField label="Max Discount (₹)" error={errors.maxDiscount?.message}>
                      <input {...numInput("maxDiscount")} type="number" step="0.01" placeholder="Optional cap" className={cn(inputCls, errors.maxDiscount && inputErrCls)} />
                    </FormField>
                  )}
                </div>
              )}

              <FormField label="Min Order Value (₹)" error={errors.minOrderValue?.message}>
                <input {...numInput("minOrderValue")} type="number" step="0.01" placeholder="No minimum" className={cn(inputCls, errors.minOrderValue && inputErrCls)} />
              </FormField>
            </div>

            {/* ── Limits ── */}
            <div className="my-5" style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }} />
            <p className="text-[10px] font-mono tracking-[0.18em] uppercase mb-3" style={{ color: "oklch(0.62 0.008 65)" }}>Limits</p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Total Usage Limit" error={errors.totalUsageLimit?.message}>
                  <input {...numInput("totalUsageLimit")} type="number" placeholder="Unlimited" className={cn(inputCls, errors.totalUsageLimit && inputErrCls)} />
                </FormField>
                <FormField label="Per User Limit" error={errors.perUserLimit?.message}>
                  <input {...numInput("perUserLimit")} type="number" placeholder="Unlimited" className={cn(inputCls, errors.perUserLimit && inputErrCls)} />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Start Date" error={errors.startsAt?.message}>
                  <input {...register("startsAt")} type="date" className={inputCls} />
                </FormField>
                <FormField label="End Date" error={errors.expiresAt?.message}>
                  <input {...register("expiresAt")} type="date" className={inputCls} />
                </FormField>
              </div>
            </div>

            {/* ── Settings ── */}
            <div className="my-5" style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }} />
            <p className="text-[10px] font-mono tracking-[0.18em] uppercase mb-3" style={{ color: "oklch(0.62 0.008 65)" }}>Settings</p>
            <div className="flex flex-col gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.91 0.006 65)" }}>
              <div
                className="flex items-center justify-between px-4 py-3.5"
                style={{ background: "oklch(1 0 0)", borderBottom: "1px solid oklch(0.93 0.004 65)" }}
              >
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "oklch(0.22 0.010 65)" }}>Active</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>Coupon can be applied at checkout</p>
                </div>
                <Controller control={control} name="isActive" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
              <div
                className="flex items-center justify-between px-4 py-3.5"
                style={{ background: "oklch(1 0 0)" }}
              >
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "oklch(0.22 0.010 65)" }}>First-time only</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>Only valid for a customer's first order</p>
                </div>
                <Controller control={control} name="isFirstTimeOnly" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }}>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-10 px-6 rounded-full text-[11px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
              >
                {saveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Usage History Sheet */}
      <Sheet open={!!historyTarget} onOpenChange={(o) => { if (!o) setHistoryTarget(null); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto p-0 gap-0"
          style={{
            background: "oklch(0.988 0.004 65)",
            borderLeft: "1px solid oklch(0.91 0.006 65)",
          }}
        >
          {historyTarget && (
            <>
              <SheetHeader
                className="px-6 py-5"
                style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(1 0 0)" }}
              >
                <div className="flex items-center gap-2">
                  <History size={14} style={{ color: "oklch(0.55 0.20 18)" }} />
                  <SheetTitle className="text-[16px] font-semibold" style={{ color: "oklch(0.15 0.010 65)" }}>
                    Usage History
                  </SheetTitle>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[12px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-lg"
                    style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.55 0.20 18)" }}
                  >
                    {historyTarget.code}
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.006 65)" }}>
                    {historyTarget.usageCount} total use{historyTarget.usageCount !== 1 ? "s" : ""}
                    {historyTarget.totalUsageLimit ? ` · limit ${historyTarget.totalUsageLimit}` : ""}
                  </span>
                </div>
              </SheetHeader>

              <div className="flex flex-col">
                {/* Summary strip */}
                <div
                  className="grid grid-cols-3 divide-x px-0"
                  style={{
                    background: "oklch(1 0 0)",
                    borderBottom: "1px solid oklch(0.92 0.006 65)",
                    divideColor: "oklch(0.92 0.006 65)",
                  }}
                >
                  {[
                    { label: "Total Uses", value: historyTarget.usageCount },
                    { label: "Limit", value: historyTarget.totalUsageLimit ?? "∞" },
                    { label: "Remaining", value: historyTarget.totalUsageLimit ? Math.max(0, historyTarget.totalUsageLimit - historyTarget.usageCount) : "∞" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center py-3 px-2" style={{ borderRight: "1px solid oklch(0.92 0.006 65)" }}>
                      <span className="text-[18px] font-semibold font-mono" style={{ color: "oklch(0.18 0.010 65)" }}>{value}</span>
                      <span className="text-[10px] font-mono tracking-[0.12em] uppercase mt-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Usage list */}
                {usageLoading ? (
                  <div className="flex flex-col gap-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid oklch(0.93 0.004 65)" }}>
                        <div className="size-8 rounded-xl animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="h-3 w-32 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                          <div className="h-2.5 w-48 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                        </div>
                        <div className="h-2.5 w-20 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
                      </div>
                    ))}
                  </div>
                ) : usages.length === 0 ? (
                  <div className="py-16 text-center">
                    <div
                      className="size-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "oklch(0.94 0.006 65)" }}
                    >
                      <History size={18} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.42 0.008 65)" }}>No usage yet</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>This coupon hasn't been used</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      {usages.map((u, idx) => (
                        <div
                          key={u.id}
                          className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-100"
                          style={{ borderBottom: idx < usages.length - 1 ? "1px solid oklch(0.93 0.004 65)" : "none" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                        >
                          {/* Avatar */}
                          <div
                            className="size-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-semibold font-mono uppercase"
                            style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.55 0.20 18)" }}
                          >
                            {u.user.firstName[0]}{u.user.lastName[0]}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate" style={{ color: "oklch(0.18 0.010 65)" }}>
                              {u.user.firstName} {u.user.lastName}
                            </p>
                            <p className="text-[11px] font-mono truncate" style={{ color: "oklch(0.58 0.006 65)" }}>
                              {u.user.email}
                            </p>
                          </div>

                          {/* Right: date + order link */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>
                              {formatDateTime(u.createdAt)}
                            </span>
                            {u.orderId && (
                              <button
                                onClick={() => router.push(`/admin/orders/${u.orderId}`)}
                                className="flex items-center gap-1 text-[10px] font-mono transition-colors"
                                style={{ color: "oklch(0.55 0.20 18)" }}
                              >
                                View order <ExternalLink size={9} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {usageMeta && usageMeta.totalPages > 1 && (
                      <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderTop: "1px solid oklch(0.92 0.006 65)", background: "oklch(1 0 0)" }}
                      >
                        <span className="text-[11px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>
                          Page {usageMeta.page} of {usageMeta.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                            disabled={historyPage === 1}
                            className="size-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                            style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}
                            onMouseEnter={(e) => { if (historyPage > 1) (e.currentTarget as HTMLElement).style.background = "oklch(0.94 0.004 65)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            onClick={() => setHistoryPage((p) => Math.min(usageMeta.totalPages, p + 1))}
                            disabled={historyPage === usageMeta.totalPages}
                            className="size-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                            style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}
                            onMouseEnter={(e) => { if (historyPage < usageMeta.totalPages) (e.currentTarget as HTMLElement).style.background = "oklch(0.94 0.004 65)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        title={`Delete coupon "${deleteLabel}"?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
