import { NextRequest, NextResponse } from "next/server";

import { BookingRequestDTO } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";
import { updateStudentPendingAppointmentAction } from "@/app/actions/appointments";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const appointment = await bookingService.verifyAppointmentAccess(sessionUser, id);
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json(appointment);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const appointment = await bookingService.verifyAppointmentAccess(sessionUser, id);
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (appointment.status !== "pending") {
    return NextResponse.json(
      {
        error: "This appointment can no longer be edited because it is no longer pending.",
        code: "APPOINTMENT_NOT_EDITABLE",
      },
      { status: 409 },
    );
  }

  const body = (await request.json()) as BookingRequestDTO;

  try {
    const updated = await updateStudentPendingAppointmentAction(id, {
      counselor_id: body.counselor_id,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      reason: body.reason,
      mode: body.mode,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update appointment.";

    if (/timeslot is already taken/i.test(message)) {
      return NextResponse.json(
        {
          error: "This timeslot was just taken. Please select another slot.",
          code: "BOOKING_SLOT_TAKEN",
        },
        { status: 409 },
      );
    }

    if (/only pending appointments can be edited/i.test(message)) {
      return NextResponse.json(
        {
          error: "This appointment can no longer be edited because it is no longer pending.",
          code: "APPOINTMENT_NOT_EDITABLE",
        },
        { status: 409 },
      );
    }

    if (/unauthorized|forbidden/i.test(message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "We couldn't update your appointment right now. Please try again.",
        code: "APPOINTMENT_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}
