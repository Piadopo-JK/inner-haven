import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

import { encrypt } from "@/lib/crypto";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const dashboardUrl = `${appUrl}/dashboard`;

  if (error) {
    return NextResponse.redirect(`${dashboardUrl}?google=denied`);
  }

  if (!code || !state) {
    console.error("[google/callback] Missing code or state", { code: !!code, state: !!state });
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=missing_params`);
  }

  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "counselor") {
    console.error("[google/callback] No counselor session", { userId: sessionUser?.userId, role: sessionUser?.role });
    return NextResponse.redirect(`${appUrl}/auth/login`);
  }

  // validate if state matches the session counselor
  if (state !== sessionUser.userId) {
    console.error("[google/callback] State mismatch", { state, userId: sessionUser.userId });
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=state_mismatch`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[google/callback] Missing env vars");
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=no_credentials`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  let tokens;
  try {
    ({ tokens } = await oauth2Client.getToken(code));
  } catch (err) {
    console.error("[google/callback] Token exchange failed", err);
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=token_exchange`);
  }

  if (!tokens.refresh_token) {
    console.error("[google/callback] No refresh_token returned — user may need to revoke app access at myaccount.google.com/permissions");
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=no_refresh_token`);
  }

  const supabase = createServiceClient();

  // resolve the actual counselor_id from auth_user_id
  const { data: counselorRow, error: lookupError } = await supabase
    .from("counselors")
    .select("counselor_id")
    .eq("auth_user_id", sessionUser.userId)
    .maybeSingle();

  if (lookupError || !counselorRow?.counselor_id) {
    console.error("[google/callback] Counselor lookup failed", { userId: sessionUser.userId, lookupError });
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=counselor_not_found`);
  }

  const encryptedToken = encrypt(tokens.refresh_token);

  const { error: upsertError } = await supabase
    .from("counselors")
    .update({
      google_refresh_token: encryptedToken,
      google_connected_at: new Date().toISOString(),
    })
    .eq("counselor_id", counselorRow.counselor_id);

  if (upsertError) {
    console.error("[google/callback] Failed to save Google token", upsertError);
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=upsert_failed`);
  }

  return NextResponse.redirect(`${dashboardUrl}?google=connected`);
}
