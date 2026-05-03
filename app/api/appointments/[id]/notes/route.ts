import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { appointmentTag, sessionNotesTag } from "@/lib/cache/appointments-cache";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

async function resolveOwnedAppointment(appointmentId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const appointment = await bookingService.getAppointmentById(appointmentId);
  if (!appointment) {
    return { error: NextResponse.json({ error: "Appointment not found" }, { status: 404 }) };
  }

  return { sessionUser, appointment };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveOwnedAppointment(id);
  if ("error" in resolved) {
    return resolved.error;
  }

  const note = await bookingService.getSessionNote(id);
  return NextResponse.json({ note });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveOwnedAppointment(id);
  if ("error" in resolved) {
    return resolved.error;
  }

  if (resolved.sessionUser.role !== "counselor") {
    return NextResponse.json(
      { error: "Only counselors can create or edit session notes." },
      { status: 403 },
    );
  }

  const counselorId = await bookingService.resolveCounselorId(resolved.sessionUser.userId);
  if (!counselorId) {
    return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
  }

  const payload = (await request.json()) as {
    note_content?: string;
    recommendations?: string[];
    follow_up?: string;
  };

  const recommendations = Array.isArray(payload.recommendations)
    ? payload.recommendations.map((item) => item.trim()).filter(Boolean)
    : [];

  const note = await bookingService.upsertSessionNote(
    id,
    {
      note_content: payload.note_content?.trim() ?? "",
      recommendations,
      follow_up: payload.follow_up?.trim() ?? "",
    },
    counselorId,
  );

  revalidateTag(sessionNotesTag(id), "max");
  revalidateTag(appointmentTag(id), "max");

  return NextResponse.json({ note });
}
