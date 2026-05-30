import { NextResponse } from "next/server";
import { google } from "googleapis";

import { getSessionUser } from "@/lib/supabase/get-session-user";

const SCOPES = ["https://www.googleapis.com/auth/meetings.space.created"];

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "counselor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth credentials not configured" },
      { status: 500 },
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: sessionUser.userId,
  });

  return NextResponse.redirect(url);
}
