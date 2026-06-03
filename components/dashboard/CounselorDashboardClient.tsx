"use client";

import { useMemo } from "react";

import CounselorWelcomeHeader from "@/components/counselor/CounselorWelcomeHeader";
import CounselorAppointmentsCard from "@/components/counselor/CounselorAppointmentsCard";
import {
  CounselorDashboardNextSessionSection,
  CounselorDashboardSidebarSection,
  CounselorDashboardStatsSection,
} from "@/components/dashboard/DashboardQuerySections";
import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
} from "@/components/dashboard/DashboardRouteSkeletons";
import { useAnonymousUnreadCount } from "@/lib/query/hooks/useAnonymousUnreadCount";
import { useStudents, EMPTY_STUDENTS } from "@/lib/query/hooks/useStudents";
import { useAppointments } from "@/lib/query/hooks/useAppointments";

type CounselorDashboardClientProps = {
  counselorName: string;
  resolvedCounselorId: string;
};

export default function CounselorDashboardClient({
  counselorName,
  resolvedCounselorId,
}: CounselorDashboardClientProps) {
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { isLoading: appointmentsLoading } = useAppointments("counselor");
  const { data: unreadData, isLoading: unreadLoading } = useAnonymousUnreadCount("counselor");
  const { data: students = EMPTY_STUDENTS, isLoading: studentsLoading } = useStudents();

  const statsLoading = appointmentsLoading || unreadLoading;
  const sessionLoading = appointmentsLoading || studentsLoading;

  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-4 p-3 md:p-4">
      <CounselorWelcomeHeader name={counselorName} />

      {statsLoading ? (
        <DashboardStatsRowSkeleton compact />
      ) : (
        <CounselorDashboardStatsSection
          todayIso={todayIso}
          unreadMessages={unreadData?.count ?? 0}
          resolvedCounselorId={resolvedCounselorId}
        />
      )}

      {sessionLoading ? (
        <DashboardHeroCardSkeleton />
      ) : (
        <CounselorDashboardNextSessionSection
          todayIso={todayIso}
          students={students}
        />
      )}

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        {sessionLoading ? (
          <DashboardAppointmentsPanelSkeleton />
        ) : (
          <div className="flex flex-col gap-6">
            <CounselorAppointmentsCard
              todayIso={todayIso}
              students={students}
            />
          </div>
        )}

        {appointmentsLoading ? (
          <DashboardSidebarSkeleton showBanner />
        ) : (
          <CounselorDashboardSidebarSection todayIso={todayIso} />
        )}
      </section>
    </main>
  );
}
