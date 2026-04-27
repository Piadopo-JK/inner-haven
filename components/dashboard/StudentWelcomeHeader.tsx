"use client";

import { useMemo } from "react";

export default function StudentWelcomeHeader({ name }: { name: string }) {
  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3">
      <div>
        <h1 className="text-4xl md:text-[2.75rem] font-bold tracking-tight text-[var(--md-sys-color-on-surface)] mb-1">
          Hello, {name}.
        </h1>
        <p className="text-base md:text-lg text-[var(--md-sys-color-on-surface-variant)] font-medium italic">
          {dateStr} <span className="mx-2">—</span> <span className="opacity-70">Your path to peace today.</span>
        </p>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--md-sys-color-primary)] uppercase mb-0.5">
          Status
        </p>
        <p className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
          Serene & Balanced
        </p>
      </div>
    </div>
  );
}
