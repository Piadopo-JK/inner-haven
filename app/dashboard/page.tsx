import { getSessionUser } from "@/lib/supabase/get-session-user";
import { bookingService } from "@/lib/booking/service";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  let resolvedUserId: string | null = null;
  if (sessionUser) {
    resolvedUserId = sessionUser.role === "counselor"
      ? await bookingService.resolveCounselorId(sessionUser.userId)
      : await bookingService.resolveStudentId(sessionUser.userId);
  }

  return <DashboardShell resolvedUserId={resolvedUserId} />;
}
