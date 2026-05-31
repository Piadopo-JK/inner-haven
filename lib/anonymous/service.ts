import {
  addMessage,
  detachThread,
  detachThreadByCounselor,
  getAnonymousThreadById,
  getOrCreateThread,
  resolveStudentIdByAuthUserId,
  resolveThreadOwnerAuthUserId,
  upsertAnonymousThreadNotification,
} from "@/lib/anonymous/repository";

export async function createThreadWithFirstMessage(
  ownerAuthUserId: string,
  counselorId: string,
  message: string,
): Promise<{ threadId: string }> {
  const thread = await getOrCreateThread(ownerAuthUserId, counselorId);
  await addMessage(thread.id, "student", message);

  await upsertAnonymousThreadNotification({
    recipientId: counselorId,
    recipientRole: "counselor",
    threadId: thread.id,
    message: "You have a new message",
  });

  return { threadId: thread.id };
}

export async function sendStudentMessage(threadId: string, message: string): Promise<void> {
  await addMessage(threadId, "student", message);

  const thread = await getAnonymousThreadById(threadId);
  if (thread) {
    await upsertAnonymousThreadNotification({
      recipientId: thread.counselor_id,
      recipientRole: "counselor",
      threadId,
      message: "You have a new message",
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

export async function detachThreadForStudent(
  threadId: string,
  ownerAuthUserId: string,
): Promise<void> {
  const { counselorId } = await detachThread(threadId, ownerAuthUserId);

  await addMessage(threadId, "student", "The user can no longer be reached.");

  await upsertAnonymousThreadNotification({
    recipientId: counselorId,
    recipientRole: "counselor",
    threadId,
    message: "A student has closed their anonymous conversation.",
  });
}

export async function detachThreadForCounselor(
  threadId: string,
  counselorAuthUserId: string,
): Promise<void> {
  const { ownerAuthUserId } = await detachThreadByCounselor(threadId, counselorAuthUserId);

  await addMessage(threadId, "counselor", "This conversation has been closed by the counselor.");

  if (ownerAuthUserId) {
    const studentId = await resolveStudentIdByAuthUserId(ownerAuthUserId);
    if (studentId) {
      await upsertAnonymousThreadNotification({
        recipientId: studentId,
        recipientRole: "student",
        threadId,
        message: "A counselor has closed your anonymous conversation.",
      });
    }
  }
}
