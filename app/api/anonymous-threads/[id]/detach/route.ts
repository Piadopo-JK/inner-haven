import { NextRequest, NextResponse } from "next/server";

import { detachThreadForStudent } from "@/lib/anonymous/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await context.params;
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await detachThreadForStudent(threadId, sessionUser.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to detach thread.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
