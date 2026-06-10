"use client";

import AppointmentsContent from "@/components/appointments/AppointmentsContent";
import { useAuthGuard } from "@/lib/query/hooks/useAuthGuard";

function AppointmentsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
      <div className="flex flex-col gap-10 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] h-10 w-52" />
          <div className="flex gap-1 p-1.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)]">
            <div className="animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] h-9 w-24" />
            <div className="animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] h-9 w-24" />
            <div className="animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] h-9 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-3xl p-5"
              style={{
                background: "var(--md-sys-color-surface)",
                border: "1px solid var(--md-sys-color-outline-variant)",
              }}
            >
              <div className="animate-pulse rounded-full bg-[var(--md-sys-color-surface-container-high)] w-12 h-12 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] h-5 w-40" />
                <div className="animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] h-4 w-28" />
              </div>
              <div className="animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] h-9 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AppointmentsShell() {
  const guard = useAuthGuard();

  if (guard.status === "loading" || guard.status === "unauthenticated") {
    return <AppointmentsSkeleton />;
  }

  if (guard.status === "onboarding") return null;

  return <AppointmentsContent role={guard.me.role} />;
}
