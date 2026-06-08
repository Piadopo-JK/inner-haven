"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthGuard } from "@/lib/query/hooks/useAuthGuard";
import { PulseBlock } from "@/components/dashboard/DashboardRouteSkeletons";
import CounselorsContent from "@/components/counselor/CounselorsContent";

function CounselorsSkeleton() {
  return (
    <main
      className="min-h-screen w-full px-4 py-8"
      style={{ background: "var(--md-sys-color-background)" }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section
          className="rounded-[20px] px-8 py-10 space-y-3"
          style={{
            background: "var(--md-sys-color-surface-container-low)",
            boxShadow: "var(--md-sys-elevation-level2)",
          }}
        >
          <PulseBlock className="h-10 w-64" />
          <PulseBlock className="h-4 w-full max-w-xl" />
          <PulseBlock className="h-4 w-3/4 max-w-md" />
        </section>

        <div
          className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-3"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-low)",
          }}
        >
          <PulseBlock className="h-5 w-5 rounded-full" />
          <PulseBlock className="h-5 w-40" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-[20px] p-6"
              style={{
                background: "var(--md-sys-color-surface)",
                border: "1px solid var(--md-sys-color-outline-variant)",
                boxShadow: "var(--md-sys-elevation-level1)",
              }}
            >
              <div className="flex items-center gap-4">
                <PulseBlock className="h-14 w-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <PulseBlock className="h-5 w-32" />
                  <PulseBlock className="h-4 w-24" />
                </div>
              </div>
              <PulseBlock className="h-4 w-full" />
              <PulseBlock className="h-4 w-3/4" />
              <div className="flex gap-2 mt-2">
                <PulseBlock className="h-9 w-24 rounded-xl" />
                <PulseBlock className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function CounselorsShell() {
  const router = useRouter();
  const guard = useAuthGuard();

  useEffect(() => {
    if (guard.status === "authenticated" && guard.me.role !== "student") {
      router.replace("/dashboard");
    }
  }, [guard, router]);

  if (guard.status === "loading" || guard.status === "unauthenticated") {
    return <CounselorsSkeleton />;
  }

  if (guard.status === "onboarding") return null;

  // Student-only page — redirect handled by useEffect above
  if (guard.me.role !== "student") return null;

  return <CounselorsContent />;
}
