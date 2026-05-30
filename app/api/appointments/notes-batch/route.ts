import { NextRequest, NextResponse } from "next/server";

import { SessionNoteDTO } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

function parseIdsParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedIds = parseIdsParam(request.nextUrl.searchParams.get("ids"));
  if (requestedIds.length === 0) {
    return NextResponse.json({ notesByAppointmentId: {} });
  }

  const ownAppointments = await bookingService.listAppointments(
    sessionUser.role === "counselor"
      ? { role: "counselor", counselor_id: sessionUser.userId }
      : { role: "student", student_id: sessionUser.userId },
  );

  const ownIds = new Set(ownAppointments.map((item) => item.appointment_id));
  const scopedIds = requestedIds.filter((id) => ownIds.has(id));

  if (scopedIds.length === 0) {
    return NextResponse.json({ notesByAppointmentId: {} });
  }

  const notes = await bookingService.listSessionNotesByAppointmentIds(scopedIds);
  const notesByAppointmentId: Record<string, SessionNoteDTO> = {};
  for (const [appointmentId, note] of notes) {
    notesByAppointmentId[appointmentId] = note;
  }

  return NextResponse.json({ notesByAppointmentId });
}