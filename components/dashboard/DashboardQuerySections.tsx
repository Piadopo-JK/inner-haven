"use client";

import { useMemo } from "react";

import GoogleConnectBanner from "@/components/counselor/GoogleConnectBanner";
import CounselorStatsRow from "@/components/counselor/CounselorStatsRow";
import CalendarCard from "@/components/dashboard/CalendarCard";
import CounselorListCard from "@/components/dashboard/CounselorListCard";
import NextSessionCard from "@/components/dashboard/NextSessionCard";
import RecentMessagesCard from "@/components/dashboard/RecentMessagesCard";
import StudentStatsRow from "@/components/dashboard/StudentStatsRow";
import type {
  AppointmentDTO,
  CounselorDirectoryItemDTO,
  StudentDirectoryItemDTO,
} from "@/lib/booking/contracts";
import {
  selectCounselorDashboardAppointments,
  selectStudentDashboardOverview,
  type CounselorDashboardAppointments,
  type StudentDashboardOverview,
  useAppointments,
  useAppointmentsRealtimeSync,
} from "@/lib/query/hooks/useAppointments";

const EMPTY_APPOINTMENTS: AppointmentDTO[] = [];

const EMPTY_COUNSELOR_DASHBOARD: CounselorDashboardAppointments = {
  approvedUpcoming: [],
  pendingApproval: [],
  pendingCount: 0,
  todayPending: 0,
  todayScheduled: 0,
  completedCount: 0,
  upcomingApprovedCount: 0,
  nextSession: undefined,
};

const EMPTY_STUDENT_DASHBOARD: StudentDashboardOverview = {
  approvedUpcoming: [],
  pendingUpcoming: [],
  upcomingCount: 0,
  completedCount: 0,
  nextSession: undefined,
};

export function CounselorDashboardStatsSection({
  todayIso,
  unreadMessages,
  resolvedCounselorId,
}: {
  todayIso: string;
  unreadMessages: number;
  resolvedCounselorId?: string;
}) {
  useAppointmentsRealtimeSync("counselor");

  const selectDashboardAppointments = useMemo(
    () => selectCounselorDashboardAppointments(todayIso),
    [todayIso],
  );
  const { data: dashboardAppointments = EMPTY_COUNSELOR_DASHBOARD } = useAppointments(
    "counselor",
    undefined,
    { select: selectDashboardAppointments },
  );

  return (
    <CounselorStatsRow
      pending={dashboardAppointments.pendingCount}
      upcomingApproved={dashboardAppointments.upcomingApprovedCount}
      completed={dashboardAppointments.completedCount}
      messages={unreadMessages}
      resolvedCounselorId={resolvedCounselorId ?? ""}
    />
  );
}

export function CounselorDashboardNextSessionSection({
  todayIso,
  students,
}: {
  todayIso: string;
  students: StudentDirectoryItemDTO[];
}) {
  const selectDashboardAppointments = useMemo(
    () => selectCounselorDashboardAppointments(todayIso),
    [todayIso],
  );
  const studentById = useMemo(
    () => Object.fromEntries(students.map((student) => [student.student_id, student])),
    [students],
  );
  const { data: dashboardAppointments = EMPTY_COUNSELOR_DASHBOARD } = useAppointments(
    "counselor",
    undefined,
    { select: selectDashboardAppointments },
  );
  const studentForNextSession = dashboardAppointments.nextSession
    ? studentById[dashboardAppointments.nextSession.student_id]
    : undefined;

  return (
    <NextSessionCard
      appointment={dashboardAppointments.nextSession}
      participantName={studentForNextSession?.name || "Student"}
      participantAvatar={studentForNextSession?.avatar_url}
      todayIso={todayIso}
      role="counselor"
    />
  );
}

export function CounselorDashboardSidebarSection({ todayIso }: { todayIso: string }) {
  const { data: appointments = EMPTY_APPOINTMENTS } = useAppointments("counselor");

  return (
    <div className="flex flex-col gap-6">
      <GoogleConnectBanner />
      <CalendarCard appointments={appointments} />
    </div>
  );
}

export function StudentDashboardStatsSection({
  userId,
  todayIso,
  unreadMessages,
}: {
  userId: string;
  todayIso: string;
  unreadMessages: number;
}) {
  useAppointmentsRealtimeSync("student");

  const selectDashboardOverview = useMemo(
    () => selectStudentDashboardOverview(todayIso),
    [todayIso],
  );
  const { data: dashboardOverview = EMPTY_STUDENT_DASHBOARD } = useAppointments(
    "student",
    undefined,
    { select: selectDashboardOverview },
  );

  return (
    <StudentStatsRow
      role="student"
      userId={userId}
      upcoming={dashboardOverview.upcomingCount}
      messages={unreadMessages}
      counselors={0}
      completed={dashboardOverview.completedCount}
    />
  );
}

export function StudentDashboardNextSessionSection({
  todayIso,
  counselors,
}: {
  todayIso: string;
  counselors: CounselorDirectoryItemDTO[];
}) {
  const selectDashboardOverview = useMemo(
    () => selectStudentDashboardOverview(todayIso),
    [todayIso],
  );
  const counselorById = useMemo(
    () => Object.fromEntries(counselors.map((counselor) => [counselor.counselor_id, counselor])),
    [counselors],
  );
  const { data: dashboardOverview = EMPTY_STUDENT_DASHBOARD } = useAppointments(
    "student",
    undefined,
    { select: selectDashboardOverview },
  );
  const counselorForNextSession = dashboardOverview.nextSession
    ? counselorById[dashboardOverview.nextSession.counselor_id]
    : undefined;

  return (
    <NextSessionCard
      appointment={dashboardOverview.nextSession}
      participantName={counselorForNextSession?.name || "Counselor"}
      participantAvatar={counselorForNextSession?.avatar_url}
      todayIso={todayIso}
      showParticipantOnlineStatus
      role="student"
    />
  );
}

export function StudentDashboardSidebarSection({
  counselors,
}: {
  counselors: CounselorDirectoryItemDTO[];
}) {
  const { data: appointments = EMPTY_APPOINTMENTS } = useAppointments("student");

  return (
    <div className="flex flex-col gap-4">
      <CalendarCard appointments={appointments} />
      <CounselorListCard counselors={counselors} />
      <RecentMessagesCard />
    </div>
  );
}