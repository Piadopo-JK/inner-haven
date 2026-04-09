import { NextRequest, NextResponse } from "next/server";

import { SessionRole } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = request.nextUrl.searchParams.get("role") as SessionRole | null;
  const userId = request.nextUrl.searchParams.get("user_id") ?? undefined;

  if (!role || !["student", "counselor"].includes(role)) {
    return NextResponse.json({ error: "Missing or invalid role" }, { status: 400 });
  }

  if (role !== sessionUser.role || (userId && userId !== sessionUser.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await bookingService.listNotifications(sessionUser.role, sessionUser.userId);
  return NextResponse.json(data);
}
