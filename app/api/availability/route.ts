import { NextRequest, NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";

export async function GET(request: NextRequest) {
  const counselorId = request.nextUrl.searchParams.get("counselor_id");
  const date = request.nextUrl.searchParams.get("date");

  if (!counselorId || !date) {
    return NextResponse.json(
      { error: "Missing counselor_id or date" },
      { status: 400 },
    );
  }

  const slots = await bookingService.getAvailability(counselorId, date);
  return NextResponse.json(slots);
}
