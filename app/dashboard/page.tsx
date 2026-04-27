import { redirect } from "next/navigation";
import { Suspense } from "react";

export const revalidate = 300; //5 minutes

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import CalendarCard from "@/components/dashboard/CalendarCard";
import TodayOverviewCard from "@/components/counselor/TodayOverviewCard";
import GoogleConnectBanner from "@/components/counselor/GoogleConnectBanner";
import CounselorAppointmentsCard from "@/components/counselor/CounselorAppointmentsCard";
import CounselorWelcomeHeader from "@/components/counselor/CounselorWelcomeHeader";
import CounselorStatsRow from "@/components/counselor/CounselorStatsRow";
import StudentWelcomeHeader from "@/components/dashboard/StudentWelcomeHeader";
import StudentStatsRow from "@/components/dashboard/StudentStatsRow";
import NextSessionCard from "@/components/dashboard/NextSessionCard";
import StudentAppointmentsCard from "@/components/dashboard/StudentAppointmentsCard";
import CounselorListCard from "@/components/dashboard/CounselorListCard";
import RecentMessagesCard from "@/components/dashboard/RecentMessagesCard";
import BookingFAB from "@/components/dashboard/BookingFAB";


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
  const [allItems, counselorGoogleToken, unreadMessages, students] = await Promise.all([
    bookingService.listAppointments({ role: "counselor", counselor_id: counselorId }),
    bookingService.getCounselorGoogleToken(counselorId),
    bookingService.countUnreadNotifications("counselor", counselorId),
    bookingService.listStudents(),
  ]);

  const isGoogleConnected = !!counselorGoogleToken;

  const pendingItems = allItems.filter((item) => item.status === "pending");
  const todayItems = allItems.filter((item) => item.appointment_date === todayIso);
  const todayPending = todayItems.filter((item) => item.status === "pending").length;
  const todayScheduled = todayItems.filter((item) => item.status === "approved").length;
  const completedCount = allItems.filter((item) => item.status === "completed").length;
  const upcomingApprovedCount = allItems.filter(
    (item) => item.status === "approved" && item.appointment_date >= todayIso,
  ).length;
  const nextSession = allItems
    .filter((item) => item.status === "approved" && item.appointment_date >= todayIso)
    .sort((a, b) => {
      const aTime = `${a.appointment_date}T${a.appointment_time}`;
      const bTime = `${b.appointment_date}T${b.appointment_time}`;
      return aTime.localeCompare(bTime);
    })[0];

  const studentForNextSession = nextSession
    ? students.find((student) => student.student_id === nextSession.student_id)
    : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-4 p-3 md:p-4">
      <CounselorWelcomeHeader name={counselorName} />

      <CounselorStatsRow
        pending={pendingItems.length}
        upcomingApproved={upcomingApprovedCount}
        completed={completedCount}
        messages={unreadMessages}
      />

      <NextSessionCard
        appointment={nextSession}
        participantName={studentForNextSession?.name || "Student"}
        participantAvatar={studentForNextSession?.avatar_url}
        todayIso={todayIso}
      />

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        <div className="flex flex-col gap-6">
          <CounselorAppointmentsCard appointments={allItems} todayIso={todayIso} students={students} />
        </div>

        <div className="flex flex-col gap-6">
          <GoogleConnectBanner isConnected={isGoogleConnected} />
          <Suspense fallback={null}>
            <CalendarCard appointments={allItems} />
          </Suspense>
          <TodayOverviewCard pending={todayPending} scheduled={todayScheduled} />
        </div>
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
  const [counselors, appointments, unreadMessages] = await Promise.all([
    bookingService.listCounselors(),
    bookingService.listAppointments({ role: "student", student_id: studentId }),
    bookingService.countUnreadNotifications("student", studentId),
  ]);

  const upcomingCount = appointments.filter((appointment) => {
    return appointment.appointment_date >= todayIso
      && (appointment.status === "approved" || appointment.status === "pending");
  }).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  
  // find the next session
  const nextSession = appointments
    .filter((appointment) => appointment.status === "approved" && appointment.appointment_date >= todayIso)
    .sort((a, b) => {
      const aTime = `${a.appointment_date}T${a.appointment_time}`;
      const bTime = `${b.appointment_date}T${b.appointment_time}`;
      return aTime.localeCompare(bTime);
    })[0];

  const counselorForNextSession = nextSession 
    ? counselors.find(c => c.counselor_id === nextSession.counselor_id)
    : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-6 p-4">
      <StudentWelcomeHeader name={userName} />

      <StudentStatsRow 
        upcoming={upcomingCount} 
        messages={unreadMessages}
        counselors={0}
        counselorIds={counselors.map((c) => c.counselor_id)}
        completed={completedCount} 
      />

      <NextSessionCard 
        appointment={nextSession} 
        participantName={counselorForNextSession?.name || "Counselor"}
        participantAvatar={counselorForNextSession?.avatar_url}
        todayIso={todayIso}
        showParticipantOnlineStatus
      />

      <section className="grid gap-4 md:grid-cols-[1fr_350px]">
        <div className="flex flex-col gap-4">
          <StudentAppointmentsCard
            appointments={appointments}
            todayIso={todayIso}
            counselors={counselors}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Suspense fallback={null}>
            <CalendarCard appointments={appointments} />
          </Suspense>
          <CounselorListCard counselors={counselors} />
          <RecentMessagesCard />
        </div>
      </section>
      <BookingFAB />
    </main>
  );
}
