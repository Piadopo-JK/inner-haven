import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
} from "@/components/dashboard/DashboardRouteSkeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 md:p-4">
      <div className="py-3 space-y-2">
        <div className="animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] h-10 w-64" />
        <div className="animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] h-5 w-48" />
      </div>
      <DashboardStatsRowSkeleton compact />
      <DashboardHeroCardSkeleton />

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        <DashboardAppointmentsPanelSkeleton />
        <DashboardSidebarSkeleton />
      </section>
    </main>
  );
}