import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cache, Suspense } from "react";

import { bookingService } from "@/lib/booking/service";
import { getAppointmentsByUserCached } from "@/lib/cache/appointments-cache";
import { makeQueryClient } from "@/lib/query/client";
import {
  appointmentsQueryOptions,
  googleIntegrationQueryOptions,
} from "@/lib/query/queries";
import { loadGoogleIntegrationStatus } from "@/lib/settings/server";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import CounselorAppointmentsCard from "@/components/counselor/CounselorAppointmentsCard";
import CounselorWelcomeHeader from "@/components/counselor/CounselorWelcomeHeader";
import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
} from "@/components/dashboard/DashboardRouteSkeletons";
import {
  CounselorDashboardNextSessionSection,
  CounselorDashboardSidebarSection,
  CounselorDashboardStatsSection,
  StudentDashboardNextSessionSection,
  StudentDashboardSidebarSection,
  StudentDashboardStatsSection,
} from "@/components/dashboard/DashboardQuerySections";
import StudentWelcomeHeader from "@/components/dashboard/StudentWelcomeHeader";
import StudentAppointmentsCard from "@/components/dashboard/StudentAppointmentsCard";
import BookingFAB from "@/components/dashboard/BookingFAB";

const getCounselorAppointments = cache(async (counselorId: string) =>
  getAppointmentsByUserCached("counselor", counselorId),
);

const getStudentAppointments = cache(async (studentId: string) =>
  getAppointmentsByUserCached("student", studentId),
);

const getStudents = cache(async () => bookingService.listStudents());

const getCounselors = cache(async () => bookingService.listCounselors());

const getCounselorUnreadMessages = cache(async (counselorId: string) =>
  bookingService.countUnreadNotifications("counselor", counselorId),
);

const getStudentUnreadMessages = cache(async (studentId: string) =>
  bookingService.countUnreadNotifications("student", studentId),
);

const getCounselorGoogleIntegration = cache(async (counselorId: string) =>
  loadGoogleIntegrationStatus(counselorId),
);

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();
  const todayIso = new Date().toISOString().split("T")[0];

  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (sessionUser.role === "counselor") {
    const counselorName = sessionUser.email?.split("@")[0] || "Counselor";
    return <CounselorView counselorId={sessionUser.userId} counselorName={counselorName} todayIso={todayIso} />;
  }

  const userName = sessionUser.email?.split("@")[0] || "Student";
  return <StudentView studentId={sessionUser.userId} userName={userName} todayIso={todayIso} />;
}

// Counselor view

async function CounselorView({
  counselorId,
  counselorName,
  todayIso,
}: {
  counselorId: string;
  counselorName: string;
  todayIso: string;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-4 p-3 md:p-4">
      <CounselorWelcomeHeader name={counselorName} />

      <Suspense fallback={<DashboardStatsRowSkeleton />}>
        <CounselorStatsSection counselorId={counselorId} todayIso={todayIso} />
      </Suspense>

      <Suspense fallback={<DashboardHeroCardSkeleton />}>
        <CounselorNextSessionSection counselorId={counselorId} todayIso={todayIso} />
      </Suspense>

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        <Suspense fallback={<DashboardAppointmentsPanelSkeleton />}>
          <CounselorAppointmentsPanel counselorId={counselorId} todayIso={todayIso} />
        </Suspense>

        <Suspense fallback={<DashboardSidebarSkeleton showBanner />}>
          <CounselorSidebarSection counselorId={counselorId} todayIso={todayIso} />
        </Suspense>
      </section>
    </main>
  );
}

// Student view

