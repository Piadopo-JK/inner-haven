import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status: AppointmentStatus };

  if (!body?.status) {
    return NextResponse.json({ error: "Status not found" }, { status: 400 });
  }

  const updated = await bookingService.updateAppointmentStatus(id, body.status);
  if (!updated) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
