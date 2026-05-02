import { redirect } from "next/navigation";

import AnonymousMessagingHub from "@/components/anonymous/AnonymousMessagingHub";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const dynamic = "force-dynamic";

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (sessionUser.role === "counselor") {
    redirect("/anonymous-requests");
  }

  const params = await searchParams;
  const counselorId = typeof params.counselorId === "string" ? params.counselorId : undefined;
  const threadId = typeof params.threadId === "string" ? params.threadId : undefined;

  return <AnonymousMessagingHub counselorId={counselorId} threadId={threadId} />;
}
