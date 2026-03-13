"use client";

import { useRouter } from "next/navigation";

import { NotificationDTO } from "@/lib/booking/contracts";
import { markNotificationReadAction } from "@/app/actions/notifications";
import NotificationCard from "@/components/notifications/NotificationCard";

interface NotificationsListProps {
  notifications: NotificationDTO[];
}

export default function NotificationsList({
  notifications,
}: NotificationsListProps) {
  const router = useRouter();

  async function handleMarkRead(notificationId: string) {
    await markNotificationReadAction(notificationId);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <p
          className="py-12 text-center text-sm"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          No notifications yet
        </p>
      ) : (
        notifications.map((n) => (
          <NotificationCard
            key={n.notification_id}
            notification={n}
            onMarkRead={handleMarkRead}
          />
        ))
      )}
    </div>
  );
}
