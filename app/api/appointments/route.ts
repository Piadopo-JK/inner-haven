import { NextRequest, NextResponse } from "next/server";

import { BookingRequestDTO } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") as "student" | "counselor" | null;
  const studentId = request.nextUrl.searchParams.get("student_id") ?? undefined;
  const counselorId = request.nextUrl.searchParams.get("counselor_id") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  if (!role) {
    return NextResponse.json({ error: "Missing role" }, { status: 400 });
  }

  const data = await bookingService.listAppointments({
    role,
    student_id: studentId,
    counselor_id: counselorId,
  });

  const filtered = status ? data.filter((item) => item.status === status) : data;

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BookingRequestDTO;

  if (
    !body?.student_id ||
    !body?.counselor_id ||
    !body?.appointment_date ||
    !body?.appointment_time ||
    !body?.mode
  ) {
    return NextResponse.json({ error: "Invalid booking received" }, { status: 400 });
  }

  const created = await bookingService.createAppointment(body);
  return NextResponse.json(created, { status: 201 });
}
