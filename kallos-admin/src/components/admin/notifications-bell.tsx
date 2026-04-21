"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, ShoppingBag, Star, RotateCcw, X, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: { items: AdminNotification[]; unreadCount: number };
}

const TYPE_ICON: Record<string, React.ElementType> = {
  NEW_ORDER: ShoppingBag,
  NEW_REVIEW: Star,
  NEW_RETURN: RotateCcw,
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get("/notifications"),
    refetchInterval: 30_000,
  });

  const notifications = data?.data?.items ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleClick(n: AdminNotification) {
    if (!n.isRead) markReadMutation.mutate(n.id);
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center size-8 rounded-xl transition-all duration-150 cursor-pointer"
        style={{ color: "oklch(0.52 0.008 65)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "oklch(0.94 0.008 65)";
          e.currentTarget.style.color = "oklch(0.22 0.010 65)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "";
          e.currentTarget.style.color = "oklch(0.52 0.008 65)";
        }}
      >
        <Bell size={16} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[8px] font-mono font-bold flex items-center justify-center leading-none"
            style={{
              background: "oklch(0.55 0.20 18)",
              color: "oklch(0.97 0 0)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] overflow-hidden"
          style={{
            background: "oklch(1 0 0)",
            border: "1px solid oklch(0.89 0.007 65)",
            borderRadius: "18px",
            boxShadow: "0 8px 32px -4px oklch(0 0 0 / 0.10), 0 2px 8px -2px oklch(0 0 0 / 0.06)",
            zIndex: 50,
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid oklch(0.91 0.006 65)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-mono tracking-[0.15em] uppercase"
                style={{ color: "oklch(0.45 0.008 65)" }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.55 0.20 18 / 0.10)",
                    color: "oklch(0.50 0.20 18)",
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="flex items-center gap-1 text-[10px] font-mono transition-colors duration-150"
                style={{ color: "oklch(0.60 0.008 65)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(0.55 0.20 18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(0.60 0.008 65)";
                }}
              >
                <CheckCheck size={11} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-14 text-center">
                <div
                  className="size-10 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(0.94 0.006 65)" }}
                >
                  <Bell
                    size={18}
                    strokeWidth={1.25}
                    style={{ color: "oklch(0.72 0.008 65)" }}
                  />
                </div>
                <p
                  className="text-[12px] font-mono"
                  style={{ color: "oklch(0.62 0.008 65)" }}
                >
                  All caught up
                </p>
                <p
                  className="text-[11px] font-mono mt-0.5"
                  style={{ color: "oklch(0.72 0.006 65)" }}
                >
                  No new notifications
                </p>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const isLast = idx === notifications.length - 1;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors duration-150 group relative"
                    style={{
                      background: !n.isRead ? "oklch(0.55 0.20 18 / 0.04)" : "transparent",
                      borderBottom: isLast ? "none" : "1px solid oklch(0.93 0.005 65)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "oklch(0.97 0.006 65)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = !n.isRead
                        ? "oklch(0.55 0.20 18 / 0.04)"
                        : "transparent";
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="shrink-0 size-8 rounded-xl flex items-center justify-center mt-0.5"
                      style={{
                        background: !n.isRead
                          ? "oklch(0.55 0.20 18 / 0.09)"
                          : "oklch(0.93 0.005 65)",
                        color: !n.isRead
                          ? "oklch(0.50 0.20 18)"
                          : "oklch(0.60 0.008 65)",
                      }}
                    >
                      <Icon size={13} strokeWidth={1.75} />
                    </div>

                    {/* Content */}
                    <button
                      onClick={() => handleClick(n)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <p
                        className="text-[12.5px] leading-snug"
                        style={{
                          color: !n.isRead
                            ? "oklch(0.20 0.010 65)"
                            : "oklch(0.45 0.008 65)",
                          fontWeight: !n.isRead ? 500 : 400,
                        }}
                      >
                        {n.title}
                      </p>
                      <p
                        className="text-[11px] mt-0.5 truncate"
                        style={{ color: "oklch(0.60 0.008 65)" }}
                      >
                        {n.message}
                      </p>
                      <p
                        className="text-[10px] font-mono mt-1"
                        style={{ color: "oklch(0.70 0.006 65)" }}
                      >
                        {timeAgo(n.createdAt)}
                      </p>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(n.id);
                      }}
                      className="shrink-0 mt-0.5 size-5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                      style={{ color: "oklch(0.62 0.008 65)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "oklch(0.55 0.20 18 / 0.09)";
                        e.currentTarget.style.color = "oklch(0.50 0.20 18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "";
                        e.currentTarget.style.color = "oklch(0.62 0.008 65)";
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
