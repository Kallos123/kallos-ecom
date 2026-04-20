"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import {
  Store, CreditCard, Truck, RotateCcw, Package,
  Loader2, Save, TriangleAlert,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

interface SettingField {
  key: string;
  label: string;
  description: string;
  type: "text" | "email" | "number" | "toggle";
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  danger?: boolean; // red accent for destructive toggles
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  fields: SettingField[];
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "store",
    title: "Store",
    icon: Store,
    fields: [
      { key: "store_name",        label: "Store Name",      description: "Display name used across receipts and emails",           type: "text" },
      { key: "support_email",     label: "Support Email",   description: "Customer-facing support address",                        type: "email" },
      { key: "maintenance_mode",  label: "Maintenance Mode", description: "Take the storefront offline while you make changes",    type: "toggle", danger: true },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: CreditCard,
    fields: [
      { key: "razorpay_enabled",  label: "Razorpay",        description: "Accept online card / UPI / net-banking payments",        type: "toggle" },
      { key: "cod_enabled",       label: "Cash on Delivery", description: "Let customers pay cash at doorstep",                   type: "toggle" },
      { key: "wallet_enabled",    label: "Wallet Payments",  description: "Allow customers to pay using their KALLOS wallet",     type: "toggle" },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    icon: Truck,
    fields: [
      { key: "free_shipping_above", label: "Free Shipping Threshold", description: "Orders above this amount qualify for free shipping", type: "number", min: 0, prefix: "₹" },
    ],
  },
  {
    id: "orders",
    title: "Orders & Returns",
    icon: RotateCcw,
    fields: [
      { key: "return_window_days",  label: "Return Window",         description: "Days from delivery within which customers can request a return", type: "number", min: 1, max: 60, suffix: "days" },
      { key: "max_cart_quantity",   label: "Max Cart Quantity",     description: "Maximum units of a single variant a customer can add to cart",  type: "number", min: 1, max: 100 },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    fields: [
      { key: "low_stock_threshold", label: "Low Stock Threshold", description: "Variants at or below this stock level show a low-stock warning in admin", type: "number", min: 1, max: 999, suffix: "units" },
    ],
  },
];

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange, danger }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  const activeColor = danger ? "oklch(0.50 0.18 18)" : "oklch(0.48 0.14 155)";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-full transition-all duration-200 focus:outline-none"
      style={{
        width: 40, height: 22,
        background: checked ? activeColor : "oklch(0.82 0.006 65)",
      }}
    >
      <span
        className="absolute top-[3px] rounded-full transition-all duration-200"
        style={{
          width: 16, height: 16,
          left: checked ? "calc(100% - 19px)" : 3,
          background: "oklch(1 0 0)",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.20)",
        }}
      />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  settings,
  saving,
  onSave,
}: {
  section: Section;
  settings: Settings;
  saving: boolean;
  onSave: (updates: Record<string, string>) => void;
}) {
  const Icon = section.icon;

  // Local draft state — one per field
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of section.fields) init[f.key] = settings[f.key] ?? "";
    return init;
  });

  // Sync draft when settings load/change
  useEffect(() => {
    setDraft(() => {
      const init: Record<string, string> = {};
      for (const f of section.fields) init[f.key] = settings[f.key] ?? "";
      return init;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const isDirty = section.fields.some((f) => draft[f.key] !== (settings[f.key] ?? ""));

  function setValue(key: string, val: string) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "oklch(1 0 0)",
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.985 0.005 65)" }}
      >
        <Icon size={14} strokeWidth={1.6} style={{ color: "oklch(0.55 0.20 18)" }} />
        <h2 className="text-[11px] font-mono tracking-[0.16em] uppercase font-semibold" style={{ color: "oklch(0.30 0.010 65)" }}>
          {section.title}
        </h2>
      </div>

      {/* Fields */}
      <div className="divide-y" style={{ borderColor: "oklch(0.94 0.004 65)" }}>
        {section.fields.map((field) => {
          const val = draft[field.key] ?? "";
          const isBool = field.type === "toggle";

          return (
            <div key={field.key} className="flex items-center gap-4 px-5 py-4">
              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium" style={{ color: "oklch(0.18 0.010 65)" }}>
                    {field.label}
                  </p>
                  {field.danger && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: "oklch(0.55 0.20 18 / 0.08)", color: "oklch(0.48 0.18 18)" }}>
                      <TriangleAlert size={8} /> destructive
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.58 0.006 65)" }}>
                  {field.description}
                </p>
              </div>

              {/* Control */}
              {isBool ? (
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-mono" style={{ color: val === "true" ? "oklch(0.38 0.10 155)" : "oklch(0.62 0.006 65)" }}>
                    {val === "true" ? "Enabled" : "Disabled"}
                  </span>
                  <Toggle
                    checked={val === "true"}
                    danger={field.danger}
                    onChange={(v) => setValue(field.key, String(v))}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  {field.prefix && (
                    <span className="text-[13px] font-mono" style={{ color: "oklch(0.52 0.008 65)" }}>{field.prefix}</span>
                  )}
                  <input
                    type={field.type === "number" ? "number" : field.type}
                    value={val}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    className="h-9 rounded-xl px-3 text-[13px] font-mono text-right focus:outline-none transition-all"
                    style={{
                      width: field.type === "number" ? 100 : field.type === "email" ? 240 : 180,
                      background: "oklch(0.97 0.003 65)",
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
                  {field.suffix && (
                    <span className="text-[11px] font-mono" style={{ color: "oklch(0.58 0.006 65)" }}>{field.suffix}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save footer */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderTop: "1px solid oklch(0.92 0.006 65)", background: "oklch(0.988 0.003 65)" }}
      >
        <p className="text-[10px] font-mono" style={{ color: isDirty ? "oklch(0.50 0.14 65)" : "oklch(0.72 0.006 65)" }}>
          {isDirty ? "You have unsaved changes" : "All changes saved"}
        </p>
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={() => onSave(draft)}
          className="h-8 px-4 rounded-full text-[10px] font-mono tracking-[0.15em] uppercase flex items-center gap-1.5 transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }}
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: Settings }>({
    queryKey: ["admin-settings"],
    queryFn: () => api.get("/settings"),
  });

  const settings: Settings = data?.data ?? {};

  const saveMutation = useMutation({
    mutationFn: (updates: Record<string, string>) =>
      api.post("/settings/batch", updates),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setSavingSection(null),
  });

  function handleSave(sectionId: string, updates: Record<string, string>) {
    setSavingSection(sectionId);
    saveMutation.mutate(updates);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Store configuration and feature flags" />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[120, 160, 80, 120, 80].map((h, i) => (
            <div key={i} className="rounded-2xl animate-pulse"
              style={{ height: h, background: "oklch(0.94 0.004 65)" }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              settings={settings}
              saving={savingSection === section.id && saveMutation.isPending}
              onSave={(updates) => handleSave(section.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
