import { NextRequest, NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") as "counselor" | null;
  const counselorId = request.nextUrl.searchParams.get("counselor_id") ?? undefined;

  if (!role) {
    return NextResponse.json({ error: "Missing role" }, { status: 400 });
  }

  const data = await bookingService.listNotifications(role, counselorId);
  return NextResponse.json(data);
}
