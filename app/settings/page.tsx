import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import SettingsSidebar from "@/components/settings/SettingsSidebar";
import CounselorScheduleSettingsCard from "@/components/settings/CounselorScheduleSettingsCard";
import GoogleTokenSettingsCard from "@/components/settings/GoogleTokenSettingsCard";
import ProfileAppearanceSettingsCard from "@/components/settings/ProfileAppearanceSettingsCard";
import {
  SettingsIntegrationCardSkeleton,
  SettingsProfileCardSkeleton,
  SettingsScheduleCardSkeleton,
} from "@/components/settings/SettingsRouteSkeletons";
import { makeQueryClient } from "@/lib/query/client";
import {
  googleIntegrationQueryOptions,
  profileQueryOptions,
  scheduleQueryOptions,
} from "@/lib/query/queries";
import {
  loadCounselorScheduleForUser,
  loadGoogleIntegrationStatus,
  loadProfileSettings,
} from "@/lib/settings/server";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";

export const dynamic = "force-dynamic";

function SettingsSectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.role === "student") {
    await requireStudentProfile(sessionUser.userId);
  }

  const params = await searchParams;
  const activeCategory = (params.category || "profile") as "profile" | "schedule" | "integrations";
  const showProfile = activeCategory === "profile" || !["schedule", "integrations"].includes(activeCategory);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 bg-[var(--md-sys-color-background)] px-4 py-6 md:flex-row">
      <SettingsSidebar userRole={sessionUser.role} />

      <section className="flex-1 space-y-4">
        {showProfile ? (
          <>
            <SettingsSectionIntro
              title="Profile & Appearance"
              description="Manage your profile information and how you appear to others."
            />
            <Suspense fallback={<SettingsProfileCardSkeleton />}>
              <ProfileSettingsSection sessionUser={sessionUser} />
            </Suspense>
          </>
        ) : null}

        {activeCategory === "schedule" && sessionUser.role === "counselor" ? (
          <>
            <SettingsSectionIntro
              title="Booking Schedule"
              description="Set your availability and configure booking time slots."
            />
            <Suspense fallback={<SettingsScheduleCardSkeleton />}>
              <CounselorScheduleSection authUserId={sessionUser.userId} />
            </Suspense>
          </>
        ) : null}

        {activeCategory === "integrations" && sessionUser.role === "counselor" ? (
          <>
            <SettingsSectionIntro
              title="Integrations"
              description="Connect third-party services to enhance your experience."
            />
            <Suspense fallback={<SettingsIntegrationCardSkeleton />}>
              <GoogleIntegrationSection counselorId={sessionUser.userId} />
            </Suspense>
          </>
        ) : null}
      </section>
    </main>
  );
}

async function ProfileSettingsSection({
  sessionUser,
}: {
  sessionUser: { userId: string; role: "student" | "counselor" };
}) {
  const queryClient = makeQueryClient();
  const profile = await loadProfileSettings(sessionUser);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-6 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Profile data is not available yet. Please complete onboarding first.
      </div>
    );
  }

  queryClient.setQueryData(profileQueryOptions().queryKey, profile);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileAppearanceSettingsCard />
    </HydrationBoundary>
  );
}

async function CounselorScheduleSection({ authUserId }: { authUserId: string }) {
  const queryClient = makeQueryClient();
  const schedule = await loadCounselorScheduleForUser(authUserId);

  queryClient.setQueryData(scheduleQueryOptions().queryKey, schedule);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CounselorScheduleSettingsCard />
    </HydrationBoundary>
  );
}

async function GoogleIntegrationSection({ counselorId }: { counselorId: string }) {
  const queryClient = makeQueryClient();
  const googleIntegration = await loadGoogleIntegrationStatus(counselorId);

  queryClient.setQueryData(
    googleIntegrationQueryOptions().queryKey,
    googleIntegration,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GoogleTokenSettingsCard />
    </HydrationBoundary>
  );
}
