import { NextRequest, NextResponse } from "next/server";

import { listStudentThreads } from "@/lib/anonymous/repository";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function POST(_request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (sessionUser.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await listStudentThreads(sessionUser.userId);

  if (result.threads.length === 0) {
    return NextResponse.json({ error: "No active anonymous threads." }, { status: 404 });
  }

  return NextResponse.json(result);
}
