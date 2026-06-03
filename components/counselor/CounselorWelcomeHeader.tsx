"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function CounselorWelcomeHeader({ name }: { name: string }) {
  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] mb-2">
          Welcome back,{" "}
          <Link
            href="/settings?category=profile#display-name"
            className="hover:text-[var(--md-sys-color-primary)] transition-colors"
            title="Edit display name in settings"
          >
            {name}
          </Link>
          .
        </h1>
        <p className="text-xl text-[var(--md-sys-color-on-surface-variant)] font-medium italic">
          {dateStr} <span className="mx-2">—</span> <span className="opacity-85">Support with clarity today.</span>
        </p>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--md-sys-color-primary)] uppercase mb-1">
          Time
        </p>
        <p className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
          {timeStr}
        </p>
      </div>
    </div>
  );
}
