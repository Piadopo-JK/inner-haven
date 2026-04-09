import Link from "next/link";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { bookingService } from "@/lib/booking/service";
import NotificationBell from "@/components/nav/NotificationBell";
import HamburgerMenu from "@/components/nav/HamburgerMenu";
import ProfileMenu from "@/components/nav/ProfileMenu";

const navLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

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
          className="text-base font-semibold shrink-0"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          GuidanceGo
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-primary"
            >
              <span className="text-foreground">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell
            unreadCount={unreadCount}
            recentNotifications={recent}
          />

          <ProfileMenu />

          {/* mobile profile replacement */}
          <div className="md:hidden">
            <HamburgerMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
