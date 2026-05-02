export const dynamic = "force-dynamic";

import CounselorQueue from "@/components/anonymous/CounselorQueue";

export default async function AnonymousRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const threadId = typeof params.threadId === "string" ? params.threadId : undefined;

  return <CounselorQueue initialThreadId={threadId} />;
}
