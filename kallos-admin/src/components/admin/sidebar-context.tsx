"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextValue {
  expanded: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  expanded: false,
  toggle: () => {},
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kallos-sidebar-expanded");
    if (stored !== null) setExpanded(stored === "true");
  }, []);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("kallos-sidebar-expanded", String(next));
      return next;
    });
  }

  return (
    <SidebarContext.Provider
      value={{
        expanded,
        toggle,
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
