import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import BookingForm from "@/components/appointments/BookingForm";
import { getCounselorsCached } from "@/lib/cache/appointments-cache";
import { bookingService } from "@/lib/booking/service";
import { makeQueryClient } from "@/lib/query/client";
import { counselorsQueryOptions } from "@/lib/query/queries";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";

type EditAppointmentPageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function EditAppointmentPage({ params }: EditAppointmentPageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    redirect("/login");
  }

  await requireStudentProfile(sessionUser.userId);

  const { appointmentId } = await params;
  const [appointments, counselors] = await Promise.all([
    bookingService.listAppointments({
      role: "student",
      student_id: sessionUser.userId,
    }),
    getCounselorsCached(),
  ]);
  const appointment = appointments.find((item) => item.appointment_id === appointmentId);

  if (!appointment || appointment.status !== "pending") {
    redirect(`/appointments/${appointmentId}`);
  }

  const queryClient = makeQueryClient();
  queryClient.setQueryData(counselorsQueryOptions().queryKey, counselors);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="mx-auto w-full max-w-7xl p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">Edit Appointment</h1>
          <p className="text-lg text-[var(--md-sys-color-on-surface-variant)] opacity-70">
            Update your pending appointment details before it is approved.
          </p>
        </div>

        <BookingForm initialAppointment={appointment} />
      </main>
    </HydrationBoundary>
  );
}