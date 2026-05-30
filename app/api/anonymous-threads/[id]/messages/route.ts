import { NextRequest, NextResponse } from "next/server";

import {
  listMessages,
  verifyCounselorThreadAccess,
  verifyStudentThreadAccessByOwner,
} from "@/lib/anonymous/repository";
import { sendCounselorMessage, sendStudentMessage } from "@/lib/anonymous/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

type MessagePayload = {
  sender?: "student" | "counselor";
  message?: string;
  action?: "list" | "send";
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await context.params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as MessagePayload;
  const action = payload.action ?? (payload.message ? "send" : "list");

  if (action === "list") {
    if (sessionUser.role === "counselor") {
      const access = await verifyCounselorThreadAccess(threadId, sessionUser.userId);
      if (!access) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const messages = await listMessages(threadId);
      return NextResponse.json({ messages });
    }

    const access = await verifyStudentThreadAccessByOwner(threadId, sessionUser.userId);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await listMessages(threadId);
    return NextResponse.json({ thread: access.thread, messages });
  }

  if (!payload.message || payload.message.trim().length < 1 || payload.message.length > 2000) {
    return NextResponse.json({ error: "Message length must be between 1 and 2000 characters." }, { status: 400 });
  }

  if (payload.sender === "student") {
    if (sessionUser.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await verifyStudentThreadAccessByOwner(threadId, sessionUser.userId);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await sendStudentMessage(threadId, payload.message.trim());

    return NextResponse.json({ ok: true });
  }

  if (sessionUser.role !== "counselor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await verifyCounselorThreadAccess(threadId, sessionUser.userId);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendCounselorMessage(threadId, payload.message.trim(), access.counselorId);

  return NextResponse.json({ ok: true });
}
