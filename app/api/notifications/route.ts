import { NextRequest, NextResponse } from "next/server";

import { SessionRole } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") as SessionRole | null;
  const userId = request.nextUrl.searchParams.get("user_id") ?? undefined;

  if (!role || !["student", "counselor"].includes(role)) {
    return NextResponse.json({ error: "Missing or invalid role" }, { status: 400 });
  }

  const data = await bookingService.listNotifications(role, userId);
  return NextResponse.json(data);
}
