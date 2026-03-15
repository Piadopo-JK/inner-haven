"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { NotificationDTO } from "@/lib/booking/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationBellProps {
  unreadCount: number;
  recentNotifications: NotificationDTO[];
}

export default function NotificationBell({
  unreadCount,
  recentNotifications,
}: NotificationBellProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
              style={{
                background: "var(--md-sys-color-error)",
                color: "var(--md-sys-color-on-error)",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {recentNotifications.length === 0 ? (
          <div
            className="px-4 py-6 text-center text-sm"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            No notifications yet
          </div>
        ) : (
          recentNotifications.map((n) => (
            <DropdownMenuItem
              key={n.notification_id}
              className="flex flex-col items-start gap-1 px-4 py-3"
              onSelect={() => router.push("/notifications")}
            >
              <span
                className="line-clamp-2 text-sm"
                style={{
                  color: n.read
                    ? "var(--md-sys-color-on-surface-variant)"
                    : "var(--md-sys-color-on-surface)",
                  fontWeight: n.read ? 400 : 500,
                }}
              >
                {n.message}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--md-sys-color-outline)" }}
              >
                {new Date(n.created_at).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center py-2 text-sm font-medium"
          style={{ color: "var(--md-sys-color-primary)" }}
          onSelect={() => router.push("/notifications")}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
