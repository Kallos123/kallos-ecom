"use client";

import { Suspense, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatINR } from "@/lib/format";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  walletBalance: number;
}

function UsersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

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
    ...(search ? { search } : {}),
    page: String(page),
    limit: "20",
  }).toString();

  const { data, isLoading } = useQuery<{ data: UserRow[]; meta: any }>({
    queryKey: ["admin-users", search, page],
    queryFn: () => api.get(`/users?${qs}`),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}/status`, { isActive }),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "User activated" : "User deactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const users = data?.data ?? [];
  const pagination = data?.meta;

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={pagination ? `${pagination.total} customers` : undefined}
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-full sm:w-auto">
          <Search
            size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "oklch(0.62 0.008 65)" }}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value);
            }}
            className="w-full sm:w-72 h-9 rounded-full pl-9 pr-4 text-[12px] font-mono focus:outline-none transition-all duration-150"
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
                {["Customer", "Phone", "Wallet", "Email Verified", "Last Login", "Joined", "Status", ""].map((h) => (
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
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-3 rounded-full animate-pulse"
                          style={{ background: "oklch(0.93 0.004 65)", width: j === 0 ? "60%" : "45%" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.94 0.006 65)" }}
                    >
                      <Users size={20} strokeWidth={1.5} style={{ color: "oklch(0.62 0.008 65)" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.008 65)" }}>
                      No users found
                    </p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: "oklch(0.62 0.008 65)" }}>
                      Try adjusting your search
                    </p>
                  </td>
                </tr>
              )}

              {users.map((user) => (
                <tr
                  key={user.id}
                  className="group transition-colors duration-100"
                  style={{ borderBottom: "1px solid oklch(0.94 0.004 65)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.988 0.005 65)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <p className="text-[13px] font-medium hover:underline" style={{ color: "oklch(0.18 0.010 65)" }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "oklch(0.55 0.006 65)" }}>
                      {user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                      {user.phone ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12px] font-mono" style={{ color: "oklch(0.35 0.008 65)" }}>
                      {formatINR(user.walletBalance)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border"
                      style={
                        user.isEmailVerified
                          ? { color: "oklch(0.38 0.10 155)", background: "oklch(0.93 0.06 155 / 0.25)", borderColor: "oklch(0.72 0.10 155 / 0.40)" }
                          : { color: "oklch(0.52 0.14 85)", background: "oklch(0.96 0.06 85 / 0.30)", borderColor: "oklch(0.78 0.10 85 / 0.40)" }
                      }
                    >
                      {user.isEmailVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-mono" style={{ color: "oklch(0.52 0.006 65)" }}>
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        size="sm"
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: user.id, isActive: checked })
                        }
                      />
                      <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.006 65)" }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[11px] font-mono cursor-pointer"
                      style={{ color: "oklch(0.55 0.20 18)" }}
                    >
                      View →
                    </button>
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
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
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

export default function UsersPage() {
  return (
    <Suspense>
      <UsersContent />
    </Suspense>
  );
}
