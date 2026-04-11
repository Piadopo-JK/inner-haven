import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (sessionUser.role !== "counselor") {
    return NextResponse.json({ error: "Only counselors can update appointment status" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { status: AppointmentStatus };

  if (!body?.status) {
    return NextResponse.json({ error: "Status not found" }, { status: 400 });
  }

  // verify the appointment ownership.
  const ownAppointments = await bookingService.listAppointments({
    role: "counselor",
    counselor_id: sessionUser.userId,
  });
  const owns = ownAppointments.some((a) => a.appointment_id === id);
  if (!owns) {
    //avoid leaking whether the appointment exists at all.
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const updated = await bookingService.updateAppointmentStatus(id, body.status);
  if (!updated) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
