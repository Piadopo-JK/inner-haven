import { NextRequest, NextResponse } from "next/server";

import { createAnonymousIdentity } from "@/lib/anonymous/repository";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (sessionUser.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const created = await createAnonymousIdentity(sessionUser.userId);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create anonymous identity." }, { status: 500 });
  }
}
