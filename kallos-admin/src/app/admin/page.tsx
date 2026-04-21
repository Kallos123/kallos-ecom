"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import {
  TrendingUp, ShoppingBag, Users, IndianRupee,
  ArrowUpRight, ArrowDownRight, Clock,
  RotateCcw, CreditCard, TriangleAlert, Package,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryData {
  data: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    pendingOrders: number;
    revenueGrowth?: number;
    ordersGrowth?: number;
  };
}

interface TrendPoint { date: string; revenue: number; orders: number; }

interface TopProduct {
  variantId: string;
  product: { id: string; name: string; slug: string } | undefined;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface SalesOverview {
  data: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    vsLastPeriod: number | null;
  };
}

interface StatusBreakdown {
  data: Array<{ status: string; count: number }>;
}

interface PaymentBreakdown {
  data: Array<{ method: string; count: number; revenue: number }>;
}

interface CustomerStats {
  data: {
    total: number;
    newThisMonth: number;
    topCustomers: Array<{
      user: { firstName: string; lastName: string; email: string } | null;
      totalSpent: number;
      orderCount: number;
    }>;
  };
}

interface ReturnStats {
  data: {
    totalReturns: number;
    approved: number;
    rejected: number;
    returnRate: number;
  };
}

interface LowStockVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  product: { name: string; slug: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT:  "Pending Payment",
  PAYMENT_FAILED:   "Payment Failed",
  CONFIRMED:        "Confirmed",
  PROCESSING:       "Processing",
  SHIPPED:          "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURN_APPROVED:  "Return Approved",
  RETURN_REJECTED:  "Return Rejected",
  RETURNED:         "Returned",
  REFUNDED:         "Refunded",
};

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:        "oklch(0.48 0.14 155)",
  CONFIRMED:        "oklch(0.50 0.16 250)",
  PROCESSING:       "oklch(0.50 0.18 270)",
  SHIPPED:          "oklch(0.50 0.18 285)",
  OUT_FOR_DELIVERY: "oklch(0.50 0.18 300)",
  PENDING_PAYMENT:  "oklch(0.58 0.14 70)",
  PAYMENT_FAILED:   "oklch(0.52 0.20 18)",
  CANCELLED:        "oklch(0.52 0.20 18)",
  RETURN_REQUESTED: "oklch(0.55 0.16 45)",
  RETURN_APPROVED:  "oklch(0.52 0.14 60)",
  RETURN_REJECTED:  "oklch(0.52 0.20 18)",
  RETURNED:         "oklch(0.50 0.08 65)",
  REFUNDED:         "oklch(0.48 0.12 155)",
};

const METHOD_LABELS: Record<string, string> = {
  COD:                 "Cash on Delivery",
  RAZORPAY:            "Razorpay",
  WALLET:              "Wallet",
  RAZORPAY_AND_WALLET: "Razorpay + Wallet",
};

const RANGES = [
  { value: "today", label: "Today" },
  { value: "week",  label: "Week"  },
  { value: "month", label: "Month" },
  { value: "year",  label: "Year"  },
] as const;

type RangeValue = typeof RANGES[number]["value"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

const CARD_STYLE = {
  background: "oklch(1 0 0)",
  boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
};

const axisStyle = {
  fontSize: 10,
  fontFamily: "var(--font-jetbrains-mono)",
  fill: "oklch(0.60 0.006 65)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "oklch(1 0 0)", boxShadow: "0 4px 20px -2px oklch(0 0 0 / 0.11), 0 2px 6px -1px oklch(0 0 0 / 0.06)", border: "1px solid oklch(0.91 0.006 65)" }}>
      <p className="text-[10px] font-mono mb-0.5" style={{ color: "oklch(0.58 0.008 65)" }}>{label}</p>
      <p className="text-[13px] font-mono font-semibold" style={{ color: "oklch(0.55 0.20 18)" }}>{formatINR(payload[0]?.value ?? 0)}</p>
    </div>
  );
};

const OrdersTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "oklch(1 0 0)", boxShadow: "0 4px 20px -2px oklch(0 0 0 / 0.11), 0 2px 6px -1px oklch(0 0 0 / 0.06)", border: "1px solid oklch(0.91 0.006 65)" }}>
      <p className="text-[10px] font-mono mb-0.5" style={{ color: "oklch(0.58 0.008 65)" }}>{label}</p>
      <p className="text-[13px] font-mono font-semibold" style={{ color: "oklch(0.18 0.010 65)" }}>{payload[0]?.value} orders</p>
    </div>
  );
};

