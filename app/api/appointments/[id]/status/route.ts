import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { AppointmentStatus } from "@/lib/booking/contracts";
import { appointmentTag, appointmentsListTag } from "@/lib/cache/appointments-cache";
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

  // Verify the counselor is assigned to this appointment
  const appointment = await bookingService.verifyAppointmentAccess(sessionUser, id);
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  try {
    const updated = await bookingService.updateAppointmentStatus(id, body.status, "counselor");
    if (!updated) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    revalidateTag(appointmentsListTag("counselor", sessionUser.userId), "max");
    revalidateTag(appointmentTag(id), "max");

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update appointment status.";

    if (message.startsWith("GOOGLE_RECONNECT_REQUIRED:")) {
      return NextResponse.json(
        {
          error: message.replace("GOOGLE_RECONNECT_REQUIRED:", ""),
          code: "GOOGLE_RECONNECT_REQUIRED",
          reconnectGoogle: true,
        },
        { status: 409 },
      );
    }

    if (message.startsWith("GOOGLE_MEET_CREATE_FAILED:")) {
      return NextResponse.json(
        {
          error: message.replace("GOOGLE_MEET_CREATE_FAILED:", ""),
          code: "GOOGLE_MEET_CREATE_FAILED",
        },
        { status: 502 },
      );
    }

    if (message.startsWith("APPOINTMENT_STATUS_UPDATE_FAILED:")) {
      return NextResponse.json(
        {
          error: message.replace("APPOINTMENT_STATUS_UPDATE_FAILED:", ""),
          code: "APPOINTMENT_STATUS_UPDATE_FAILED",
        },
        { status: 500 },
      );
    }

    if (/timeslot is already taken/i.test(message)) {
      return NextResponse.json(
        {
          error: "This timeslot is no longer available.",
          code: "BOOKING_SLOT_TAKEN",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Unable to update appointment status right now. Please try again.",
        code: "APPOINTMENT_STATUS_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}
