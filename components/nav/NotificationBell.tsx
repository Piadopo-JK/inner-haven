"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { NotificationDTO, SessionRole } from "@/lib/booking/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { debouncedInvalidate } from "@/lib/query/debounce-invalidate";

interface NotificationBellProps {
  role: SessionRole;
  userId: string;
  resolvedUserId?: string;
  notifications: NotificationDTO[];
}

export default function NotificationBell({
  role,
  userId,
  resolvedUserId,
  notifications,
}: NotificationBellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificationsQueryKey = useMemo(
    () => ["notifications", role, userId] as const,
    [role, userId],
  );

  const { data: allNotifications = notifications } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ role, user_id: userId });
      const response = await fetch(`/api/notifications?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }

      return (await response.json()) as NotificationDTO[];
    },
    initialData: notifications,
    staleTime: 30_000,
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${role}-${userId}-${crypto.randomUUID().slice(0, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const row = ((payload.new ?? payload.old) as {
            recipient_id?: string;
            recipient_role?: SessionRole;
          }) ?? {};

          const matchId = resolvedUserId ?? userId;
          if (row.recipient_id !== matchId || row.recipient_role !== role) {
            return;
          }

          void debouncedInvalidate(queryClient, { queryKey: notificationsQueryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [notificationsQueryKey, queryClient, role, userId]);

  const recentNotifications = allNotifications.slice(0, 5);
  const liveUnreadCount = allNotifications.reduce(
    (count, notification) => count + (notification.read ? 0 : 1),
    0,
  );
  const badgeCount = liveUnreadCount;

  async function handleOpenChange(open: boolean) {
    if (!open || liveUnreadCount === 0) {
      return;
    }

    const previous = allNotifications;
    queryClient.setQueryData<NotificationDTO[]>(
      notificationsQueryKey,
      (current) => (current ?? []).map((notification) => ({ ...notification, read: true })),
    );

    try {
      await markAllNotificationsReadAction(role, userId);
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    } catch {
      queryClient.setQueryData(notificationsQueryKey, previous);
    }
  }

  return (
    <DropdownMenu modal={false} onOpenChange={(open) => void handleOpenChange(open)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0 overflow-visible">
          <Bell className="h-5 w-5" />
          {badgeCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-none"
              style={{
                background: "var(--md-sys-color-error)",
                color: "var(--md-sys-color-on-error)",
              }}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
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
