import { NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "counselor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await bookingService.listStudents();
  return NextResponse.json(students);
}
