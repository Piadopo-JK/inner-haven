import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { BookingRequestDTO } from "@/lib/booking/contracts";
import { appointmentTag, appointmentsListTag } from "@/lib/cache/appointments-cache";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

// cannonical time is utc
function isPastAppointment(date: string, time: string) {
  const scheduled = new Date(`${date}T${time}:00Z`);
  return Number.isNaN(scheduled.getTime()) ? true : scheduled.getTime() < Date.now();
}

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  const data = await bookingService.listAppointments(
    sessionUser.role === "counselor"
      ? { role: "counselor", counselor_id: sessionUser.userId, status: status as never }
      : { role: "student", student_id: sessionUser.userId, status: status as never },
  );

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (sessionUser.role !== "student") {
    return NextResponse.json({ error: "Only students can create bookings" }, { status: 403 });
  }

  const body = (await request.json()) as BookingRequestDTO;

  if (
    !body?.counselor_id ||
    !body?.appointment_date ||
    !body?.appointment_time ||
    !body?.mode
  ) {
    return NextResponse.json({ error: "Invalid booking received" }, { status: 400 });
  }

  if (isPastAppointment(body.appointment_date, body.appointment_time)) {
    return NextResponse.json(
      { error: "You cannot book an appointment in the past" },
      { status: 400 },
    );
  }

  try {
    const created = await bookingService.createAppointment({
      ...body,
      student_id: sessionUser.userId,
    });

    revalidateTag(appointmentsListTag("student", sessionUser.userId), "max");
    revalidateTag(appointmentTag(created.appointment_id), "max");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const candidate = error as { code?: string; message?: string };
    const message = candidate?.message ?? "Unable to create appointment.";

    if (/timeslot is already taken/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "This timeslot was just taken. Please choose another available slot.",
          code: "BOOKING_SLOT_TAKEN",
        },
        { status: 409 },
      );
    }

    if (
      candidate?.code === "42501" &&
      typeof candidate.message === "string" &&
      candidate.message.includes("cache_invalidation_events")
    ) {
      return NextResponse.json(
        {
          error:
            "Booking is temporarily unavailable while the system updates. Please try again shortly.",
          code: "BOOKING_TEMPORARY_UNAVAILABLE",
        },
        { status: 500 },
      );
    }

    if (/could not resolve counselor|could not resolve student|counselor not found/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "We couldn't validate this booking request. Please refresh the page and try again.",
          code: "BOOKING_IDENTITY_RESOLUTION_FAILED",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "We couldn't submit your booking right now. Please try again.", code: "BOOKING_CREATE_FAILED" },
      { status: 500 },
    );
  }
}
