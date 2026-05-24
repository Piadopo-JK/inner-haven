import { NextResponse } from "next/server";

import { listCounselorThreads } from "@/lib/anonymous/repository";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "counselor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await listCounselorThreads(sessionUser.userId);
  return NextResponse.json({ threads });
}
