"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm p-0 gap-0 overflow-hidden"
        style={{
          borderRadius: "1.25rem",
          background: "oklch(1 0 0)",
          boxShadow: "0 8px 32px oklch(0 0 0 / 0.12), 0 2px 8px oklch(0 0 0 / 0.06)",
          border: "1px solid oklch(0.91 0.006 65)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle
            className="text-[15px] font-semibold"
            style={{ color: "oklch(0.15 0.010 65)" }}
          >
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription
              className="text-[12px] font-mono mt-1.5"
              style={{ color: "oklch(0.55 0.006 65)" }}
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter
          className="px-6 pb-6 pt-4 flex-row justify-end gap-2"
          style={{ borderTop: "1px solid oklch(0.93 0.004 65)" }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-9 px-5 rounded-full text-[11px] font-mono tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
            style={{
              border: "1px solid oklch(0.88 0.008 65)",
              color: "oklch(0.45 0.008 65)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.70 0.008 65)";
              (e.currentTarget as HTMLElement).style.color = "oklch(0.25 0.010 65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.88 0.008 65)";
              (e.currentTarget as HTMLElement).style.color = "oklch(0.45 0.008 65)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-9 px-5 rounded-full text-[11px] font-mono tracking-[0.15em] uppercase transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{
              background: variant === "success" ? "oklch(0.48 0.14 155)" : "oklch(0.50 0.18 18)",
              color: "oklch(0.97 0 0)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                variant === "success" ? "oklch(0.43 0.14 155)" : "oklch(0.45 0.18 18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                variant === "success" ? "oklch(0.48 0.14 155)" : "oklch(0.50 0.18 18)";
            }}
          >
            {loading && <Loader2 size={11} className="animate-spin" />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
