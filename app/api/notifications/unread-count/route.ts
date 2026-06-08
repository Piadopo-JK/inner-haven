import { NextRequest, NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get("filter");
  let count: number;

  if (filter === "anonymous") {
    count = await bookingService.countUnreadAnonymousMessages(
      sessionUser.role,
      sessionUser.userId,
    );
  } else {
    count = await bookingService.countUnreadNotifications(
      sessionUser.role,
      sessionUser.userId,
    );
  }

  return NextResponse.json({ count });
}
