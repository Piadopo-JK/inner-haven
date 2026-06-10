import type { StudentAnonymousThreads } from "@/lib/anonymous/types";

export type { AnonymousSender, AnonymousThreadSummary, AnonymousThreadMessage, CounselorAnonymousThreadSummary } from "@/lib/anonymous/types";

export type AnonymousCounselor = {
  counselorId: string;
  name: string;
  specialization?: string | null;
  avatarUrl?: string | null;
};

export type StudentThreadsResponse = StudentAnonymousThreads;
