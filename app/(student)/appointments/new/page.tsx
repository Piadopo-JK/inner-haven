import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import BookingForm from "@/components/appointments/BookingForm";

export default async function NewAppointmentPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">Book Your Session</h1>
        <p className="text-lg text-[var(--md-sys-color-on-surface-variant)] opacity-70">Take the next step in your personal growth journey.</p>
      </div>

      <Suspense fallback={null}>
        <BookingForm studentId={sessionUser.userId} />
      </Suspense>
    </main>
  );
}
