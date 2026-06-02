"use client";

import { useMemo } from "react";

import StudentWelcomeHeader from "@/components/dashboard/StudentWelcomeHeader";
import StudentAppointmentsCard from "@/components/dashboard/StudentAppointmentsCard";
import {
  StudentDashboardNextSessionSection,
  StudentDashboardSidebarSection,
  StudentDashboardStatsSection,
} from "@/components/dashboard/DashboardQuerySections";
import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
} from "@/components/dashboard/DashboardRouteSkeletons";
import BookingFAB from "@/components/dashboard/BookingFAB";
import { useUnreadCount } from "@/lib/query/hooks/useUnreadCount";
import { useCounselors, EMPTY_COUNSELORS } from "@/lib/query/hooks/useCounselors";
import { useAppointments } from "@/lib/query/hooks/useAppointments";

type StudentDashboardClientProps = {
  studentId: string;
  userName: string;
  resolvedUserId?: string;
};

export default function StudentDashboardClient({
  studentId,
  userName,
  resolvedUserId,
}: StudentDashboardClientProps) {
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { isLoading: appointmentsLoading } = useAppointments("student");
  const { data: unreadData, isLoading: unreadLoading } = useUnreadCount("student");
  const { data: counselors = EMPTY_COUNSELORS, isLoading: counselorsLoading } = useCounselors();

  const statsLoading = appointmentsLoading || unreadLoading;
  const sessionLoading = appointmentsLoading || counselorsLoading;

  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-4 p-3 md:p-4">
      <StudentWelcomeHeader name={userName} />

      {statsLoading ? (
        <DashboardStatsRowSkeleton compact />
      ) : (
        <StudentDashboardStatsSection
          userId={studentId}
          resolvedUserId={resolvedUserId}
          todayIso={todayIso}
          unreadMessages={unreadData?.count ?? 0}
        />
      )}

      {sessionLoading ? (
        <DashboardHeroCardSkeleton />
      ) : (
        <StudentDashboardNextSessionSection
          todayIso={todayIso}
          counselors={counselors}
        />
      )}

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        {sessionLoading ? (
          <DashboardAppointmentsPanelSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            <StudentAppointmentsCard
              todayIso={todayIso}
              counselors={counselors}
            />
          </div>
        )}

        {sessionLoading ? (
          <DashboardSidebarSkeleton showList />
        ) : (
          <StudentDashboardSidebarSection counselors={counselors} />
        )}
      </section>

      <BookingFAB />
    </main>
  );
}
