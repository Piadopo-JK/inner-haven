"use client";

import { Calendar, Bell, CheckCircle, XCircle, Clock } from "lucide-react";

import { NotificationDTO, NotificationType } from "@/lib/booking/contracts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const iconMap: Record<NotificationType, React.ElementType> = {
  booking_pending: Clock,
  booking_approved: CheckCircle,
  booking_declined: XCircle,
  booking_rescheduled: Calendar,
  booking_request: Bell,
  session_notes: Bell,
  session_reminder_1h: Clock,
  session_reminder_1d: Calendar,
};

interface NotificationCardProps {
  notification: NotificationDTO;
  onMarkRead?: (notificationId: string) => void;
}

export default function NotificationCard({
  notification: n,
  onMarkRead,
}: NotificationCardProps) {
  const Icon = iconMap[n.type] ?? Bell;

  return (
    <Card
      className="md3-card transition-colors"
      style={{
        opacity: n.read ? 0.7 : 1,
        borderLeftWidth: 3,
        borderLeftColor: n.read
          ? "var(--md-sys-color-outline-variant)"
          : "var(--md-sys-color-primary)",
      }}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className="mt-0.5 rounded-full p-1.5"
          style={{
            background: n.read
              ? "var(--md-sys-color-surface-container)"
              : "var(--md-sys-color-primary-container)",
            color: n.read
              ? "var(--md-sys-color-on-surface-variant)"
              : "var(--md-sys-color-on-primary-container)",
          }}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 space-y-1">
          <p
            className="text-sm"
            style={{
              color: "var(--md-sys-color-on-surface)",
              fontWeight: n.read ? 400 : 500,
            }}
          >
            {n.message}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--md-sys-color-outline)" }}
          >
            {new Date(n.created_at).toLocaleString()}
          </p>
        </div>

        {!n.read && onMarkRead && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs"
            style={{ color: "var(--md-sys-color-primary)" }}
            onClick={() => onMarkRead(n.notification_id)}
          >
            Mark read
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
