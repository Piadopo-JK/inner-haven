"use client";

import { useEffect } from "react";

import { NotificationDTO, SessionRole } from "@/lib/booking/contracts";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import NotificationCard from "@/components/notifications/NotificationCard";

interface NotificationsListProps {
  notifications: NotificationDTO[];
  role?: SessionRole;
  userId?: string;
}

export default function NotificationsList({
  notifications,
  role,
  userId,
}: NotificationsListProps) {
  useEffect(() => {
    if (!role || !userId) return;
    if (!notifications.some((notification) => !notification.read)) return;

    void markAllNotificationsReadAction(role, userId);
  }, [notifications, role, userId]);

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
          />
        ))
      )}
    </div>
  );
}
