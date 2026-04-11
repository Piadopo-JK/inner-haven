import { redirect } from "next/navigation";

import GoogleTokenSettingsCard from "@/components/settings/GoogleTokenSettingsCard";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  let isGoogleConnected = false;

  if (sessionUser.role === "counselor") {
    const supabase = createServiceClient();
    const { data: counselorRow } = await supabase
      .from("counselors")
      .select("google_refresh_token")
      .eq("auth_user_id", sessionUser.userId)
      .maybeSingle();

    isGoogleConnected = !!counselorRow?.google_refresh_token;
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-4 p-4">
      <section>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage account-level preferences and connected integrations.
        </p>
      </section>

      {sessionUser.role === "counselor" ? (
        <GoogleTokenSettingsCard isConnected={isGoogleConnected} />
      ) : (
        <section
          className="rounded-xl border p-5 text-sm text-muted-foreground"
          style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
        >
          Student account settings are not configurable yet.
        </section>
      )}
    </main>
  );
}
