import { NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await bookingService.countUnreadNotifications(
    sessionUser.role,
    sessionUser.userId,
  );

  return NextResponse.json({ count });
}
