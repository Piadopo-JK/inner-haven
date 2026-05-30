"use client";

import { Calendar, Bell, CheckCircle, XCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

import { NotificationDTO, NotificationType } from "@/lib/booking/contracts";
import { Card, CardContent } from "@/components/ui/card";

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

const MEET_URL_RE = /(https:\/\/meet\.google\.com\/[^\s]+)/;

function renderMessage(message: string) {
  const match = MEET_URL_RE.exec(message);
  if (!match) return message;

  const [url] = match;
  const [before, after] = message.split(url);

  return (
    <>
      {before}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline"
        style={{ color: "var(--md-sys-color-primary)" }}
        onClick={(event) => event.stopPropagation()}
      >
        Join Meeting
      </a>
      {after}
    </>
  );
}

function getNotificationHref(notification: NotificationDTO) {
  if (notification.appointment_id) {
    return `/appointments/${notification.appointment_id}`;
  }

  if (notification.anonymous_thread_id) {
    return notification.recipient_role === "student"
      ? `/messaging?threadId=${notification.anonymous_thread_id}`
      : `/anonymous-requests?threadId=${notification.anonymous_thread_id}`;
  }

  if (notification.type === "session_notes") {
    return notification.recipient_role === "student" ? "/messaging" : "/anonymous-requests";
  }

  return "/appointments";
}

interface NotificationCardProps {
  notification: NotificationDTO;
}

export default function NotificationCard({
  notification: n,
}: NotificationCardProps) {
  const Icon = iconMap[n.type] ?? Bell;
  const href = getNotificationHref(n);
  const router = useRouter();

  return (
    <div
      className="block cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      <Card
        className="md3-card transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-primary)_6%,transparent)]"
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
              {renderMessage(n.message)}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--md-sys-color-outline)" }}
            >
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
