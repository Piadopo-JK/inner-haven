import { getSessionUser } from "@/lib/supabase/get-session-user";
import { bookingService } from "@/lib/booking/service";
import NotificationBell from "@/components/nav/NotificationBell";
import HamburgerMenu from "@/components/nav/HamburgerMenu";
import ProfileMenu from "@/components/nav/ProfileMenu";
import CounselorHeartbeat from "@/components/layout/CounselorHeartbeat";
import { ThemeToggle } from "@/components/theme-switcher";

export default async function Navbar() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) return null;

  const notifications = await bookingService.listNotifications(
    sessionUser.role,
    sessionUser.userId,
  );

  const resolvedUserId = sessionUser.role === "counselor"
    ? await bookingService.resolveCounselorId(sessionUser.userId)
    : await bookingService.resolveStudentId(sessionUser.userId);

  return (
    <>
      {sessionUser.role === "counselor" && <CounselorHeartbeat />}
      <nav
      className="sticky top-0 z-40 w-full border-b"
      style={{
        background: "var(--md-sys-color-surface)",
        borderColor: "var(--md-sys-color-outline-variant)",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <HamburgerMenu />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <NotificationBell
            role={sessionUser.role}
            userId={sessionUser.userId}
            resolvedUserId={resolvedUserId ?? undefined}
            notifications={notifications}
          />

          <ProfileMenu />
        </div>
      </div>
      </nav>
    </>
  );
}
