import type { VerifiedAnonymousIdentity } from "@/lib/anonymous/types";

export type { AnonymousSender, AnonymousThreadSummary, AnonymousThreadMessage } from "@/lib/anonymous/types";

export type AnonymousCounselor = {
  counselorId: string;
  name: string;
  specialization?: string | null;
  avatarUrl?: string | null;
};

export type VerifyIdentityResponse = VerifiedAnonymousIdentity;
