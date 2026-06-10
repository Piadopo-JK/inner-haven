"use client";

import { Menu } from "lucide-react";

import { useSidebar } from "@/lib/context/sidebar-context";
import { Button } from "@/components/ui/button";

export default function HamburgerMenu() {
  const { setMobileOpen } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Open sidebar"
      onClick={() => setMobileOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
