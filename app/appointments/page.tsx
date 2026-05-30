import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getAppointmentsByUserCached, getCounselorsCached, getStudentsCached } from "@/lib/cache/appointments-cache";
import { makeQueryClient } from "@/lib/query/client";
import { appointmentsQueryOptions } from "@/lib/query/queries";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";
import AppointmentsPageClient from "@/components/appointments/AppointmentsPageClient";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.role === "counselor") {
    return <CounselorAppointmentsView counselorId={sessionUser.userId} />;
  }

  await requireStudentProfile(sessionUser.userId);

  return <StudentAppointmentsView studentId={sessionUser.userId} />;
}

async function StudentAppointmentsView({ studentId }: { studentId: string }) {
  const [appointments, counselors] = await Promise.all([
    getAppointmentsByUserCached("student", studentId),
    getCounselorsCached(),
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
    getStudentsCached(),
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
