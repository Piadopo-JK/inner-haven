import { NextRequest, NextResponse } from "next/server";

import { BookingRequestDTO } from "@/lib/booking/contracts";
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

  const created = await bookingService.createAppointment({
    ...body,
    student_id: sessionUser.userId,
  });
  return NextResponse.json(created, { status: 201 });
}
