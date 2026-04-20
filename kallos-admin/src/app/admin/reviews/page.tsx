"use client";

import { Suspense, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { formatDate } from "@/lib/format";
import { Star, ChevronLeft, ChevronRight, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { firstName: string; lastName: string };
  product: { name: string };
}

const TABS = [
  { label: "Pending",  value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          style={
            i < rating
              ? { color: "oklch(0.75 0.14 85)", fill: "oklch(0.75 0.14 85)" }
              : { color: "oklch(0.85 0.006 65)" }
          }
        />
      ))}
    </div>
  );
}

function ReviewsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<{ ids: string[]; action: "approve" | "reject" } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const tab    = searchParams.get("tab")    ?? "PENDING";
  const page   = parseInt(searchParams.get("page") ?? "1", 10);
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

  const qs = new URLSearchParams({
    status: tab,
    page: String(page),
    limit: "15",
    ...(search ? { search } : {}),
  }).toString();

  const { data, isLoading } = useQuery<{ data: Review[]; meta: any }>({
    queryKey: ["admin-reviews", tab, page, search],
    queryFn: () => api.get(`/reviews?${qs}`),
  });

  const reviews    = data?.data ?? [];
  const pagination = data?.meta;

  // Single action mutation
  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      api.patch(`/reviews/${id}/moderate`, { status }),
    onSuccess: (_, vars) => {
      toast.success(`Review ${vars.status === "APPROVED" ? "approved" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setPendingAction(null);
      setSelected(new Set());
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  // Bulk action
  async function executeBulk(ids: string[], action: "approve" | "reject") {
    setBulkLoading(true);
    const status = action === "approve" ? "APPROVED" : "REJECTED";
    const results = await Promise.allSettled(
      ids.map((id) => api.patch(`/reviews/${id}/moderate`, { status }))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok     = results.length - failed;
    if (ok > 0) toast.success(`${ok} review${ok > 1 ? "s" : ""} ${action === "approve" ? "approved" : "rejected"}`);
    if (failed > 0) toast.error(`${failed} failed`);
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    setSelected(new Set());
    setPendingAction(null);
    setBulkLoading(false);
  }

  const allIds       = reviews.map((r) => r.id);
  const allSelected  = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setParam("tab", t.value)}
              className="h-9 px-3.5 rounded-full text-[11px] font-mono tracking-wide whitespace-nowrap transition-all cursor-pointer"
              style={
                tab === t.value
                  ? { background: "oklch(0.55 0.20 18)", color: "oklch(0.97 0 0)" }
                  : { background: "oklch(1 0 0)", border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.45 0.008 65)" }
              }
            >
              {t.label}
              {tab === t.value && pagination && (
                <span className="ml-1.5 opacity-70">{pagination.total}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <Search
            size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "oklch(0.62 0.008 65)" }}
          />
          <input
            type="text"
            placeholder="Search by customer, product, text..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value);
            }}
            className="w-full sm:w-72 h-9 rounded-full pl-9 pr-4 text-[12px] font-mono focus:outline-none transition-all"
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
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3"
          style={{ background: "oklch(0.97 0.003 65)", border: "1px solid oklch(0.90 0.006 65)" }}
        >
          <span className="text-[11px] font-mono" style={{ color: "oklch(0.45 0.006 65)" }}>
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {tab !== "APPROVED" && (
              <button
                onClick={() => setPendingAction({ ids: [...selected], action: "approve" })}
                disabled={bulkLoading}
                className="h-7 px-3 rounded-full text-[10px] font-mono font-medium transition-opacity hover:opacity-75 disabled:opacity-50"
                style={{ color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.30)", border: "1px solid oklch(0.72 0.10 155 / 0.40)" }}
              >
                Approve All
              </button>
            )}
            {tab !== "REJECTED" && (
              <button
                onClick={() => setPendingAction({ ids: [...selected], action: "reject" })}
                disabled={bulkLoading}
                className="h-7 px-3 rounded-full text-[10px] font-mono font-medium transition-opacity hover:opacity-75 disabled:opacity-50"
                style={{ color: "oklch(0.48 0.18 18)", background: "oklch(0.55 0.20 18 / 0.08)", border: "1px solid oklch(0.65 0.15 18 / 0.35)" }}
              >
                Reject All
              </button>
            )}
            <button
              onClick={() => setSelected(new Set())}
              className="text-[10px] font-mono"
              style={{ color: "oklch(0.60 0.006 65)" }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
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
                <th
                  className="px-4 py-3 w-10"
                  style={{ background: "oklch(0.985 0.005 65)" }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded cursor-pointer accent-[oklch(0.55_0.20_18)]"
                  />
                </th>
                {["Customer", "Product", "Rating", "Review", "Images", "Date", "Status", "Actions"].map((h) => (
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
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-3 rounded-full animate-pulse"
                          style={{ background: "oklch(0.93 0.004 65)", width: j === 3 ? "80%" : "50%" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && reviews.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.94 0.006 65)" }}
                    >
                      <Star size={20} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>
                      {search ? "No reviews match your search" : tab === "PENDING" ? "No reviews pending" : tab === "APPROVED" ? "No approved reviews" : "No rejected reviews"}
                    </p>
                  </td>
                </tr>
              )}

              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className="group transition-colors duration-100"
                  style={{
                    borderBottom: "1px solid oklch(0.94 0.004 65)",
                    background: selected.has(review.id) ? "oklch(0.985 0.005 65)" : undefined,
                  }}
                  onMouseEnter={(e) => { if (!selected.has(review.id)) (e.currentTarget as HTMLElement).style.background = "oklch(0.990 0.004 65)"; }}
                  onMouseLeave={(e) => { if (!selected.has(review.id)) (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.has(review.id)}
                      onChange={() => toggleOne(review.id)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-[oklch(0.55_0.20_18)]"
                    />
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-[12px] font-medium" style={{ color: "oklch(0.22 0.010 65)" }}>
                      {review.user.firstName} {review.user.lastName}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3.5 max-w-[140px]">
                    <span
                      className="text-[11px] font-mono px-2 py-0.5 rounded-full truncate block"
                      style={{ color: "oklch(0.42 0.008 65)", background: "oklch(0.95 0.004 65)" }}
                    >
                      {review.product.name}
                    </span>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StarRating rating={review.rating} />
                  </td>

                  {/* Review text */}
                  <td className="px-4 py-3.5" style={{ maxWidth: "260px" }}>
                    {review.title && (
                      <p className="text-[12px] font-medium mb-0.5 truncate" style={{ color: "oklch(0.22 0.010 65)" }}>
                        {review.title}
                      </p>
                    )}
                    {review.body && (
                      <p className="text-[11px] line-clamp-2" style={{ color: "oklch(0.55 0.006 65)" }}>
                        {review.body}
                      </p>
                    )}
                    {!review.title && !review.body && (
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.70 0.004 65)" }}>—</span>
                    )}
                  </td>

                  {/* Images */}
                  <td className="px-4 py-3.5">
                    {review.images.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {review.images.slice(0, 3).map((src, i) => (
                          <button
                            key={i}
                            onClick={() => setLightboxSrc(src)}
                            className="size-9 rounded-lg overflow-hidden shrink-0 transition-opacity hover:opacity-75"
                            style={{ border: "1px solid oklch(0.90 0.006 65)" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {review.images.length > 3 && (
                          <span className="text-[10px] font-mono ml-0.5" style={{ color: "oklch(0.60 0.006 65)" }}>
                            +{review.images.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.75 0.004 65)" }}>—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.006 65)" }}>
                      {formatDate(review.createdAt)}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border whitespace-nowrap"
                      style={
                        review.status === "APPROVED"
                          ? { color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.25)", borderColor: "oklch(0.72 0.10 155 / 0.40)" }
                          : review.status === "REJECTED"
                          ? { color: "oklch(0.48 0.18 18)", background: "oklch(0.55 0.20 18 / 0.08)", borderColor: "oklch(0.65 0.15 18 / 0.35)" }
                          : { color: "oklch(0.50 0.14 85)", background: "oklch(0.96 0.06 85 / 0.25)", borderColor: "oklch(0.78 0.10 85 / 0.35)" }
                      }
                    >
                      {review.status === "APPROVED" && <CheckCircle2 size={9} />}
                      {review.status === "REJECTED" && <XCircle size={9} />}
                      {review.status.charAt(0) + review.status.slice(1).toLowerCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {review.status !== "APPROVED" && (
                        <button
                          onClick={() => setPendingAction({ ids: [review.id], action: "approve" })}
                          disabled={moderateMutation.isPending}
                          className="h-7 px-2.5 rounded-full text-[10px] font-mono font-medium transition-opacity hover:opacity-75 whitespace-nowrap disabled:opacity-50"
                          style={{ color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.30)", border: "1px solid oklch(0.72 0.10 155 / 0.40)" }}
                        >
                          Approve
                        </button>
                      )}
                      {review.status !== "REJECTED" && (
                        <button
                          onClick={() => setPendingAction({ ids: [review.id], action: "reject" })}
                          disabled={moderateMutation.isPending}
                          className="h-7 px-2.5 rounded-full text-[10px] font-mono font-medium transition-opacity hover:opacity-75 whitespace-nowrap disabled:opacity-50"
                          style={{ color: "oklch(0.48 0.18 18)", background: "oklch(0.55 0.20 18 / 0.08)", border: "1px solid oklch(0.65 0.15 18 / 0.35)" }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
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
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.008 65)" }}>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} reviews
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setParam("page", String(page - 1))}
                disabled={!pagination.hasPrev}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setParam("page", String(page + 1))}
                disabled={!pagination.hasNext}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ border: "1px solid oklch(0.88 0.008 65)", color: "oklch(0.42 0.008 65)" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single confirm dialog */}
      <ConfirmDialog
        open={!!pendingAction && pendingAction.ids.length === 1 && pendingAction.action === "approve"}
        title="Approve this review?"
        description="The review will be published and visible to all customers."
        confirmLabel="Approve"
        variant="success"
        loading={moderateMutation.isPending}
        onConfirm={() => {
          if (pendingAction) moderateMutation.mutate({ id: pendingAction.ids[0], status: "APPROVED" });
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={!!pendingAction && pendingAction.ids.length === 1 && pendingAction.action === "reject"}
        title="Reject this review?"
        description="The review will be hidden from customers. You can approve it later."
        confirmLabel="Reject"
        loading={moderateMutation.isPending}
        onConfirm={() => {
          if (pendingAction) moderateMutation.mutate({ id: pendingAction.ids[0], status: "REJECTED" });
        }}
        onCancel={() => setPendingAction(null)}
      />

      {/* Bulk confirm dialogs */}
      <ConfirmDialog
        open={!!pendingAction && pendingAction.ids.length > 1 && pendingAction.action === "approve"}
        title={`Approve ${pendingAction?.ids.length} reviews?`}
        description="All selected reviews will be published and visible to customers."
        confirmLabel={bulkLoading ? "Approving…" : "Approve All"}
        variant="success"
        loading={bulkLoading}
        onConfirm={() => { if (pendingAction) executeBulk(pendingAction.ids, "approve"); }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={!!pendingAction && pendingAction.ids.length > 1 && pendingAction.action === "reject"}
        title={`Reject ${pendingAction?.ids.length} reviews?`}
        description="All selected reviews will be hidden from customers."
        confirmLabel={bulkLoading ? "Rejecting…" : "Reject All"}
        loading={bulkLoading}
        onConfirm={() => { if (pendingAction) executeBulk(pendingAction.ids, "reject"); }}
        onCancel={() => setPendingAction(null)}
      />

      {/* Image lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.75)" }}
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  return <Suspense><ReviewsContent /></Suspense>;
}
