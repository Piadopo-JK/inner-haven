import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.role !== "student") {
    redirect("/dashboard");
  }

  await requireStudentProfile(sessionUser.userId);

  return <>{children}</>;
}
