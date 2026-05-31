export type AnonymousSender = "student" | "counselor";

export type ThreadStatus = "active" | "detached";

export type AnonymousThreadSummary = {
  id: string;
  counselorId: string;
  counselorName: string;
  counselorAvatarUrl?: string | null;
  anonymousLabel: string;
  status: ThreadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
};

export type StudentAnonymousThreads = {
  threads: AnonymousThreadSummary[];
};

export type AnonymousThreadMessage = {
  id: string;
  threadId: string;
  sender: AnonymousSender;
  body: string;
  createdAt: string;
};

export type CounselorAnonymousThreadSummary = {
  id: string;
  anonymousLabel: string;
  status: ThreadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
};
