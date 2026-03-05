import { redirect } from "next/navigation";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import AppointmentsList from "@/components/appointments/AppointmentsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentAppointmentsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  const appointments = await bookingService.listAppointments({
    role: "student",
    student_id: sessionUser.userId,
  });

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <Card className="md3-card">
        <CardHeader>
          <CardTitle>My Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentsList appointments={appointments} />
        </CardContent>
      </Card>
    </main>
  );
}
