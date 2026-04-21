"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import { FormField, inputCls, inputErrCls } from "@/components/admin/form-field";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/sidebar";
import {
  ArrowLeft,
  User,
  ShoppingBag,
  MapPin,
  Wallet,
  Loader2,
  Plus,
  Minus,
  Check,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  walletBalance: number;
  addresses: Address[];
}

interface OrderRow {
  id: string;
  orderNumber: string;
  orderStatus: string;
  total: number;
  totalAmount: number;
  createdAt: string;
  items: { quantity: number }[];
}

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
      <span
        className="text-[11px] font-mono tracking-[0.18em] uppercase font-semibold"
        style={{ color: "oklch(0.38 0.008 65)" }}
      >
        {title}
      </span>
    </div>
  );
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  PENDING_PAYMENT: { color: "oklch(0.50 0.14 85)", bg: "oklch(0.96 0.06 85 / 0.25)", border: "oklch(0.78 0.10 85 / 0.35)" },
  CONFIRMED:       { color: "oklch(0.35 0.12 240)", bg: "oklch(0.93 0.06 240 / 0.20)", border: "oklch(0.72 0.10 240 / 0.35)" },
  PROCESSING:      { color: "oklch(0.48 0.14 270)", bg: "oklch(0.93 0.06 270 / 0.20)", border: "oklch(0.72 0.10 270 / 0.35)" },
  SHIPPED:         { color: "oklch(0.38 0.10 220)", bg: "oklch(0.93 0.06 220 / 0.20)", border: "oklch(0.72 0.10 220 / 0.35)" },
  DELIVERED:       { color: "oklch(0.38 0.10 155)", bg: "oklch(0.93 0.06 155 / 0.20)", border: "oklch(0.72 0.10 155 / 0.35)" },
  CANCELLED:       { color: "oklch(0.48 0.18 18)", bg: "oklch(0.55 0.20 18 / 0.08)", border: "oklch(0.65 0.15 18 / 0.35)" },
  RETURNED:        { color: "oklch(0.52 0.008 65)", bg: "oklch(0.96 0.004 65)", border: "oklch(0.88 0.006 65)" },
};

// ─── Profile Card ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()
    .or(z.literal("")),
});
type ProfileForm = z.infer<typeof profileSchema>;

