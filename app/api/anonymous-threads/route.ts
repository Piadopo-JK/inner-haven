import { NextRequest, NextResponse } from "next/server";

import { createThreadWithFirstMessage } from "@/lib/anonymous/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (sessionUser.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json()) as {
    counselorId?: string;
    message?: string;
  };

  const { counselorId, message } = payload;
  if (!counselorId) {
    return NextResponse.json({ error: "counselorId is required." }, { status: 400 });
  }

  const trimmedMessage = message?.trim() ?? "";
  if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) {
    return NextResponse.json(
      { error: "Message must be between 10 and 2000 characters." },
      { status: 400 },
    );
  }

  try {
    const { threadId } = await createThreadWithFirstMessage(
      sessionUser.userId,
      counselorId,
      trimmedMessage,
    );

    return NextResponse.json({ threadId }, { status: 201 });
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "An active thread already exists with this counselor. Detach it first to start a new one." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Unable to create thread." }, { status: 500 });
  }
}
