"use client";

import { createContext, useContext, useMemo, useState } from "react";

type SidebarContextValue = {
  isExpanded: boolean;
  setExpanded: (value: boolean) => void;
  isMobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setExpanded] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const value = useMemo(
    () => ({
      isExpanded,
      setExpanded,
      isMobileOpen,
      setMobileOpen,
    }),
    [isExpanded, isMobileOpen],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
