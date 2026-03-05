import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/supabase/get-session-user";

export default async function CounselorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (sessionUser.role !== "counselor") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
