"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = useCallback(() => {
    if (shaking) return;
    setShaking(true);
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setTimeout(() => setShaking(false), 420);
  }, [resolvedTheme, setTheme, shaking]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="shrink-0" disabled aria-label="Toggle theme">
        <span className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative shrink-0"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className={shaking ? "theme-btn-vibrating" : ""} style={{ display: "flex" }}>
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </span>
    </Button>
  );
}
