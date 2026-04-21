"use client";

import { Suspense, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { formatINR, formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PICKED_UP" | "COMPLETED";

interface ReturnRequest {
  id: string;
  reason: string;
  status: ReturnStatus;
  refundMethod: "ORIGINAL_PAYMENT" | "WALLET";
  refundAmount: number;
  createdAt: string;
  order: {
    orderNumber: string;
    id: string;
    totalAmount: number;
    user: { firstName: string; lastName: string; email: string };
  };
}

const STATUS_STYLE: Record<ReturnStatus, { color: string; bg: string; borderColor: string }> = {
  REQUESTED: { color: "oklch(0.52 0.14 85)",  bg: "oklch(0.96 0.06 85 / 0.35)",  borderColor: "oklch(0.78 0.10 85 / 0.45)" },
  APPROVED:  { color: "oklch(0.38 0.10 250)", bg: "oklch(0.93 0.06 250 / 0.25)", borderColor: "oklch(0.72 0.08 250 / 0.40)" },
  REJECTED:  { color: "oklch(0.48 0.18 18)",  bg: "oklch(0.55 0.20 18 / 0.08)",  borderColor: "oklch(0.65 0.15 18 / 0.35)" },
  PICKED_UP: { color: "oklch(0.42 0.12 310)", bg: "oklch(0.93 0.06 310 / 0.20)", borderColor: "oklch(0.72 0.08 310 / 0.35)" },
  COMPLETED: { color: "oklch(0.38 0.10 155)", bg: "oklch(0.93 0.06 155 / 0.25)", borderColor: "oklch(0.72 0.10 155 / 0.40)" },
};

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED:  "Approved",
  REJECTED:  "Rejected",
  PICKED_UP: "Picked Up",
  COMPLETED: "Completed",
};

const FILTERS = [
  { label: "All",       value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Approved",  value: "APPROVED" },
  { label: "Rejected",  value: "REJECTED" },
  { label: "Completed", value: "COMPLETED" },
];

function ReturnsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [pendingAction, setPendingAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const qs = new URLSearchParams({ ...(status ? { status } : {}), page: String(page), limit: "20" }).toString();

  const { data, isLoading } = useQuery<{ data: ReturnRequest[]; pagination: any }>({
    queryKey: ["admin-returns", status, page],
    queryFn: () => api.get(`/returns?${qs}`),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      api.patch(`/returns/${id}/process`, { approved: action === "approve" }),
    onSuccess: (_, vars) => {
      toast.success(`Return ${vars.action === "approve" ? "approved" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      setPendingAction(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const returns = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader title="Returns" subtitle={pagination ? `${pagination.total} total` : undefined} />

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setParam("status", f.value)}
            className="h-9 px-3.5 rounded-full text-[11px] font-mono tracking-wide whitespace-nowrap transition-all duration-150 cursor-pointer"
            style={
              status === f.value
                ? { background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }
                : { background: "oklch(1 0 0)", border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.45 0.008 65)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table card */}
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
                {["Customer", "Order", "Reason", "Refund", "Method", "Date", "Status", "Actions"].map((h) => (
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
                      <div className="h-3 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)", width: j === 2 ? "70%" : "50%" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && returns.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.94 0.006 65)" }}
                    >
                      <RotateCcw size={20} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>No returns found</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>Return requests will appear here</p>
                  </td>
                </tr>
              )}

              {returns.map((ret) => {
                const ss = STATUS_STYLE[ret.status];
                return (
                  <tr
                    key={ret.id}
                    className="group transition-colors duration-100"
                    style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-medium" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {ret.order.user.firstName} {ret.order.user.lastName}
                      </p>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.006 65)" }}>
                        {ret.order.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/orders/${ret.order.id}`}
                        className="text-[12px] font-mono font-medium transition-opacity hover:opacity-70"
                        style={{ color: "oklch(0.55 0.20 18)" }}
                      >
                        {ret.order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <p className="text-[12px] truncate" style={{ color: "oklch(0.52 0.006 65)" }}>
                        {ret.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-semibold font-mono" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {formatINR(ret.order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
                        style={
                          ret.refundMethod === "WALLET"
                            ? { color: "oklch(0.38 0.10 250)", background: "oklch(0.93 0.06 250 / 0.25)" }
                            : { color: "oklch(0.42 0.008 65)", background: "oklch(0.93 0.003 65 / 0.5)" }
                        }
                      >
                          {ret.refundMethod === "WALLET" ? "Wallet" : "Original Payment"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                        {formatDate(ret.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border whitespace-nowrap"
                        style={{ color: ss.color, background: ss.bg, borderColor: ss.borderColor }}
                      >
                        {STATUS_LABEL[ret.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {ret.status === "REQUESTED" && (
                          <>
                            <button
                              onClick={() => setPendingAction({ id: ret.id, action: "approve" })}
                              className="h-7 px-2.5 rounded-full text-[10px] font-mono font-medium transition-opacity hover:opacity-75"
                              style={{ color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.30)", border: "1px solid oklch(0.72 0.10 155 / 0.40)" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setPendingAction({ id: ret.id, action: "reject" })}
                              className="h-7 px-2.5 rounded-full text-[10px] font-mono font-medium transition-opacity hover:opacity-75"
                              style={{ color: "oklch(0.48 0.18 18)", background: "oklch(0.55 0.20 18 / 0.08)", border: "1px solid oklch(0.65 0.15 18 / 0.35)" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {ret.status === "APPROVED" && (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border"
                            style={{ color: "oklch(0.38 0.10 250)", background: "oklch(0.93 0.06 250 / 0.25)", borderColor: "oklch(0.72 0.08 250 / 0.40)" }}
                          >
                            Refund Initiated
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      <ConfirmDialog
        open={pendingAction?.action === "approve"}
        title="Approve this return?"
        description="The refund will be initiated immediately and the customer will be notified."
        confirmLabel="Approve"
        variant="success"
        loading={actionMutation.isPending}
        onConfirm={() => { if (pendingAction) actionMutation.mutate(pendingAction); }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction?.action === "reject"}
        title="Reject this return?"
        description="The return request will be closed and the customer will be notified."
        confirmLabel="Reject"
        variant="danger"
        loading={actionMutation.isPending}
        onConfirm={() => { if (pendingAction) actionMutation.mutate(pendingAction); }}
        onCancel={() => setPendingAction(null)}
      />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-5 py-3"
            style={{ borderTop: "1px solid oklch(0.92 0.006 65)" }}
          >
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.008 65)" }}>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} returns
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
    </div>
  );
}

export default function ReturnsPage() {
  return <Suspense><ReturnsContent /></Suspense>;
}
