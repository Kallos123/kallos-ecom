"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  PAYMENT_STATUS_COLOR,
  NEXT_STATUSES,
  formatINR,
  formatDateTime,
} from "@/lib/format";
import type { ApiResponse, Order, OrderStatus } from "@/lib/types";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Loader2,
  User,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Status icon map ──────────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING_PAYMENT: Clock,
  CONFIRMED:       CheckCircle2,
  PROCESSING:      RefreshCw,
  SHIPPED:         Truck,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED:       Package,
  CANCELLED:       XCircle,
  RETURN_REQUESTED: RotateCcw,
  RETURN_APPROVED:  RotateCcw,
  RETURN_REJECTED:  XCircle,
  RETURNED:         RotateCcw,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl overflow-hidden", className)}
      style={{
        background: "oklch(1 0 0)",
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.07)",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-5 py-3.5"
      style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.987 0.005 65)" }}
    >
      <Icon size={13} strokeWidth={2} style={{ color: "oklch(0.55 0.20 18)" }} />
      <span className="text-[11px] font-mono tracking-[0.18em] uppercase font-semibold"
        style={{ color: "oklch(0.38 0.008 65)" }}>
        {title}
      </span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono tracking-[0.14em] uppercase font-medium mb-1"
        style={{ color: "oklch(0.60 0.008 65)" }}>
        {label}
      </p>
      <p className="text-[13px] font-medium" style={{ color: "oklch(0.18 0.010 65)" }}>
        {value ?? "—"}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [statusNote, setStatusNote] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [courier, setCourier] = useState("");
  const [showTracking, setShowTracking] = useState(false);

  const { data, isLoading } = useQuery<ApiResponse<Order>>({
    queryKey: ["order", params.id],
    queryFn: () => api.get(`/orders/admin/${params.id}`),
  });

  const order = data?.data;

  const updateStatus = useMutation({
    mutationFn: (newStatus: OrderStatus) =>
      api.patch(`/orders/admin/${params.id}/status`, {
        status: newStatus,
        note: statusNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setStatusNote("");
    },
  });

  const updateTracking = useMutation({
    mutationFn: () =>
      api.patch(`/orders/admin/${params.id}/tracking`, { trackingId, courier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", params.id] });
      setShowTracking(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin" style={{ color: "oklch(0.65 0.008 65)" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-sm" style={{ color: "oklch(0.55 0.008 65)" }}>
          Order not found
        </p>
        <Link href="/admin/orders"
          className="text-[12px] font-mono mt-2 inline-block"
          style={{ color: "oklch(0.55 0.20 18)" }}>
          ← Back to orders
        </Link>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[order.status] ?? [];
  const StatusIcon = STATUS_ICONS[order.status] ?? Clock;

  return (
    <div>
      <PageHeader
        breadcrumb={["Orders"]}
        title={order.orderNumber}
        subtitle={`Placed on ${formatDateTime(order.createdAt)}`}
        action={
          <button
            onClick={() => router.back()}
            className="h-9 px-4 rounded-full text-[11px] font-mono font-medium flex items-center gap-2 transition-all hover:opacity-80 cursor-pointer"
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

      {/* ── Status + Actions bar ── */}
      <Card className="mb-4">
        <div className="px-5 py-4 flex flex-wrap items-center gap-4">
          {/* Current status badge */}
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold border",
            ORDER_STATUS_COLOR[order.status] ?? "text-neutral-500 bg-neutral-100 border-neutral-200"
          )}>
            <StatusIcon size={11} strokeWidth={2.5} />
            {ORDER_STATUS_LABEL[order.status] || order.status || "Unknown"}
          </span>

          {/* Payment status */}
          <div className="flex items-center gap-2">
            <span className={cn("text-[12px] font-mono font-semibold", PAYMENT_STATUS_COLOR[order.paymentStatus])}>
              {order.paymentStatus}
            </span>
            <span style={{ color: "oklch(0.80 0.006 65)" }}>·</span>
            <span className="text-[12px] font-mono" style={{ color: "oklch(0.52 0.008 65)" }}>
              {order.paymentMethod}
            </span>
          </div>

          {/* Move-to-next-status actions */}
          {nextStatuses.length > 0 && (
            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
              {/* Optional note input */}
              <input
                type="text"
                placeholder="Note (optional)..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="h-9 rounded-full px-4 text-[12px] font-mono focus:outline-none transition-all duration-150 w-full sm:w-[200px]"
                style={{
                  background: "oklch(0.975 0.006 65)",
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
              {nextStatuses.map((s) => {
                const isCancel = s === "CANCELLED";
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate(s as OrderStatus)}
                    disabled={updateStatus.isPending}
                    className="h-9 px-4 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={isCancel ? {
                      background: "oklch(0.55 0.20 18 / 0.08)",
                      color: "oklch(0.48 0.18 18)",
                      border: "1px solid oklch(0.55 0.20 18 / 0.25)",
                    } : {
                      background: "oklch(0.55 0.20 18)",
                      color: "oklch(0.97 0 0)",
                      boxShadow: "0 2px 8px -1px oklch(0.55 0.20 18 / 0.35)",
                    }}
                  >
                    {updateStatus.isPending && <Loader2 size={11} className="animate-spin" />}
                    → {ORDER_STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Order items */}
          <Card>
            <CardHeader icon={Package} title="Order Items" />
            <div className="px-5 py-1">
              {order.items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-4"
                  style={i < order.items.length - 1 ? { borderBottom: "1px solid oklch(0.93 0.005 65)" } : {}}
                >
                  {/* Thumbnail placeholder */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.94 0.006 65)" }}
                  >
                    <Package size={16} strokeWidth={1.5} style={{ color: "oklch(0.65 0.008 65)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "oklch(0.15 0.010 65)" }}>
                      {item.productName}
                    </p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.006 65)" }}>
                      {item.variantSku}
                      {item.variantSize && ` · ${item.variantSize}`}
                      {item.variantColor && ` · ${item.variantColor}`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold font-mono" style={{ color: "oklch(0.15 0.010 65)" }}>
                      {formatINR(item.totalPrice)}
                    </p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>
                      {formatINR(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              className="px-5 py-4 space-y-2"
              style={{ borderTop: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.987 0.005 65)" }}
            >
              <div className="flex justify-between text-[12px] font-mono">
                <span style={{ color: "oklch(0.52 0.008 65)" }}>Subtotal</span>
                <span style={{ color: "oklch(0.30 0.008 65)" }}>{formatINR(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-[12px] font-mono">
                  <span style={{ color: "oklch(0.45 0.12 148)" }}>
                    Discount {order.couponCode && `(${order.couponCode})`}
                  </span>
                  <span style={{ color: "oklch(0.45 0.12 148)" }}>−{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[12px] font-mono">
                <span style={{ color: "oklch(0.52 0.008 65)" }}>Shipping</span>
                <span style={{ color: "oklch(0.30 0.008 65)" }}>
                  {Number(order.shippingCharge) === 0 ? "Free" : formatINR(order.shippingCharge)}
                </span>
              </div>
              <div
                className="flex justify-between pt-2 mt-1"
                style={{ borderTop: "1px solid oklch(0.88 0.008 65)" }}
              >
                <span className="text-[13px] font-semibold font-mono" style={{ color: "oklch(0.18 0.010 65)" }}>
                  Total
                </span>
                <span className="text-[14px] font-bold font-mono" style={{ color: "oklch(0.55 0.20 18)" }}>
                  {formatINR(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader icon={Clock} title="Status History" />
            <div className="px-5 py-3">
              {order.statusHistory
                .slice()
                .reverse()
                .map((h, i) => {
                  const HIcon = STATUS_ICONS[h.status] ?? Clock;
                  const isLatest = i === 0;
                  return (
                    <div
                      key={h.id}
                      className="flex gap-3 py-3"
                      style={i < order.statusHistory.length - 1 ? { borderBottom: "1px solid oklch(0.93 0.005 65)" } : {}}
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={isLatest ? {
                          background: "oklch(0.55 0.20 18 / 0.10)",
                        } : {
                          background: "oklch(0.93 0.005 65)",
                        }}
                      >
                        <HIcon
                          size={12}
                          strokeWidth={2}
                          style={{ color: isLatest ? "oklch(0.55 0.20 18)" : "oklch(0.65 0.008 65)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[13px] font-semibold"
                            style={{ color: isLatest ? "oklch(0.15 0.010 65)" : "oklch(0.38 0.008 65)" }}
                          >
                            {ORDER_STATUS_LABEL[h.status] ?? h.status}
                          </span>
                          <span className="text-[10px] font-mono whitespace-nowrap"
                            style={{ color: "oklch(0.62 0.006 65)" }}>
                            {formatDateTime(h.createdAt)}
                          </span>
                        </div>
                        {h.note && (
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.008 65)" }}>
                            {h.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Customer */}
          <Card>
            <CardHeader icon={User} title="Customer" />
            <div className="px-5 py-4 space-y-4">
              <Field label="Name" value={`${order.user.firstName} ${order.user.lastName}`} />
              <Field label="Email" value={order.user.email} />
              <Field label="Phone" value={order.user.phone} />
            </div>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader icon={MapPin} title="Shipping Address" />
            <div className="px-5 py-4">
              {order.shippingAddress ? (
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold" style={{ color: "oklch(0.15 0.010 65)" }}>
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.008 65)" }}>
                    {order.shippingAddress.line1}
                  </p>
                  {order.shippingAddress.line2 && (
                    <p className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.008 65)" }}>
                      {order.shippingAddress.line2}
                    </p>
                  )}
                  <p className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.008 65)" }}>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </p>
                  <p className="text-[12px] font-mono pt-1" style={{ color: "oklch(0.45 0.008 65)" }}>
                    {order.shippingAddress.phone}
                  </p>
                </div>
              ) : (
                <p className="text-[12px] font-mono" style={{ color: "oklch(0.62 0.008 65)" }}>
                  No address on file
                </p>
              )}
            </div>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader icon={Truck} title="Tracking" />
            <div className="px-5 py-4">
              {order.trackingId ? (
                <div className="space-y-3">
                  <Field label="Courier" value={order.courier} />
                  <Field label="Tracking ID" value={order.trackingId} />
                </div>
              ) : (
                <p className="text-[12px] font-mono mb-3" style={{ color: "oklch(0.62 0.008 65)" }}>
                  No tracking info yet
                </p>
              )}

              {!showTracking ? (
                <button
                  onClick={() => setShowTracking(true)}
                  className="mt-3 text-[11px] font-mono font-semibold cursor-pointer"
                  style={{ color: "oklch(0.55 0.20 18)" }}
                >
                  {order.trackingId ? "Update tracking →" : "Add tracking →"}
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  {[
                    { placeholder: "Courier name (e.g. Delhivery)", value: courier, onChange: setCourier },
                    { placeholder: "Tracking / waybill number", value: trackingId, onChange: setTrackingId },
                  ].map(({ placeholder, value, onChange }) => (
                    <input
                      key={placeholder}
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full h-9 rounded-xl px-3 text-[12px] font-mono focus:outline-none transition-all duration-150"
                      style={{
                        background: "oklch(0.975 0.006 65)",
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
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateTracking.mutate()}
                      disabled={!trackingId || !courier || updateTracking.isPending}
                      className="h-9 px-4 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                      style={{
                        background: "oklch(0.55 0.20 18)",
                        color: "oklch(0.97 0 0)",
                        boxShadow: "0 2px 8px -1px oklch(0.55 0.20 18 / 0.35)",
                      }}
                    >
                      {updateTracking.isPending && <Loader2 size={11} className="animate-spin" />}
                      Save
                    </button>
                    <button
                      onClick={() => setShowTracking(false)}
                      className="h-9 px-4 rounded-full text-[11px] font-mono font-semibold cursor-pointer transition-all"
                      style={{
                        border: "1px solid oklch(0.88 0.008 65)",
                        color: "oklch(0.45 0.008 65)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader icon={Receipt} title="Order Notes" />
              <div className="px-5 py-4">
                <p className="text-[12px] font-mono" style={{ color: "oklch(0.42 0.008 65)" }}>
                  {order.notes}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