function StatCard({ label, value, icon: Icon, growth, accent }: {
  label: string; value: string | number; icon: React.ElementType; growth?: number | null; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 overflow-hidden"
      style={{
        background: accent ? "oklch(0.99 0.006 30)" : "oklch(1 0 0)",
        boxShadow: accent
          ? "0 2px 8px -1px oklch(0.55 0.20 18 / 0.10), 0 1px 3px oklch(0 0 0 / 0.04)"
          : "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.15em] sm:tracking-[0.18em] uppercase font-medium leading-tight" style={{ color: "oklch(0.42 0.008 65)" }}>
          {label}
        </span>
        <Icon size={13} strokeWidth={1.5} style={{ color: accent ? "oklch(0.55 0.20 18)" : "oklch(0.58 0.006 65)" }} />
      </div>
      <p className="text-[1.8rem] sm:text-[2.4rem] leading-none font-semibold" style={{ color: "oklch(0.10 0.010 65)", letterSpacing: "-0.03em" }}>
        {value}
      </p>
      {growth != null && growth !== 0 && (
        <span className="self-start rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-mono flex items-center gap-0.5 w-fit"
          style={growth >= 0
            ? { background: "oklch(0.92 0.06 145)", color: "oklch(0.38 0.12 148)" }
            : { background: "oklch(0.55 0.20 18 / 0.09)", color: "oklch(0.46 0.18 18)" }
          }
        >
          {growth >= 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
          <span className="hidden sm:inline">{Math.abs(growth)}% vs last month</span>
          <span className="sm:hidden">{Math.abs(growth)}%</span>
        </span>
      )}
    </div>
  );
}

function CardHeader({ label, title, icon: Icon }: { label: string; title: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start justify-between mb-4 sm:mb-5">
      <div>
        <p className="text-[10px] font-mono tracking-[0.18em] uppercase font-medium mb-1" style={{ color: "oklch(0.42 0.008 65)" }}>{label}</p>
        <p className="text-[14px] sm:text-[15px] font-semibold font-sans" style={{ color: "oklch(0.10 0.010 65)" }}>{title}</p>
      </div>
      {Icon && <Icon size={15} strokeWidth={1.5} style={{ color: "oklch(0.58 0.006 65)", marginTop: "2px" }} />}
    </div>
  );
}

function MiniStatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: highlight ? "oklch(0.99 0.006 30)" : "oklch(0.975 0.004 65)" }}>
      <p className="text-[9px] font-mono tracking-[0.14em] uppercase mb-1.5" style={{ color: "oklch(0.55 0.008 65)" }}>{label}</p>
      <p className="text-[1.35rem] font-semibold leading-none" style={{ color: highlight ? "oklch(0.50 0.18 18)" : "oklch(0.10 0.010 65)", letterSpacing: "-0.03em" }}>
        {value}
      </p>
    </div>
  );
}

