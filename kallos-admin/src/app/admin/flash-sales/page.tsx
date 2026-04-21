"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Zap, ArrowRight, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/sidebar";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormField, inputCls, inputErrCls } from "@/components/admin/form-field";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FlashSale {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  _count?: { items: number };
}

const schema = z.object({
  name: z.string().min(2, "Minimum 2 characters"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function getStatus(sale: FlashSale): "live" | "upcoming" | "ended" | "inactive" {
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

/** Convert ISO/Date string → datetime-local value (YYYY-MM-DDTHH:MM) */
function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FlashSalesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FlashSale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery<{ data: FlashSale[] }>({
    queryKey: ["admin-flash-sales"],
    queryFn: () => api.get("/coupons/flash-sales"),
  });

  const sales = data?.data ?? [];

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  function openCreate() {
    setEditTarget(null);
    reset({ isActive: true, name: "", startTime: "", endTime: "" });
    setSheetOpen(true);
  }

  function openEdit(sale: FlashSale) {
    setEditTarget(sale);
    reset({
      name: sale.name,
      startTime: toDatetimeLocal(sale.startTime),
      endTime: toDatetimeLocal(sale.endTime),
      isActive: sale.isActive,
    });
    setSheetOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/coupons/flash-sales", {
      ...values,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    }),
    onSuccess: () => {
      toast.success("Flash sale created");
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
      setSheetOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) =>
      api.patch(`/coupons/flash-sales/${id}`, {
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Flash sale updated");
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
      setSheetOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/flash-sales/${id}`),
    onSuccess: () => {
      toast.success("Flash sale deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(values: FormValues) {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Flash Sales"
        subtitle={`${sales.length} sales`}
        action={
          <button
            onClick={openCreate}
            className="h-9 px-4 rounded-full text-[11px] font-mono font-semibold flex items-center gap-2 transition-opacity hover:opacity-85"
            style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            New Flash Sale
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
                {["Name", "Start", "End", "Products", "Status", ""].map((h) => (
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
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: j === 0 ? "55%" : "40%" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.94 0.006 65)" }}
                    >
                      <Zap size={22} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No flash sales yet</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>Create a timed discount event</p>
                  </td>
                </tr>
              )}

              {sales.map((sale) => {
                const status = getStatus(sale);
                const ss = STATUS_STYLE[status];
                return (
                  <tr
                    key={sale.id}
                    className="group transition-colors duration-100"
                    style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-medium" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {sale.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                        {formatDateTime(sale.startTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                        {formatDateTime(sale.endTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-mono" style={{ color: "oklch(0.42 0.008 65)" }}>
                        {sale._count?.items ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
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
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(sale)}
                          className="flex items-center gap-1 text-[11px] font-mono transition-colors"
                          style={{ color: "oklch(0.42 0.008 65)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.22 0.010 65)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.42 0.008 65)"; }}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          onClick={() => router.push(`/admin/flash-sales/${sale.id}`)}
                          className="flex items-center gap-1 text-[11px] font-mono transition-colors"
                          style={{ color: "oklch(0.55 0.20 18)" }}
                        >
                          Manage <ArrowRight size={11} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: sale.id, name: sale.name })}
                          disabled={deleteMutation.isPending}
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
          className="w-full sm:max-w-md overflow-y-auto p-0 gap-0"
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
              {editTarget ? "Edit Flash Sale" : "New Flash Sale"}
            </SheetTitle>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.006 65)" }}>
              {editTarget ? "Update name, schedule or active state" : "Configure a timed discount event"}
            </p>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-6 py-5">
            <FormField label="Sale Name" error={errors.name?.message} required>
              <input {...register("name")} placeholder="e.g. Weekend Sale" className={cn(inputCls, errors.name && inputErrCls)} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Start Time" error={errors.startTime?.message} required>
                <input {...register("startTime")} type="datetime-local" className={cn(inputCls, errors.startTime && inputErrCls)} />
              </FormField>
              <FormField label="End Time" error={errors.endTime?.message} required>
                <input {...register("endTime")} type="datetime-local" className={cn(inputCls, errors.endTime && inputErrCls)} />
              </FormField>
            </div>

            {/* Active toggle */}
            <div className="flex flex-col gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.91 0.006 65)" }}>
              <div className="flex items-center justify-between px-4 py-3.5" style={{ background: "oklch(1 0 0)" }}>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "oklch(0.22 0.010 65)" }}>Active</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>Sale will run when enabled and within schedule</p>
                </div>
                <Controller control={control} name="isActive" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
            </div>

            {!editTarget && (
              <p className="text-[11px] font-mono px-3 py-2.5 rounded-xl" style={{ color: "oklch(0.52 0.006 65)", background: "oklch(0.96 0.004 65)" }}>
                After creating, click Manage on the row to assign discounted products.
              </p>
            )}

            <div className="pt-2" style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }}>
              <button
                type="submit"
                disabled={isMutating}
                className="h-10 px-6 rounded-full text-[11px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
              >
                {isMutating && <Loader2 size={12} className="animate-spin" />}
                {editTarget ? "Save Changes" : "Create Flash Sale"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="All product assignments will be removed."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); } }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
