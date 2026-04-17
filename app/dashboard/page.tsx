import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createServiceClient } from "@/lib/supabase/server";
import CalendarCard from "@/components/dashboard/CalendarCard";
import CounselorSummaryCard from "@/components/counselor/CounselorSummaryCard";
import PendingRequestsCard from "@/components/counselor/PendingRequestsCard";
import TodayOverviewCard from "@/components/counselor/TodayOverviewCard";
import GoogleConnectBanner from "@/components/counselor/GoogleConnectBanner";
import LandingMessage from "@/components/dashboard/LandingMessage";
import NextAppointmentCard from "@/components/dashboard/NextAppointmentCard";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import NextSessionCard from "@/components/dashboard/NextSessionCard";
import UpcomingAppointmentsCard from "@/components/dashboard/UpcomingAppointmentsCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import CounselorListCard from "@/components/dashboard/CounselorListCard";
import RecentMessagesCard from "@/components/dashboard/RecentMessagesCard";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (sessionUser.role === "counselor") {
    return <CounselorView counselorId={sessionUser.userId} />;
  }

  return <StudentView studentId={sessionUser.userId} />;
}

// Counselor view

async function CounselorView({ counselorId }: { counselorId: string }) {
  const today = new Date().toISOString().split("T")[0];

  const supabase = createServiceClient();

  const [pendingItems, allItems, counselorRow] = await Promise.all([
    bookingService.listAppointments({ role: "counselor", counselor_id: counselorId, status: "pending" }),
    bookingService.listAppointments({ role: "counselor", counselor_id: counselorId }),
    supabase
      .from("counselors")
      .select("counselor_id, google_refresh_token")
      .eq("auth_user_id", counselorId)
      .maybeSingle()
      .then(({ data }) => data),
  ]);

  const isGoogleConnected = !!counselorRow?.google_refresh_token;

  const todayItems = allItems.filter((item) => item.appointment_date === today);
  const todayPending = todayItems.filter((item) => item.status === "pending").length;
  const todayScheduled = todayItems.filter((item) => item.status === "approved").length;

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 p-4">
      <GoogleConnectBanner isConnected={isGoogleConnected} />
      <CounselorSummaryCard />
      <section className="grid gap-4 md:grid-cols-2">
        <PendingRequestsCard items={pendingItems} />
        <div className="grid gap-4 content-start">
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

async function StudentView({ studentId }: { studentId: string }) {
  const supabase = createServiceClient();
  const { data: studentRow } = await supabase
    .from("students")
    .select("student_id")
    .eq("auth_user_id", studentId)
    .maybeSingle();

  if (!studentRow) {
    redirect("/onboarding");
  }

  const [counselors, appointments] = await Promise.all([
    bookingService.listCounselors(),
    bookingService.listAppointments({ role: "student", student_id: studentId }),
  ]);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 p-4">
      <div className="surface-band">
        <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 md:grid-cols-2">
          <LandingMessage />
          <NextAppointmentCard />
        </section>
      </div>

      <section className="dashboard-bottom-row grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          <WelcomeCard />
          <NextSessionCard />
          <UpcomingAppointmentsCard />
          <QuickActionCard />
        </div>

        <div className="grid gap-4">
          <Suspense fallback={null}>
            <CalendarCard appointments={appointments} />
          </Suspense>
          <CounselorListCard counselors={counselors} />
          <RecentMessagesCard />
        </div>
      </section>
    </main>
  );
}
