import { NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";

export async function GET() {
  const counselors = await bookingService.listCounselors();
  return NextResponse.json(counselors);
}
