export const dynamic = "force-dynamic";

import AvailableCounselorsList from "@/components/counselor/AvailableCounselorsList";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export default async function CounselorsPage() {
  const [counselors, sessionUser] = await Promise.all([
    bookingService.listCounselors(),
    getSessionUser(),
  ]);
  const canBook = sessionUser?.role === "student";

  return (
    <main
      className="min-h-screen w-full px-4 py-8"
      style={{ background: "var(--md-sys-color-background)" }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section
          className="rounded-[20px] bg-white px-8 py-10 shadow-md"
          style={{ boxShadow: "var(--md-sys-elevation-level2)" }}
        >
          <h1
            className="text-4xl font-bold"
            style={{ color: "var(--md-sys-color-primary)" }}
          >
            Find Your Counselor
          </h1>
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            Browse our team of professional counselors. Choose the person who
            feels right for you and book a session at a time that works.
          </p>
        </section>

        <AvailableCounselorsList counselors={counselors} canBook={canBook} />
      </div>
    </main>
  );
}
