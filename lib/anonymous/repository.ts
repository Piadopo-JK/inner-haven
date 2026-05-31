import { PostgrestError } from "@supabase/supabase-js";

import { decryptAnonymousMessage, encryptAnonymousMessage } from "@/lib/anonymous/crypto";
import {
  AnonymousThreadMessage,
  AnonymousThreadSummary,
  AnonymousSender,
  StudentAnonymousThreads,
  CounselorAnonymousThreadSummary,
  ThreadStatus,
} from "@/lib/anonymous/types";
import { createServiceClient } from "@/lib/supabase/server";

const THREAD_TTL_DAYS = 7;
const UNIQUE_VIOLATION = "23505";

type ThreadRow = {
  id: string;
  counselor_id: string;
  owner_auth_user_id: string | null;
  status: ThreadStatus;
  expires_at: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  counselors?: Array<{ name: string | null; avatar_url?: string | null }> | { name: string | null; avatar_url?: string | null } | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender: AnonymousSender;
  body: string;
  created_at: string;
};

function isUniqueViolation(error: PostgrestError | null) {
  return error?.code === UNIQUE_VIOLATION;
}

function getAnonymousLabel(threadId: string) {
  return `ANON-${threadId.slice(0, 4).toUpperCase()}`;
}

function safeDecrypt(value: string) {
  try {
    return decryptAnonymousMessage(value);
  } catch (err) {
    console.error("Failed to decrypt anonymous message", err);
    return "[Message unavailable]";
  }
}

function getCounselorDisplayName(counselors: ThreadRow["counselors"]) {
  if (Array.isArray(counselors)) {
    return counselors[0]?.name ?? "Counselor";
  }
  if (counselors && typeof counselors === "object") {
    return counselors.name ?? "Counselor";
  }
  return "Counselor";
}