function ProfileCard({ user, onUpdated }: { user: UserDetail; onUpdated: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch(`/users/${user.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", user.id] });
      onUpdated();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader icon={User} title="Profile" />
      <div className="p-5 flex flex-col gap-4">
        {/* Read-only info */}
        <div
          className="rounded-xl px-4 py-3.5 grid grid-cols-1 gap-3"
          style={{ background: "oklch(0.975 0.004 65)", border: "1px solid oklch(0.91 0.006 65)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-mono tracking-[0.14em] uppercase mb-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>
                Email
              </p>
              <p className="text-[12px] font-mono truncate" style={{ color: "oklch(0.25 0.010 65)" }}>
                {user.email}
              </p>
            </div>
            <span
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono border"
              style={
                user.isEmailVerified
                  ? { color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.20)", borderColor: "oklch(0.72 0.10 155 / 0.40)" }
                  : { color: "oklch(0.52 0.14 85)", background: "oklch(0.96 0.06 85 / 0.25)", borderColor: "oklch(0.78 0.10 85 / 0.35)" }
              }
            >
              {user.isEmailVerified && <Check size={9} />}
              {user.isEmailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
          <div
            className="grid grid-cols-2 gap-3 pt-3"
            style={{ borderTop: "1px solid oklch(0.91 0.006 65)" }}
          >
            <div>
              <p className="text-[10px] font-mono tracking-[0.14em] uppercase mb-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>
                Joined
              </p>
              <p className="text-[12px] font-mono" style={{ color: "oklch(0.35 0.008 65)" }}>
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-[0.14em] uppercase mb-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>
                Last Login
              </p>
              <p className="text-[12px] font-mono" style={{ color: "oklch(0.35 0.008 65)" }}>
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
              </p>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name" error={errors.firstName?.message} required>
              <input
                {...register("firstName")}
                className={cn(inputCls, errors.firstName && inputErrCls)}
                placeholder="First name"
              />
            </FormField>
            <FormField label="Last Name" error={errors.lastName?.message} required>
              <input
                {...register("lastName")}
                className={cn(inputCls, errors.lastName && inputErrCls)}
                placeholder="Last name"
              />
            </FormField>
          </div>
          <FormField label="Phone" error={errors.phone?.message}>
            <input
              {...register("phone")}
              className={cn(inputCls, errors.phone && inputErrCls)}
              placeholder="10-digit mobile number"
            />
          </FormField>
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="self-start h-9 px-5 rounded-full text-[11px] font-mono tracking-[0.18em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "oklch(0.50 0.18 18)", color: "oklch(0.97 0 0)" }}
          >
            {mutation.isPending && <Loader2 size={12} className="animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>
    </Card>
  );
}

// ─── Wallet Card ──────────────────────────────────────────────────────────────

const walletSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive("Must be a positive amount"),
  reason: z.string().min(3, "Please provide a reason"),
});
type WalletFormValues = z.infer<typeof walletSchema>;

function WalletCard({ user, onAdjusted }: { user: UserDetail; onAdjusted: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: { type: "credit", amount: undefined as any, reason: "" },
  });

  const type = watch("type");

  const mutation = useMutation({
    mutationFn: (values: WalletFormValues) => {
      const amount = values.type === "debit" ? -values.amount : values.amount;
      return api.post("/wallet/admin/adjust", { userId: user.id, amount, reason: values.reason });
    },
    onSuccess: (_, values) => {
      toast.success(
        `${values.type === "credit" ? "Credited" : "Debited"} ${formatINR(values.amount)} ${values.type === "credit" ? "to" : "from"} wallet`
      );
      reset({ type: "credit", amount: undefined as any, reason: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", user.id] });
      onAdjusted();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader icon={Wallet} title="Wallet" />
      <div className="p-5 flex flex-col gap-4">
        {/* Balance */}
        <div
          className="rounded-xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: "oklch(0.975 0.004 65)", border: "1px solid oklch(0.91 0.006 65)" }}
        >
          <div
            className="size-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.93 0.008 65)" }}
          >
            <Wallet size={16} style={{ color: "oklch(0.42 0.008 65)" }} />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-[0.14em] uppercase" style={{ color: "oklch(0.58 0.006 65)" }}>
              Current Balance
            </p>
            <p className="text-[20px] font-mono font-semibold leading-tight" style={{ color: "oklch(0.20 0.010 65)" }}>
              {formatINR(user.walletBalance)}
            </p>
          </div>
        </div>

        {/* Adjust form */}
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2">
            {(["credit", "debit"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t)}
                className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-mono tracking-[0.12em] uppercase transition-all"
                style={
                  type === t
                    ? t === "credit"
                      ? { color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.30)", border: "1px solid oklch(0.72 0.10 155 / 0.50)" }
                      : { color: "oklch(0.48 0.18 18)", background: "oklch(0.55 0.20 18 / 0.08)", border: "1px solid oklch(0.65 0.15 18 / 0.45)" }
                    : { color: "oklch(0.52 0.006 65)", background: "oklch(0.97 0.003 65)", border: "1px solid oklch(0.88 0.006 65)" }
                }
              >
                {t === "credit" ? <Plus size={11} /> : <Minus size={11} />}
                {t === "credit" ? "Credit" : "Debit"}
              </button>
            ))}
          </div>
          <FormField label="Amount (₹)" error={errors.amount?.message} required>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className={cn(inputCls, errors.amount && inputErrCls)}
            />
          </FormField>
          <FormField label="Reason" error={errors.reason?.message} required>
            <input
              {...register("reason")}
              placeholder="e.g. Refund for return, Loyalty bonus"
              className={cn(inputCls, errors.reason && inputErrCls)}
            />
          </FormField>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="self-start h-9 px-5 rounded-full text-[11px] font-mono tracking-[0.18em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
            style={
              type === "credit"
                ? { background: "oklch(0.48 0.12 155)", color: "oklch(0.97 0 0)" }
                : { background: "oklch(0.50 0.18 18)", color: "oklch(0.97 0 0)" }
            }
          >
            {mutation.isPending && <Loader2 size={12} className="animate-spin" />}
            {type === "credit" ? "Credit Wallet" : "Debit Wallet"}
          </button>
        </form>
      </div>
    </Card>
  );
}

// ─── Addresses Card ───────────────────────────────────────────────────────────

function AddressesCard({ addresses }: { addresses: Address[] }) {
  if (addresses.length === 0) return null;

  return (
    <Card>
      <CardHeader icon={MapPin} title={`Addresses · ${addresses.length}`} />
      <div className="flex flex-wrap gap-0 p-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="rounded-xl px-4 py-3.5 min-w-[240px] flex-1"
            style={{
              background: "oklch(0.988 0.004 65)",
              border: "1px solid oklch(0.91 0.006 65)",
              maxWidth: "340px",
              margin: "4px",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-[13px] font-medium" style={{ color: "oklch(0.22 0.010 65)" }}>
                {addr.fullName}
              </p>
              {addr.isDefault && (
                <span
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono border"
                  style={{ color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.20)", borderColor: "oklch(0.72 0.10 155 / 0.35)" }}
                >
                  <CheckCircle2 size={8} />
                  Default
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono mb-1.5" style={{ color: "oklch(0.55 0.006 65)" }}>
              {addr.phone}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "oklch(0.42 0.006 65)" }}>
              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
              {addr.city}, {addr.state} — {addr.pincode}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Orders Card ──────────────────────────────────────────────────────────────

function OrdersCard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<{ data: OrderRow[]; meta: { total: number } }>({
    queryKey: ["admin-user-orders", userId],
    queryFn: () => api.get(`/orders/admin/all?userId=${userId}&limit=50`),
  });

  const orders = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Card>
      <CardHeader icon={ShoppingBag} title={isLoading ? "Orders" : `Orders · ${total}`} />

      {isLoading && (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-4 flex items-center gap-4"
              style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
            >
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3.5 w-32 rounded-full animate-pulse" style={{ background: "oklch(0.92 0.004 65)" }} />
                <div className="h-3 w-20 rounded-full animate-pulse" style={{ background: "oklch(0.93 0.004 65)" }} />
              </div>
              <div className="h-3.5 w-16 rounded-full animate-pulse" style={{ background: "oklch(0.92 0.004 65)" }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <ShoppingBag size={20} strokeWidth={1.5} style={{ color: "oklch(0.70 0.006 65)" }} />
          <p className="text-[12px] font-mono" style={{ color: "oklch(0.60 0.006 65)" }}>
            No orders yet
          </p>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.92 0.006 65)" }}>
                {["Order", "Date", "Items", "Status", "Total", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-mono tracking-[0.16em] uppercase whitespace-nowrap"
                    style={{ color: "oklch(0.50 0.008 65)", background: "oklch(0.987 0.005 65)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const sc = STATUS_COLORS[order.orderStatus] ?? STATUS_COLORS["CANCELLED"];
                const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                const amount = Number(order.total ?? order.totalAmount);
                return (
                  <tr
                    key={order.id}
                    className="group"
                    style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] font-mono font-medium" style={{ color: "oklch(0.22 0.010 65)" }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.006 65)" }}>
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                        {totalItems}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border whitespace-nowrap"
                        style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                      >
                        {order.orderStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-mono font-semibold" style={{ color: "oklch(0.22 0.010 65)" }}>
                        {formatINR(amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] font-mono"
                        style={{ color: "oklch(0.55 0.20 18)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View <ExternalLink size={10} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery<{ data: UserDetail }>({
    queryKey: ["admin-user-detail", params.id],
    queryFn: () => api.get(`/users/${params.id}`),
  });

  const user = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin" style={{ color: "oklch(0.62 0.006 65)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-[14px] font-mono" style={{ color: "oklch(0.48 0.006 65)" }}>
          User not found
        </p>
        <button
          onClick={() => router.push("/admin/users")}
          className="text-[12px] font-mono"
          style={{ color: "oklch(0.55 0.20 18)" }}
        >
          ← Back to Users
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={user.email}
        breadcrumb={["Users"]}
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

      <div className="flex flex-col gap-5">
        {/* Top row: Profile + Wallet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ProfileCard user={user} onUpdated={refetch} />
          <WalletCard user={user} onAdjusted={refetch} />
        </div>

        {/* Addresses */}
        <AddressesCard addresses={user.addresses} />

        {/* Orders — full width */}
        <OrdersCard userId={user.id} />
      </div>
    </div>
  );
}
