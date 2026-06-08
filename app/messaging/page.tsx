import { redirect } from "next/navigation";

import AnonymousMessagingHub from "@/components/anonymous/AnonymousMessagingHub";
import CounselorQueue from "@/components/anonymous/CounselorQueue";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";

export const dynamic = "force-dynamic";

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