function getCounselorAvatarUrl(counselors: ThreadRow["counselors"]) {
  if (Array.isArray(counselors)) {
    return counselors[0]?.avatar_url ?? null;
  }
  if (counselors && typeof counselors === "object") {
    return counselors.avatar_url ?? null;
  }
  return null;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function resolveCounselorIdByAuthUserId(authUserId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("counselors")
    .select("counselor_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  return (data?.counselor_id as string | undefined) ?? null;
}

export async function resolveStudentIdByAuthUserId(authUserId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("students")
    .select("student_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  return (data?.student_id as string | undefined) ?? null;
}

async function listLastMessagesByThreadIds(threadIds: string[]) {
  if (threadIds.length === 0) return new Map<string, MessageRow>();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_messages")
    .select("id, thread_id, sender, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as MessageRow[];
  const map = new Map<string, MessageRow>();
  for (const row of rows) {
    if (!map.has(row.thread_id)) {
      map.set(row.thread_id, row);
    }
  }

  return map;
}

export async function createThread(ownerAuthUserId: string, counselorId: string) {
  const supabase = createServiceClient();
  const expiresAt = new Date(Date.now() + THREAD_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("anonymous_threads")
    .insert({
      owner_auth_user_id: ownerAuthUserId,
      counselor_id: counselorId,
      status: "active" as ThreadStatus,
      expires_at: expiresAt,
    })
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as ThreadRow;
}

export async function getOrCreateThread(ownerAuthUserId: string, counselorId: string) {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("anonymous_threads")
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
    .eq("owner_auth_user_id", ownerAuthUserId)
    .eq("counselor_id", counselorId)
    .eq("status", "active")
    .maybeSingle();

  if (existing && !isExpired(existing.expires_at)) {
    return existing as ThreadRow;
  }

  try {
    return await createThread(ownerAuthUserId, counselorId);
  } catch (err) {
    if (isUniqueViolation(err as PostgrestError)) {
      const { data: retried } = await supabase
        .from("anonymous_threads")
        .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
        .eq("owner_auth_user_id", ownerAuthUserId)
        .eq("counselor_id", counselorId)
        .eq("status", "active")
        .single();

      return retried as ThreadRow;
    }
    throw err;
  }
}

export async function detachThread(threadId: string, ownerAuthUserId: string) {
  const supabase = createServiceClient();

  const { data: thread } = await supabase
    .from("anonymous_threads")
    .select("id, owner_auth_user_id, counselor_id")
    .eq("id", threadId)
    .eq("owner_auth_user_id", ownerAuthUserId)
    .eq("status", "active")
    .maybeSingle();

  if (!thread) {
    throw new Error("Thread not found or not owned by this user");
  }

  const { error } = await supabase
    .from("anonymous_threads")
    .update({
      owner_auth_user_id: null,
      status: "detached" as ThreadStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  if (error) throw error;

  return { counselorId: thread.counselor_id as string };
}

export async function detachThreadByCounselor(threadId: string, counselorAuthUserId: string) {
  const counselorId = await resolveCounselorIdByAuthUserId(counselorAuthUserId);
  if (!counselorId) {
    throw new Error("Counselor not found");
  }

  const supabase = createServiceClient();

  const { data: thread } = await supabase
    .from("anonymous_threads")
    .select("id, owner_auth_user_id, counselor_id")
    .eq("id", threadId)
    .eq("counselor_id", counselorId)
    .eq("status", "active")
    .maybeSingle();

  if (!thread) {
    throw new Error("Thread not found or not assigned to this counselor");
  }

  const { error } = await supabase
    .from("anonymous_threads")
    .update({
      owner_auth_user_id: null,
      status: "detached" as ThreadStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  if (error) throw error;

  return { ownerAuthUserId: thread.owner_auth_user_id as string | null };
}

export async function listStudentThreads(ownerAuthUserId: string): Promise<StudentAnonymousThreads> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("anonymous_threads")
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at, counselors(name, avatar_url)")
    .eq("owner_auth_user_id", ownerAuthUserId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const threads = (data ?? []) as ThreadRow[];

  const lastMessages = await listLastMessagesByThreadIds(threads.map((t) => t.id));

  const summaries: AnonymousThreadSummary[] = threads.map((thread) => {
    const lastMessage = lastMessages.get(thread.id);
    return {
      id: thread.id,
      counselorId: thread.counselor_id,
      counselorName: getCounselorDisplayName(thread.counselors),
      counselorAvatarUrl: getCounselorAvatarUrl(thread.counselors),
      anonymousLabel: getAnonymousLabel(thread.id),
      status: thread.status,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessagePreview: lastMessage ? safeDecrypt(lastMessage.body).slice(0, 80) : undefined,
      lastMessageAt: lastMessage?.created_at,
    };
  });

  return { threads: summaries };
}

export async function markStudentThreadsSeen(ownerAuthUserId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("anonymous_threads")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("owner_auth_user_id", ownerAuthUserId)
    .eq("status", "active");
}

export async function addMessage(
  threadId: string,
  sender: AnonymousSender,
  body: string,
  counselorId?: string,
) {
  const supabase = createServiceClient();
  const encrypted = encryptAnonymousMessage(body);

  const { error } = await supabase.from("anonymous_messages").insert({
    thread_id: threadId,
    sender,
    body: encrypted,
    counselor_id: sender === "counselor" ? counselorId : null,
  });

  if (error) throw error;

  await supabase
    .from("anonymous_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);
}

export async function listMessages(threadId: string): Promise<AnonymousThreadMessage[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("anonymous_messages")
    .select("id, thread_id, sender, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as MessageRow[]).map((row) => ({
    id: row.id,
    threadId: row.thread_id,
    sender: row.sender,
    body: safeDecrypt(row.body),
    createdAt: row.created_at,
  }));
}

export async function getAnonymousThreadById(threadId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
    .eq("id", threadId)
    .maybeSingle();

  return (data as ThreadRow | null) ?? null;
}

export async function verifyStudentThreadAccessByOwner(threadId: string, ownerAuthUserId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
    .eq("id", threadId)
    .eq("owner_auth_user_id", ownerAuthUserId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  return {
    threadId: data.id,
    isDetached: false,
    thread: {
      id: data.id,
      counselorId: data.counselor_id,
      anonymousLabel: getAnonymousLabel(data.id),
    },
  };
}

export async function verifyCounselorThreadAccess(threadId: string, authUserId: string) {
  const counselorId = await resolveCounselorIdByAuthUserId(authUserId);
  if (!counselorId) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
    .eq("id", threadId)
    .eq("counselor_id", counselorId)
    .maybeSingle();

  if (!data) return null;

  return {
    counselorId,
    thread: data as ThreadRow,
    isDetached: data.status === "detached",
  };
}

export async function resolveThreadOwnerAuthUserId(threadId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("owner_auth_user_id")
    .eq("id", threadId)
    .maybeSingle();

  return (data?.owner_auth_user_id as string | null) ?? null;
}

export async function listCounselorThreads(authUserId: string): Promise<CounselorAnonymousThreadSummary[]> {
  const counselorId = await resolveCounselorIdByAuthUserId(authUserId);
  if (!counselorId) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("anonymous_threads")
    .select("id, counselor_id, owner_auth_user_id, status, expires_at, last_seen_at, created_at, updated_at")
    .eq("counselor_id", counselorId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const threads = (data ?? []) as ThreadRow[];
  const lastMessages = await listLastMessagesByThreadIds(threads.map((t) => t.id));

  return threads.map((thread) => {
    const lastMessage = lastMessages.get(thread.id);
    return {
      id: thread.id,
      anonymousLabel: getAnonymousLabel(thread.id),
      status: thread.status,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessagePreview: lastMessage ? safeDecrypt(lastMessage.body).slice(0, 80) : undefined,
      lastMessageAt: lastMessage?.created_at,
    };
  });
}

export async function upsertAnonymousThreadNotification(params: {
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
