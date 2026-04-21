"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  PAYMENT_STATUS_COLOR,
  formatINR,
  formatDateTime,
} from "@/lib/format";
import type { Order } from "@/lib/types";
import { Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING_PAYMENT" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Returns", value: "RETURN_REQUESTED" },
];

interface OrdersApiResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const search = searchParams.get("search") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const queryString = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    page: String(page),
    limit: "20",
  }).toString();

  const { data, isLoading } = useQuery<OrdersApiResponse>({
    queryKey: ["admin-orders", status, page, search],
    queryFn: () => api.get(`/orders/admin/all?${queryString}`),
  });

  const orders = data?.data ?? [];
  const pagination = data?.meta;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={pagination ? `${pagination.total} total orders` : undefined}
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search
            size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "oklch(0.62 0.008 65)" }}
          />
          <input
            type="text"
            placeholder="Order number or email..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("search", (e.target as HTMLInputElement).value);
            }}
            className="w-full h-9 rounded-full pl-9 pr-4 text-[12px] font-mono focus:outline-none transition-all duration-150"
            style={{
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.88 0.008 65)",
              color: "oklch(0.18 0.010 65)",
            }}
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

        {/* Status pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setParam("status", f.value)}
              className="h-9 px-3.5 rounded-full text-[11px] font-mono tracking-wide whitespace-nowrap transition-all duration-150 cursor-pointer"
              style={
                status === f.value
                  ? {
                      background: "oklch(0.55 0.20 18)",
                      color: "oklch(0.97 0 0)",
                    }
                  : {
                      background: "oklch(1 0 0)",
                      border: "1px solid oklch(0.88 0.008 65)",
                      color: "oklch(0.45 0.008 65)",
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
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
                {["Order", "Customer", "Date", "Items", "Total", "Payment", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.18em] uppercase font-medium whitespace-nowrap"
                      style={{ color: "oklch(0.48 0.008 65)", background: "oklch(0.985 0.005 65)" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {/* Loading skeletons */}
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                  >
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-3 rounded-full animate-pulse"
                          style={{
                            background: "oklch(0.93 0.004 65)",
                            width: j === 1 ? "70%" : j === 7 ? "40%" : "55%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty state */}
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p
                      className="text-[13px] font-mono"
                      style={{ color: "oklch(0.62 0.008 65)" }}
                    >
                      No orders found
                    </p>
                  </td>
                </tr>
              )}

              {/* Order rows */}
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="group transition-colors duration-100"
                  style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  <td className="px-4 py-3.5">
                    <span
                      className="text-[12px] font-mono font-medium"
                      style={{ color: "oklch(0.22 0.010 65)" }}
                    >
                      {order.orderNumber}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <p
                      className="text-[13px] font-medium leading-tight"
                      style={{ color: "oklch(0.18 0.010 65)" }}
                    >
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p
                      className="text-[11px] font-mono mt-0.5"
                      style={{ color: "oklch(0.55 0.006 65)" }}
                    >
                      {order.user.email}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: "oklch(0.52 0.006 65)" }}
                    >
                      {formatDateTime(order.createdAt)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className="text-[12px] font-mono"
                      style={{ color: "oklch(0.42 0.008 65)" }}
                    >
                      {order.items?.length ?? "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className="text-[13px] font-semibold font-mono"
                      style={{ color: "oklch(0.18 0.010 65)" }}
                    >
                      {formatINR(order.total)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <p
                      className={cn("text-[11px] font-mono font-medium", PAYMENT_STATUS_COLOR[order.paymentStatus])}
                    >
                      {order.paymentStatus}
                    </p>
                    <p
                      className="text-[10px] font-mono mt-0.5"
                      style={{ color: "oklch(0.65 0.006 65)" }}
                    >
                      {order.paymentMethod}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border whitespace-nowrap",
                        ORDER_STATUS_COLOR[order.status] ?? "text-neutral-500 bg-neutral-100 border-neutral-200"
                      )}
                    >
                      {ORDER_STATUS_LABEL[order.status] || order.status || "Unknown"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-1 text-[11px] font-mono opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: "oklch(0.55 0.20 18)" }}
                    >
                      View <ArrowRight size={11} />
                    </Link>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-5 py-3"
            style={{ borderTop: "1px solid oklch(0.92 0.006 65)" }}
          >
            <p
              className="text-[11px] font-mono"
              style={{ color: "oklch(0.55 0.008 65)" }}
            >
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setParam("page", String(page - 1))}
                disabled={!pagination.hasPrev}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  border: "1px solid oklch(0.88 0.008 65)",
                  color: "oklch(0.42 0.008 65)",
                }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setParam("page", String(page + 1))}
                disabled={!pagination.hasNext}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  border: "1px solid oklch(0.88 0.008 65)",
                  color: "oklch(0.42 0.008 65)",
                }}
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

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
