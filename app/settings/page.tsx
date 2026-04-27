import { redirect } from "next/navigation";
import { Suspense } from "react";

import SettingsSidebar from "@/components/settings/SettingsSidebar";
import CounselorScheduleSettingsCard from "@/components/settings/CounselorScheduleSettingsCard";
import GoogleTokenSettingsCard from "@/components/settings/GoogleTokenSettingsCard";
import ProfileAppearanceSettingsCard from "@/components/settings/ProfileAppearanceSettingsCard";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const dynamic = "force-dynamic";

async function GoogleTokenCardAsync({ isConnected }: { isConnected: boolean }) {
  return <GoogleTokenSettingsCard isConnected={isConnected} />;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const activeCategory = (params.category || "profile") as "profile" | "schedule" | "integrations";

  let isGoogleConnected = false;

  if (sessionUser.role === "counselor") {
    const googleToken = await bookingService.getCounselorGoogleToken(sessionUser.userId);
    isGoogleConnected = !!googleToken;
  }

  return (
    <main
      className="flex flex-col md:flex-row gap-6 mx-auto w-full max-w-5xl px-4 py-6"
      style={{ background: "var(--md-sys-color-background)" }}
    >
      <SettingsSidebar userRole={sessionUser.role} />

      <section className="flex-1 space-y-4">
        {(activeCategory === "profile" || !["schedule", "integrations"].includes(activeCategory)) && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Profile & Appearance</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your profile information and how you appear to others.
              </p>
            </div>
            <ProfileAppearanceSettingsCard />
          </>
        )}

        {activeCategory === "schedule" && sessionUser.role === "counselor" && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Booking Schedule</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Set your availability and configure booking time slots.
              </p>
            </div>
            <CounselorScheduleSettingsCard />
          </>
        )}

        {activeCategory === "integrations" && sessionUser.role === "counselor" && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Integrations</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect third-party services to enhance your experience.
              </p>
            </div>
            <Suspense fallback={<div>Loading...</div>}>
              <GoogleTokenCardAsync isConnected={isGoogleConnected} />
            </Suspense>
          </>
        )}
      </section>
    </main>
  );
}
