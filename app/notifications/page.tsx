import { getSessionUser } from "@/lib/supabase/get-session-user";
import { bookingService } from "@/lib/booking/service";
import { SessionRole } from "@/lib/booking/contracts";
import NotificationsList from "@/components/notifications/NotificationsList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const sessionUser = await getSessionUser();

  let role: SessionRole | undefined;
  let userId: string | undefined;

  if (sessionUser) {
    role = sessionUser.role;
    userId = sessionUser.userId;
  } 

  const notifications = role ? await bookingService.listNotifications(role, userId) : [];

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <h1
        className="mb-6 text-xl font-semibold"
        style={{ color: "var(--md-sys-color-on-surface)" }}
      >
        Notifications
      </h1>
      <NotificationsList notifications={notifications} />
    </main>
  );
}
