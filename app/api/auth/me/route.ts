import { NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json(null);
  }

  let studentId: string | null = null;
  if (sessionUser.role === "student") {
    studentId = await bookingService.resolveStudentId(sessionUser.userId);
  }

  const name = sessionUser.email?.split("@")[0] ?? "User";

  return NextResponse.json({
    role: sessionUser.role,
    userId: sessionUser.userId,
    email: sessionUser.email,
    name,
    studentId: studentId ?? null,
  });
}
