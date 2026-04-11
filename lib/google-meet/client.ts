import { google } from "googleapis";

export async function createMeetSpace(counselorRefreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.",
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: counselorRefreshToken });

  const { token } = await auth.getAccessToken();

  if (!token) {
    throw new Error("Failed to obtain Google access token");
  }

  const response = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Meet API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { meetingUri?: string };

  if (!data.meetingUri) {
    throw new Error("Google Meet API returned no meetingUri");
  }

  return data.meetingUri;
}
