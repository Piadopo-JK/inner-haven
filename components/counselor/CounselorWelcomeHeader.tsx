"use client";

import { useMemo } from "react";

export default function CounselorWelcomeHeader({ name }: { name: string }) {
  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] mb-2">
          Welcome back, {name}.
        </h1>
        <p className="text-xl text-[var(--md-sys-color-on-surface-variant)] font-medium italic">
          {dateStr} <span className="mx-2">—</span> <span className="opacity-70">Support with clarity today.</span>
        </p>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--md-sys-color-primary)] uppercase mb-1">
          Role
        </p>
        <p className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
          Counselor
        </p>
      </div>
    </div>
  );
}
