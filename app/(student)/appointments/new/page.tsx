import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { bookingService } from "@/lib/booking/service";
import { makeQueryClient } from "@/lib/query/client";
import { counselorsQueryOptions } from "@/lib/query/queries";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import BookingForm from "@/components/appointments/BookingForm";

export default async function NewAppointmentPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  const counselors = await bookingService.listCounselors();
  const queryClient = makeQueryClient();
  queryClient.setQueryData(counselorsQueryOptions().queryKey, counselors);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="mx-auto w-full max-w-7xl p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">Book Your Session</h1>
          <p className="text-lg text-[var(--md-sys-color-on-surface-variant)] opacity-70">Take the next step in your personal growth journey.</p>
        </div>

        <BookingForm />
      </main>
    </HydrationBoundary>
  );
}
