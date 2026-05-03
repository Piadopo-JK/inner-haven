import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
  DashboardWelcomeHeaderSkeleton,
} from "@/components/dashboard/DashboardRouteSkeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 md:p-4">
      <DashboardWelcomeHeaderSkeleton />
      <DashboardStatsRowSkeleton />
      <DashboardHeroCardSkeleton />

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        <DashboardAppointmentsPanelSkeleton />
        <DashboardSidebarSkeleton showBanner />
      </section>
    </main>
  );
}