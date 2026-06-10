"use client";

import CounselorDashboardClient from "@/components/dashboard/CounselorDashboardClient";
import StudentDashboardClient from "@/components/dashboard/StudentDashboardClient";
import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
  PulseBlock,
} from "@/components/dashboard/DashboardRouteSkeletons";
import { useAuthGuard } from "@/lib/query/hooks/useAuthGuard";

export default function DashboardShell() {
  const guard = useAuthGuard();

  if (guard.status === "loading" || guard.status === "unauthenticated") {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 md:p-4">
        <div className="py-3 space-y-2">
          <PulseBlock className="h-10 w-64" />
          <PulseBlock className="h-5 w-48" />
        </div>
        <DashboardStatsRowSkeleton />
        <DashboardHeroCardSkeleton />
        <section className="grid gap-6 md:grid-cols-[1fr_350px]">
          <DashboardAppointmentsPanelSkeleton />
          <DashboardSidebarSkeleton />
        </section>
      </main>
    );
  }

  if (guard.status === "onboarding") return null;

  if (guard.me.role === "counselor") {
    return (
      <CounselorDashboardClient
        counselorName={guard.me.name}
        resolvedCounselorId={guard.me.userId}
      />
    );
  }

  return (
    <StudentDashboardClient
      studentId={guard.me.userId}
      userName={guard.me.name}
    />
  );
}