function SkeletonCard({ height = 80 }: { height?: number }) {
  return <div className="rounded-xl animate-pulse" style={{ height, background: "oklch(0.95 0.004 65)" }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [salesRange, setSalesRange] = useState<RangeValue>("month");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: summary } = useQuery<SummaryData>({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get("/analytics/summary"),
  });

  const { data: salesData, isLoading: loadingSales } = useQuery<{ data: TrendPoint[] }>({
    queryKey: ["analytics-revenue-trend"],
    queryFn: () => api.get("/analytics/revenue-trend?days=365"),
  });

  const { data: dailyData } = useQuery<{ data: TrendPoint[] }>({
    queryKey: ["analytics-revenue-trend-30"],
    queryFn: () => api.get("/analytics/revenue-trend?days=30"),
  });

  const { data: topProducts } = useQuery<{ data: TopProduct[] }>({
    queryKey: ["analytics-top-products"],
    queryFn: () => api.get("/analytics/top-products?limit=5"),
  });

  const { data: salesOverview, isLoading: loadingSalesOverview } = useQuery<SalesOverview>({
    queryKey: ["analytics-sales", salesRange],
    queryFn: () => api.get(`/analytics/sales?range=${salesRange}`),
  });

  const { data: statusBreakdown } = useQuery<StatusBreakdown>({
    queryKey: ["analytics-order-status"],
    queryFn: () => api.get("/analytics/orders/status"),
  });

  const { data: paymentBreakdown } = useQuery<PaymentBreakdown>({
    queryKey: ["analytics-payment-methods"],
    queryFn: () => api.get("/analytics/orders/payment-methods"),
  });

  const { data: customerStats } = useQuery<CustomerStats>({
    queryKey: ["analytics-customers"],
    queryFn: () => api.get("/analytics/customers"),
  });

  const { data: returnStats } = useQuery<ReturnStats>({
    queryKey: ["analytics-returns"],
    queryFn: () => api.get("/analytics/returns"),
  });

  const { data: lowStock } = useQuery<{ data: LowStockVariant[] }>({
    queryKey: ["analytics-low-stock"],
    queryFn: () => api.get("/analytics/low-stock?threshold=10"),
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const stats        = summary?.data;
  const chartData    = Array.isArray(salesData?.data) ? salesData.data : [];
  const dailyChart   = Array.isArray(dailyData?.data) ? dailyData.data : [];
  const products     = topProducts?.data ?? [];
  const maxRevenue   = products[0]?.totalRevenue ?? 1;
  const overview     = salesOverview?.data;
  const statuses     = (statusBreakdown?.data ?? []).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  const maxStatus    = statuses[0]?.count ?? 1;
  const payments     = paymentBreakdown?.data ?? [];
  const maxPayment   = Math.max(...payments.map((p) => p.count), 1);
  const customers    = customerStats?.data;
  const returns      = returnStats?.data;
  const lowStockItems = lowStock?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      />

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        <StatCard label="Total Revenue" value={stats ? formatINR(stats.totalRevenue) : "—"} icon={IndianRupee} growth={stats?.revenueGrowth} accent />
        <StatCard label="Total Orders"  value={stats?.totalOrders ?? "—"} icon={ShoppingBag} growth={stats?.ordersGrowth} />
        <StatCard label="Customers"     value={stats?.totalUsers ?? "—"} icon={Users} />
        <StatCard label="Pending"       value={stats?.pendingOrders ?? "—"} icon={Clock} />
      </div>

      {/* ── Sales Overview ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 sm:p-6 mb-3 sm:mb-4" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <p className="text-[10px] font-mono tracking-[0.18em] uppercase font-medium mb-1" style={{ color: "oklch(0.42 0.008 65)" }}>Sales Overview</p>
            <p className="text-[14px] sm:text-[15px] font-semibold font-sans" style={{ color: "oklch(0.10 0.010 65)" }}>Period Summary</p>
          </div>
          {/* Range tabs */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl" style={{ background: "oklch(0.95 0.004 65)" }}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setSalesRange(r.value)}
                className="px-2.5 sm:px-3 py-1.5 rounded-[10px] text-[9px] sm:text-[10px] font-mono tracking-[0.10em] uppercase transition-all"
                style={salesRange === r.value
                  ? { background: "oklch(1 0 0)", color: "oklch(0.55 0.20 18)", boxShadow: "0 1px 4px oklch(0 0 0 / 0.08)" }
                  : { color: "oklch(0.52 0.008 65)" }
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loadingSalesOverview ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} height={68} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4" style={{ background: "oklch(0.975 0.004 65)" }}>
              <p className="text-[9px] font-mono tracking-[0.14em] uppercase mb-1.5" style={{ color: "oklch(0.55 0.008 65)" }}>Orders</p>
              <p className="text-[1.5rem] font-semibold leading-none mb-1.5" style={{ color: "oklch(0.10 0.010 65)", letterSpacing: "-0.03em" }}>
                {(overview?.totalOrders ?? 0).toLocaleString("en-IN")}
              </p>
              {overview?.vsLastPeriod != null && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                  style={overview.vsLastPeriod >= 0
                    ? { background: "oklch(0.92 0.06 145)", color: "oklch(0.38 0.12 148)" }
                    : { background: "oklch(0.55 0.20 18 / 0.09)", color: "oklch(0.46 0.18 18)" }
                  }
                >
                  {overview.vsLastPeriod >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                  {Math.abs(Math.round(overview.vsLastPeriod))}% vs prev
                </span>
              )}
            </div>
            <div className="rounded-xl p-4" style={{ background: "oklch(0.99 0.006 30)" }}>
              <p className="text-[9px] font-mono tracking-[0.14em] uppercase mb-1.5" style={{ color: "oklch(0.55 0.008 65)" }}>Revenue</p>
              <p className="text-[1.5rem] font-semibold leading-none" style={{ color: "oklch(0.50 0.18 18)", letterSpacing: "-0.03em" }}>
                {formatINR(overview?.totalRevenue ?? 0)}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "oklch(0.975 0.004 65)" }}>
              <p className="text-[9px] font-mono tracking-[0.14em] uppercase mb-1.5" style={{ color: "oklch(0.55 0.008 65)" }}>Avg Order Value</p>
              <p className="text-[1.5rem] font-semibold leading-none" style={{ color: "oklch(0.10 0.010 65)", letterSpacing: "-0.03em" }}>
                {formatINR(overview?.averageOrderValue ?? 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Revenue Trend + Daily Orders ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Revenue Trend" title="Past 12 Months" icon={TrendingUp} />
          {loadingSales ? (
            <SkeletonCard height={180} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.52 0.20 18)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="oklch(0.52 0.20 18)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="oklch(0.93 0.004 65)" vertical={false} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(chartData.length / 5) - 1)} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => {
                  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                  return v > 0 ? `₹${v}` : "";
                }} />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "oklch(0.88 0.006 65)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" stroke="oklch(0.52 0.20 18)" strokeWidth={1.75} fill="url(#revenueGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Daily Orders" title="Past 30 Days" icon={ShoppingBag} />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyChart} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="oklch(0.93 0.004 65)" vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<OrdersTooltip />} cursor={{ fill: "oklch(0.96 0.004 65)" }} />
              <Bar dataKey="orders" fill="oklch(0.55 0.20 18)" fillOpacity={0.80} radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Order Status + Payment Methods ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        {/* Order Status Breakdown */}
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Order Status" title="All-Time Breakdown" />
          {statuses.length === 0 ? (
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.65 0.008 65)" }}>No orders yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {statuses.map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono shrink-0 w-[118px] truncate" style={{ color: "oklch(0.42 0.008 65)" }}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 65)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(s.count / maxStatus) * 100}%`, background: STATUS_COLORS[s.status] ?? "oklch(0.55 0.20 18 / 0.40)" }}
                    />
                  </div>
                  <span className="text-[11px] font-mono tabular-nums w-6 text-right shrink-0 font-medium" style={{ color: "oklch(0.25 0.010 65)" }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Distribution */}
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Payment Methods" title="Distribution" icon={CreditCard} />
          {payments.length === 0 ? (
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.65 0.008 65)" }}>No payment data yet</p>
          ) : (
            <div className="flex flex-col gap-4">
              {payments.map((p) => (
                <div key={p.method}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium" style={{ color: "oklch(0.18 0.010 65)" }}>
                      {METHOD_LABELS[p.method] ?? p.method}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono" style={{ color: "oklch(0.58 0.008 65)" }}>{p.count} orders</span>
                      <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.25 0.010 65)" }}>{formatINR(p.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 65)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(p.count / maxPayment) * 100}%`, background: "oklch(0.55 0.20 18 / 0.55)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Customer Growth + Returns ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        {/* Customer Stats */}
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Customer Growth" title="Users & Top Spenders" icon={Users} />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MiniStatBox label="Total Customers" value={customers?.total ?? "—"} />
            <MiniStatBox label="New This Month"  value={customers?.newThisMonth ?? "—"} />
          </div>

          {(customers?.topCustomers ?? []).length > 0 && (
            <>
              <p className="text-[9px] font-mono tracking-[0.14em] uppercase mb-2.5" style={{ color: "oklch(0.60 0.008 65)" }}>Top Spenders</p>
              <div className="flex flex-col gap-2.5">
                {customers!.topCustomers.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-[9px] font-mono w-4 text-right shrink-0 tabular-nums" style={{ color: "oklch(0.72 0.006 65)" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {c.user ? `${c.user.firstName} ${c.user.lastName}` : "—"}
                      </p>
                      <p className="text-[9px] font-mono truncate" style={{ color: "oklch(0.58 0.008 65)" }}>
                        {c.user?.email ?? ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.25 0.010 65)" }}>{formatINR(c.totalSpent)}</p>
                      <p className="text-[9px] font-mono" style={{ color: "oklch(0.60 0.008 65)" }}>{c.orderCount} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Returns Statistics */}
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Returns" title="Return Statistics" icon={RotateCcw} />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MiniStatBox label="Total Returns" value={returns?.totalReturns ?? "—"} />
            <MiniStatBox label="Return Rate"   value={returns != null ? `${returns.returnRate.toFixed(1)}%` : "—"} highlight />
            <MiniStatBox label="Approved"      value={returns?.approved ?? "—"} />
            <MiniStatBox label="Rejected"      value={returns?.rejected ?? "—"} />
          </div>

          {returns != null && returns.totalReturns > 0 && (
            <div className="rounded-xl p-3.5" style={{ background: "oklch(0.975 0.004 65)" }}>
              <p className="text-[9px] font-mono tracking-[0.14em] uppercase mb-2.5" style={{ color: "oklch(0.55 0.008 65)" }}>Approval vs Rejection</p>
              <div className="h-[6px] rounded-full overflow-hidden flex" style={{ background: "oklch(0.93 0.006 65)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(returns.approved / returns.totalReturns) * 100}%`, background: "oklch(0.48 0.14 155)" }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] font-mono" style={{ color: "oklch(0.48 0.14 155)" }}>
                  {Math.round((returns.approved / returns.totalReturns) * 100)}% approved
                </span>
                <span className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.20 18)" }}>
                  {Math.round((returns.rejected / returns.totalReturns) * 100)}% rejected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Products + Low Stock ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Top Products */}
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Top Products" title="By Revenue" />
          {products.length === 0 ? (
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.65 0.008 65)" }}>No sales data yet</p>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {products.slice(0, 5).map((item, i) => (
                <div key={item.variantId} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono w-4 shrink-0 text-right tabular-nums" style={{ color: "oklch(0.72 0.006 65)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] sm:text-[12px] font-medium truncate pr-2" style={{ color: "oklch(0.18 0.010 65)" }}>
                        {item.product?.name ?? "—"}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-mono font-semibold shrink-0 tabular-nums"
                        style={{ color: i === 0 ? "oklch(0.50 0.18 18)" : "oklch(0.42 0.008 65)" }}>
                        {formatINR(item.totalRevenue)}
                      </p>
                    </div>
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 65)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${(item.totalRevenue / maxRevenue) * 100}%`, background: i === 0 ? "oklch(0.55 0.20 18 / 0.65)" : "oklch(0.55 0.20 18 / 0.22)" }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono w-10 text-right shrink-0 tabular-nums" style={{ color: "oklch(0.58 0.006 65)" }}>
                    {item.totalQuantitySold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl p-4 sm:p-6" style={CARD_STYLE}>
          <CardHeader label="Inventory Alert" title="Low Stock Items" icon={TriangleAlert} />
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2.5">
              <Package size={22} strokeWidth={1.2} style={{ color: "oklch(0.75 0.006 65)" }} />
              <p className="text-[11px] font-mono" style={{ color: "oklch(0.65 0.008 65)" }}>All stock levels healthy</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {lowStockItems.slice(0, 8).map((v) => {
                const label = [v.product.name, v.size, v.color].filter(Boolean).join(" · ");
                const isCritical = v.stock <= 3;
                const stockColor = isCritical ? "oklch(0.52 0.20 18)" : "oklch(0.60 0.14 60)";
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate mb-1" style={{ color: "oklch(0.18 0.010 65)" }}>{label}</p>
                      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 65)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.min((v.stock / 10) * 100, 100)}%`, background: stockColor }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-semibold tabular-nums shrink-0 w-8 text-right" style={{ color: stockColor }}>
                      {v.stock}
                    </span>
                  </div>
                );
              })}
              {lowStockItems.length > 8 && (
                <p className="text-[10px] font-mono pt-0.5" style={{ color: "oklch(0.60 0.008 65)" }}>
                  +{lowStockItems.length - 8} more items
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
