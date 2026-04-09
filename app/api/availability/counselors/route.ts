import { NextRequest, NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date");
  const time = request.nextUrl.searchParams.get("time");

  if (!date || !time) {
    return NextResponse.json({ error: "Missing date or time" }, { status: 400 });
  }

  const counselors = await bookingService.getAvailableCounselors(date, time);
  return NextResponse.json(counselors);
}
