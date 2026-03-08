import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import BookingForm from "@/components/appointments/BookingForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewAppointmentPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <Card className="md3-card">
        <CardHeader>
          <CardTitle>Create appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <BookingForm studentId={sessionUser.userId} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
