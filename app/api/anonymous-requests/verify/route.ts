import { NextRequest, NextResponse } from "next/server";

import { verifyIdentityByOwner } from "@/lib/anonymous/repository";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (sessionUser.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const verified = await verifyIdentityByOwner(sessionUser.userId);
  if (!verified) {
    return NextResponse.json({ error: "No active pseudonymous identity." }, { status: 404 });
  }

  return NextResponse.json(verified);
}
