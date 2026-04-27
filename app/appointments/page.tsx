import { redirect } from "next/navigation";

import { bookingService } from "@/lib/booking/service";
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
    bookingService.listAppointments({ role: "student", student_id: studentId }),
    bookingService.listCounselors(),
  ]);

  const participantMap: Record<string, { name: string; avatar?: string }> = {};
  for (const c of counselors) {
    participantMap[c.counselor_id] = { name: c.name, avatar: c.avatar_url };
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
      <AppointmentsPageClient
        initialAppointments={appointments}
        role="student"
        participantMap={participantMap}
      />
    </main>
  );
}

async function CounselorAppointmentsView({ counselorId }: { counselorId: string }) {
  const [appointments, students] = await Promise.all([
    bookingService.listAppointments({ role: "counselor", counselor_id: counselorId }),
    bookingService.listStudents(),
  ]);

  const participantMap: Record<string, { name: string; avatar?: string }> = {};
  for (const s of students) {
    participantMap[s.student_id] = { name: s.name, avatar: s.avatar_url };
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
      <AppointmentsPageClient
        initialAppointments={appointments}
        role="counselor"
        participantMap={participantMap}
      />
    </main>
  );
}
