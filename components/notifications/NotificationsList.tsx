"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

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
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 5,
  });

  useEffect(() => {
    if (!role || !userId) return;
    if (!notifications.some((notification) => !notification.read)) return;

    void markAllNotificationsReadAction(role, userId);
  }, [notifications, role, userId]);

  if (notifications.length === 0) {
    return (
      <p
        className="py-12 text-center text-sm"
        style={{ color: "var(--md-sys-color-on-surface-variant)" }}
      >
        No notifications yet
      </p>
    );
  }

  return (
    <div ref={parentRef} className="max-h-[calc(100dvh-10rem)] overflow-y-auto">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const notification = notifications[virtualRow.index];
          return (
            <div
              key={notification.notification_id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <NotificationCard notification={notification} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
