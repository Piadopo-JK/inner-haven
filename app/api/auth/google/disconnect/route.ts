import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "counselor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: counselorRow } = await supabase
    .from("counselors")
    .select("counselor_id")
    .eq("auth_user_id", sessionUser.userId)
    .maybeSingle();

  if (!counselorRow?.counselor_id) {
    return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("counselors")
    .update({ google_refresh_token: null, google_connected_at: null })
    .eq("counselor_id", counselorRow.counselor_id);

  if (error) {
    console.error("Failed to disconnect Google account", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
