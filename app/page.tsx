import LandingMessage from "@/components/dashboard/LandingMessage";
import NextAppointmentCard from "@/components/dashboard/NextAppointmentCard";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import NextSessionCard from "@/components/dashboard/NextSessionCard";
import UpcomingAppointmentsCard from "@/components/dashboard/UpcomingAppointmentsCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import CalendarCard from "@/components/dashboard/CalendarCard";
import CounselorListCard from "@/components/dashboard/CounselorListCard";
import RecentMessagesCard from "@/components/dashboard/RecentMessagesCard";
import { Suspense } from "react";

export default function Home() {
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
            <CalendarCard />
          </Suspense>
          <CounselorListCard />
          <RecentMessagesCard />
        </div>
      </section>
    </main>
  );
}
