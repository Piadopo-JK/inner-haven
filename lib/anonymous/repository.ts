import { PostgrestError } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

import { decryptAnonymousMessage, encryptAnonymousMessage } from "@/lib/anonymous/crypto";
import {
  AnonymousThreadMessage,
  AnonymousThreadSummary,
  AnonymousSender,
  VerifiedAnonymousIdentity,
} from "@/lib/anonymous/types";
import { createServiceClient } from "@/lib/supabase/server";

const IDENTITY_TTL_DAYS = 7;
const UNIQUE_VIOLATION = "23505";

type IdentityRow = {
  id: string;
  token_hash: string;
  owner_auth_user_id: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string | null;
};

type ThreadRow = {
  id: string;
  anonymous_identity_id: string;
  counselor_id: string;
  created_at: string;
  updated_at: string;
  counselors?: Array<{ name: string | null }> | { name: string | null } | null;
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

function getAnonymousLabel(identityId: string) {
  return `ANON-${identityId.slice(0, 4).toUpperCase()}`;
}

function safeDecrypt(value: string) {
  try {
    return decryptAnonymousMessage(value);
  } catch {
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

async function createIdentity(ownerAuthUserId: string) {
  const supabase = createServiceClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
    const expiresAt = new Date(Date.now() + IDENTITY_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("anonymous_identities")
      .insert({
        token_hash: tokenHash,
        owner_auth_user_id: ownerAuthUserId,
        expires_at: expiresAt,
      })
      .select("id, token_hash, owner_auth_user_id, expires_at, created_at, last_seen_at")
      .single();

    if (!error && data) {
      return { identity: data as IdentityRow };
    }

    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  throw new Error("Unable to generate unique token");
}

export async function getOrCreateThread(identityId: string, counselorId: string) {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("anonymous_threads")
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at")
    .eq("anonymous_identity_id", identityId)
    .eq("counselor_id", counselorId)
    .maybeSingle();

  if (existing) {
    return existing as ThreadRow;
  }

  const { data, error } = await supabase
    .from("anonymous_threads")
    .insert({ anonymous_identity_id: identityId, counselor_id: counselorId })
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at")
    .single();

  if (error && !isUniqueViolation(error)) {
    throw error;
  }

  if (!error && data) {
    return data as ThreadRow;
  }

  const { data: retried, error: retriedError } = await supabase
    .from("anonymous_threads")
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at")
    .eq("anonymous_identity_id", identityId)
    .eq("counselor_id", counselorId)
    .single();

  if (retriedError) {
    throw retriedError;
  }

  return retried as ThreadRow;
}

export async function createAnonymousIdentity(ownerAuthUserId: string) {
  const { identity } = await createIdentity(ownerAuthUserId);
  return {
    identityId: identity.id,
    expiresAt: identity.expires_at,
  };
}

async function getLatestActiveIdentityByOwner(ownerAuthUserId: string) {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("anonymous_identities")
    .select("id, token_hash, owner_auth_user_id, expires_at, created_at, last_seen_at")
    .eq("owner_auth_user_id", ownerAuthUserId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as IdentityRow | null) ?? null;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

async function touchIdentity(identityId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("anonymous_identities")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", identityId);
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

async function listThreads(identityId: string): Promise<ThreadRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("anonymous_threads")
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at, counselors(name)")
    .eq("anonymous_identity_id", identityId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ThreadRow[];
}

export async function verifyIdentityByOwner(ownerAuthUserId: string): Promise<VerifiedAnonymousIdentity | null> {
  const identity = await getLatestActiveIdentityByOwner(ownerAuthUserId);
  if (!identity || isExpired(identity.expires_at)) {
    return null;
  }

  await touchIdentity(identity.id);

  const threads = await listThreads(identity.id);
  const lastMessages = await listLastMessagesByThreadIds(threads.map((thread) => thread.id));

  const summaries: AnonymousThreadSummary[] = threads.map((thread) => {
    const lastMessage = lastMessages.get(thread.id);

    return {
      id: thread.id,
      counselorId: thread.counselor_id,
      counselorName: getCounselorDisplayName(thread.counselors),
      anonymousLabel: getAnonymousLabel(identity.id),
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessagePreview: lastMessage ? safeDecrypt(lastMessage.body).slice(0, 80) : undefined,
      lastMessageAt: lastMessage?.created_at,
    };
  });

  return {
    identityId: identity.id,
    expiresAt: identity.expires_at,
    threads: summaries,
  };
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

export async function verifyStudentThreadAccessByOwner(threadId: string, ownerAuthUserId: string) {
  const identity = await verifyIdentityByOwner(ownerAuthUserId);
  if (!identity) return null;

  const match = identity.threads.find((thread) => thread.id === threadId);
  if (!match) return null;

  return {
    identity,
    thread: match,
  };
}

export async function getAnonymousThreadById(threadId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at")
    .eq("id", threadId)
    .maybeSingle();

  return (data as ThreadRow | null) ?? null;
}

export async function resolveIdentityOwnerAuthUserIdByThreadId(threadId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("anonymous_identities(owner_auth_user_id)")
    .eq("id", threadId)
    .maybeSingle();

  const relation = data?.anonymous_identities as { owner_auth_user_id?: string | null } | null | undefined;
  return relation?.owner_auth_user_id ?? null;
}

export async function verifyCounselorThreadAccess(threadId: string, authUserId: string) {
  const counselorId = await resolveCounselorIdByAuthUserId(authUserId);
  if (!counselorId) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("anonymous_threads")
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at")
    .eq("id", threadId)
    .eq("counselor_id", counselorId)
    .maybeSingle();

  if (!data) return null;

  return {
    counselorId,
    thread: data as ThreadRow,
  };
}

export async function listCounselorThreads(authUserId: string) {
  const counselorId = await resolveCounselorIdByAuthUserId(authUserId);
  if (!counselorId) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("anonymous_threads")
    .select("id, anonymous_identity_id, counselor_id, created_at, updated_at")
    .eq("counselor_id", counselorId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const threads = (data ?? []) as ThreadRow[];
  const lastMessages = await listLastMessagesByThreadIds(threads.map((thread) => thread.id));

  return threads.map((thread) => {
    const lastMessage = lastMessages.get(thread.id);
    return {
      id: thread.id,
      anonymousLabel: getAnonymousLabel(thread.anonymous_identity_id),
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessagePreview: lastMessage ? safeDecrypt(lastMessage.body).slice(0, 80) : undefined,
      lastMessageAt: lastMessage?.created_at,
    };
  });
}
