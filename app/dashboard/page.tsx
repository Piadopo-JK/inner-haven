import DashboardShell from "@/components/dashboard/DashboardShell";

type SearchParams = { booked?: string; date?: string; time?: string; mode?: string; counselor?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const confirmation =
    params.booked === "true"
      ? { date: params.date, time: params.time, mode: params.mode, counselor: params.counselor }
      : null;
  return <DashboardShell bookingConfirmation={confirmation} />;
}
