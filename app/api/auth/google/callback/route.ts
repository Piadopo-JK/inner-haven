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
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=missing_params`);
  }

  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "counselor") {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // validate if state matches the session counselor
  if (state !== sessionUser.userId) {
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=state_mismatch`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=no_credentials`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  let tokens;
  try {
    ({ tokens } = await oauth2Client.getToken(code));
  } catch {
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=token_exchange`);
  }

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=no_refresh_token`);
  }

  const supabase = createServiceClient();

  // map auth_user_id to counselor_id for token storage
  const { data: counselorRow, error: lookupError } = await supabase
    .from("counselors")
    .select("counselor_id")
    .eq("auth_user_id", sessionUser.userId)
    .maybeSingle();

  if (lookupError || !counselorRow?.counselor_id) {
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
    return NextResponse.redirect(`${dashboardUrl}?google=error&reason=upsert_failed`);
  }

  return NextResponse.redirect(`${dashboardUrl}?google=connected`);
}