async function StudentView({
  studentId,
  userName,
  todayIso,
}: {
  studentId: string;
  userName: string;
  todayIso: string;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-4 p-3 md:p-4">
      <StudentWelcomeHeader name={userName} />

      <Suspense fallback={<DashboardStatsRowSkeleton compact />}>
        <StudentStatsSection studentId={studentId} todayIso={todayIso} />
      </Suspense>

      <Suspense fallback={<DashboardHeroCardSkeleton />}>
        <StudentNextSessionSection studentId={studentId} todayIso={todayIso} />
      </Suspense>

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        <Suspense fallback={<DashboardAppointmentsPanelSkeleton />}>
          <StudentAppointmentsPanel studentId={studentId} todayIso={todayIso} />
        </Suspense>

        <Suspense fallback={<DashboardSidebarSkeleton showList />}>
          <StudentSidebarSection studentId={studentId} />
        </Suspense>
      </section>
      <BookingFAB />
    </main>
  );
}

async function CounselorStatsSection({
  counselorId,
  todayIso,
}: {
  counselorId: string;
  todayIso: string;
}) {
  const [appointments, unreadMessages] = await Promise.all([
    getCounselorAppointments(counselorId),
    getCounselorUnreadMessages(counselorId),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("counselor").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CounselorDashboardStatsSection
        todayIso={todayIso}
        unreadMessages={unreadMessages}
      />
    </HydrationBoundary>
  );
}

async function CounselorNextSessionSection({
  counselorId,
  todayIso,
}: {
  counselorId: string;
  todayIso: string;
}) {
  const [appointments, students] = await Promise.all([
    getCounselorAppointments(counselorId),
    getStudents(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("counselor").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CounselorDashboardNextSessionSection
        todayIso={todayIso}
        students={students}
      />
    </HydrationBoundary>
  );
}

async function CounselorAppointmentsPanel({
  counselorId,
  todayIso,
}: {
  counselorId: string;
  todayIso: string;
}) {
  const [appointments, students] = await Promise.all([
    getCounselorAppointments(counselorId),
    getStudents(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("counselor").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6">
        <CounselorAppointmentsCard todayIso={todayIso} students={students} />
      </div>
    </HydrationBoundary>
  );
}

async function CounselorSidebarSection({
  counselorId,
  todayIso,
}: {
  counselorId: string;
  todayIso: string;
}) {
  const [appointments, googleIntegration] = await Promise.all([
    getCounselorAppointments(counselorId),
    getCounselorGoogleIntegration(counselorId),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("counselor").queryKey,
    appointments,
  );
  queryClient.setQueryData(
    googleIntegrationQueryOptions().queryKey,
    googleIntegration,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CounselorDashboardSidebarSection todayIso={todayIso} />
    </HydrationBoundary>
  );
}

async function StudentStatsSection({
  studentId,
  todayIso,
}: {
  studentId: string;
  todayIso: string;
}) {
  const [appointments, unreadMessages] = await Promise.all([
    getStudentAppointments(studentId),
    getStudentUnreadMessages(studentId),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("student").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentDashboardStatsSection
        userId={studentId}
        todayIso={todayIso}
        unreadMessages={unreadMessages}
      />
    </HydrationBoundary>
  );
}

async function StudentNextSessionSection({
  studentId,
  todayIso,
}: {
  studentId: string;
  todayIso: string;
}) {
  const [appointments, counselors] = await Promise.all([
    getStudentAppointments(studentId),
    getCounselors(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("student").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentDashboardNextSessionSection
        todayIso={todayIso}
        counselors={counselors}
      />
    </HydrationBoundary>
  );
}

async function StudentAppointmentsPanel({
  studentId,
  todayIso,
}: {
  studentId: string;
  todayIso: string;
}) {
  const [appointments, counselors] = await Promise.all([
    getStudentAppointments(studentId),
    getCounselors(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("student").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-4">
        <StudentAppointmentsCard todayIso={todayIso} counselors={counselors} />
      </div>
    </HydrationBoundary>
  );
}

async function StudentSidebarSection({ studentId }: { studentId: string }) {
  const [appointments, counselors] = await Promise.all([
    getStudentAppointments(studentId),
    getCounselors(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentsQueryOptions("student").queryKey,
    appointments,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentDashboardSidebarSection counselors={counselors} />
    </HydrationBoundary>
  );
}
