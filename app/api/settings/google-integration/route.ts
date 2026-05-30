import { NextResponse } from "next/server";

import { loadGoogleIntegrationStatus } from "@/lib/settings/server";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (sessionUser.role !== "counselor") {
    return NextResponse.json(
      { error: "Only counselors can manage Google integration" },
      { status: 403 },
    );
  }

  try {
    const payload = await loadGoogleIntegrationStatus(sessionUser.userId);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load Google integration status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}