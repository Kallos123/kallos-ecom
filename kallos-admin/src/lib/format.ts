export function formatINR(amount: number | string | null | undefined): string {
  const n = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURN_APPROVED: "Return Approved",
  RETURN_REJECTED: "Return Rejected",
  RETURNED: "Returned",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: "text-amber-700 bg-amber-50 border-amber-200",
  CONFIRMED: "text-blue-700 bg-blue-50 border-blue-200",
  PROCESSING: "text-violet-700 bg-violet-50 border-violet-200",
  SHIPPED: "text-cyan-700 bg-cyan-50 border-cyan-200",
  OUT_FOR_DELIVERY: "text-sky-700 bg-sky-50 border-sky-200",
  DELIVERED: "text-emerald-700 bg-emerald-50 border-emerald-200",
  CANCELLED: "text-neutral-500 bg-neutral-100 border-neutral-200",
  RETURN_REQUESTED: "text-orange-700 bg-orange-50 border-orange-200",
  RETURN_APPROVED: "text-orange-600 bg-orange-50 border-orange-200",
  RETURN_REJECTED: "text-red-700 bg-red-50 border-red-200",
  RETURNED: "text-neutral-500 bg-neutral-100 border-neutral-200",
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-600",
  PAID: "text-emerald-600",
  FAILED: "text-red-600",
  REFUNDED: "text-neutral-400",
  PARTIALLY_REFUNDED: "text-orange-600",
};

// Allowed next statuses per current status (for admin)
export const NEXT_STATUSES: Record<string, string[]> = {
  CONFIRMED: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURN_APPROVED", "RETURN_REJECTED"],
  RETURN_APPROVED: ["RETURNED"],
  RETURN_REJECTED: [],
  RETURNED: [],
};
