export type AnonymousSender = "student" | "counselor";

export type AnonymousThreadSummary = {
  id: string;
  counselorId: string;
  counselorName: string;
  anonymousLabel: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
};

export type AnonymousThreadMessage = {
  id: string;
  threadId: string;
  sender: AnonymousSender;
  body: string;
  createdAt: string;
};

export type VerifiedAnonymousIdentity = {
  identityId: string;
  expiresAt: string;
  threads: AnonymousThreadSummary[];
};
