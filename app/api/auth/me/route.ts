import { NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json(null);
  }

  let studentId: string | null = null;
  let counselorId: string | null = null;
  if (sessionUser.role === "student") {
    studentId = await bookingService.resolveStudentId(sessionUser.userId);
  }
  if (sessionUser.role === "counselor") {
    counselorId = await bookingService.resolveCounselorId(sessionUser.userId);
  }

  // Resolve display name from the profile table
  let name = sessionUser.email?.split("@")[0] ?? "User";
  const supabase = createServiceClient();

  if (sessionUser.role === "counselor") {
    const { data } = await supabase
      .from("counselors")
      .select("name")
      .eq("auth_user_id", sessionUser.userId)
      .maybeSingle();
    if (data?.name) {
      name = data.name;
    }
  } else {
    const { data } = await supabase
      .from("students")
      .select("name")
      .eq("auth_user_id", sessionUser.userId)
      .maybeSingle();
    if (data?.name) {
      name = data.name;
    }
  }

  return NextResponse.json({
    role: sessionUser.role,
    userId: sessionUser.userId,
    email: sessionUser.email,
    name,
    studentId: studentId ?? null,
    counselorId: counselorId ?? null,
  });
}
