"use client";

import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { SidebarProvider, useSidebar } from "@/components/admin/sidebar-context";
import { useEffect, useState } from "react";

function AdminShell({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const marginLeft = isMobile ? 0 : expanded ? 240 : 60;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main
        className="pt-14 min-h-screen"
        style={{
          marginLeft,
          transition: "margin-left 0.2s ease-in-out",
        }}
      >
        <div className="p-4 sm:p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminShell>{children}</AdminShell>
    </SidebarProvider>
  );
}
