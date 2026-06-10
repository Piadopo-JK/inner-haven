import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";

export const dynamic = "force-dynamic";

const AnonymousMessagingHub = dynamicImport(
  () => import("@/components/anonymous/AnonymousMessagingHub"),
  {
    loading: () => (
      <div className="flex h-[60vh] animate-pulse items-center justify-center rounded-3xl bg-[var(--md-sys-color-surface-container-low)]">
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading messages…</p>
      </div>
    ),
  },
);

const CounselorQueue = dynamicImport(
  () => import("@/components/anonymous/CounselorQueue"),
  {
    loading: () => (
      <div className="flex h-[60vh] animate-pulse items-center justify-center rounded-3xl bg-[var(--md-sys-color-surface-container-low)]">
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading queue…</p>
      </div>
    ),
  },
);

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.role === "counselor") {
    const params = await searchParams;
    return <CounselorQueue initialThreadId={params.threadId} />;
  }

  await requireStudentProfile(sessionUser.userId);

  const params = await searchParams;
  const counselorId = typeof params.counselorId === "string" ? params.counselorId : undefined;
  const threadId = typeof params.threadId === "string" ? params.threadId : undefined;

  return <AnonymousMessagingHub counselorId={counselorId} threadId={threadId} />;
}
