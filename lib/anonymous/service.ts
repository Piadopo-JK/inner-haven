import {
  addMessage,
  getAnonymousThreadById,
  getOrCreateThread,
  resolveThreadOwnerAuthUserId,
  resolveStudentIdByAuthUserId,
} from "@/lib/anonymous/repository";
import { createServiceClient } from "@/lib/supabase/server";

async function upsertAnonymousThreadNotification(params: {
  recipientId: string;
  recipientRole: "student" | "counselor";
  threadId: string;
  message: string;
}) {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("notifications")
    .select("notification_id")
    .eq("recipient_id", params.recipientId)
    .eq("recipient_role", params.recipientRole)
    .eq("type", "session_notes")
    .eq("anonymous_thread_id", params.threadId)
    .eq("read", false)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to query existing thread notification", existingError);
    return;
  }

  if (existing?.notification_id) {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        message: params.message,
        sent_at: now,
        read: false,
      })
      .eq("notification_id", existing.notification_id);

    if (updateError) {
      console.error("Failed to update grouped thread notification", updateError);
    }
    return;
  }

  const { error: insertError } = await supabase.from("notifications").insert({
    recipient_id: params.recipientId,
    recipient_role: params.recipientRole,
    type: "session_notes",
    appointment_id: null,
    anonymous_thread_id: params.threadId,
    message: params.message,
    sent_at: now,
    read: false,
  });

  if (insertError) {
    console.error("Failed to insert grouped thread notification", insertError);
  }
}

export async function createThreadWithFirstMessage(
  ownerAuthUserId: string,
  counselorId: string,
  message: string,
): Promise<{ threadId: string }> {
  const thread = await getOrCreateThread(ownerAuthUserId, counselorId);
  await addMessage(thread.id, "student", message);

  const preview = message.slice(0, 120);
  await upsertAnonymousThreadNotification({
    recipientId: counselorId,
    recipientRole: "counselor",
    threadId: thread.id,
    message: `New pseudonymous thread message: ${preview}`,
  });

  return { threadId: thread.id };
}

export async function sendStudentMessage(threadId: string, message: string): Promise<void> {
  await addMessage(threadId, "student", message);

  const thread = await getAnonymousThreadById(threadId);
  if (thread) {
    const preview = message.slice(0, 120);
    await upsertAnonymousThreadNotification({
      recipientId: thread.counselor_id,
      recipientRole: "counselor",
      threadId,
      message: `New pseudonymous thread message: ${preview}`,
    });
  }
}

export async function sendCounselorMessage(
  threadId: string,
  message: string,
  counselorId: string,
): Promise<void> {
  await addMessage(threadId, "counselor", message, counselorId);

  const ownerAuthUserId = await resolveThreadOwnerAuthUserId(threadId);
  const studentId = ownerAuthUserId ? await resolveStudentIdByAuthUserId(ownerAuthUserId) : null;
  if (studentId) {
    await upsertAnonymousThreadNotification({
      recipientId: studentId,
      recipientRole: "student",
      threadId,
      message: "You have a new message",
    });
  }
}
