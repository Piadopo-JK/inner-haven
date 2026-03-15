import Link from "next/link";
import { User } from "lucide-react";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { bookingService } from "@/lib/booking/service";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/nav/NotificationBell";

export default async function Navbar() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) return null;

  const [unreadCount, recentNotifications] = await Promise.all([
    bookingService.countUnreadNotifications(sessionUser.role, sessionUser.userId),
    bookingService.listNotifications(sessionUser.role, sessionUser.userId),
  ]);

  const recent = recentNotifications.slice(0, 5);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "var(--md-sys-color-surface)",
        borderColor: "var(--md-sys-color-outline-variant)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/*  logo placeholder */}
        <Link
          href="/dashboard"
          className="text-base font-semibold"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          GuidanceHub
        </Link>

        <div className="flex items-center gap-1">
            <NotificationBell
              unreadCount={unreadCount}
              recentNotifications={recent}
            />

          {/* profile placeholder */}
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
