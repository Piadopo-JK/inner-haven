import { NextRequest, NextResponse } from "next/server";

import { BookingRequestDTO } from "@/lib/booking/contracts";
import { updateStudentPendingAppointmentAction } from "@/app/actions/appointments";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as BookingRequestDTO;

  await updateStudentPendingAppointmentAction(id, {
    counselor_id: body.counselor_id,
    appointment_date: body.appointment_date,
    appointment_time: body.appointment_time,
    reason: body.reason,
    mode: body.mode,
  });

  return NextResponse.json({ ok: true });
}
