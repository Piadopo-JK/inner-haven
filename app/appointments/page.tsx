import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { bookingService } from "@/lib/booking/service";
import { getAppointmentsByUserCached } from "@/lib/cache/appointments-cache";
import { makeQueryClient } from "@/lib/query/client";
import { appointmentsQueryOptions } from "@/lib/query/queries";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import AppointmentsPageClient from "@/components/appointments/AppointmentsPageClient";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (sessionUser.role === "counselor") {
    return <CounselorAppointmentsView counselorId={sessionUser.userId} />;
  }

  return <StudentAppointmentsView studentId={sessionUser.userId} />;
}

async function StudentAppointmentsView({ studentId }: { studentId: string }) {
  const [appointments, counselors] = await Promise.all([
    getAppointmentsByUserCached("student", studentId),
    bookingService.listCounselors(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(appointmentsQueryOptions("student").queryKey, appointments);

  const participantMap: Record<string, { name: string; avatar?: string }> = {};
  for (const c of counselors) {
    participantMap[c.counselor_id] = { name: c.name, avatar: c.avatar_url };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <AppointmentsPageClient
          role="student"
          participantMap={participantMap}
        />
      </main>
    </HydrationBoundary>
  );
}

async function CounselorAppointmentsView({ counselorId }: { counselorId: string }) {
  const [appointments, students] = await Promise.all([
    getAppointmentsByUserCached("counselor", counselorId),
    bookingService.listStudents(),
  ]);
  const queryClient = makeQueryClient();
  queryClient.setQueryData(appointmentsQueryOptions("counselor").queryKey, appointments);

  const participantMap: Record<string, { name: string; avatar?: string }> = {};
  for (const s of students) {
    participantMap[s.student_id] = { name: s.name, avatar: s.avatar_url };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <AppointmentsPageClient
          role="counselor"
          participantMap={participantMap}
        />
      </main>
    </HydrationBoundary>
  );
}
