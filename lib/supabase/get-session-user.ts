import { createClient } from "@/lib/supabase/server";

export type SessionRole = "student" | "counselor";

export type SessionUser = {
  userId: string;
  role: SessionRole;
  email: string | undefined;
};

/**
 * DEV BYPASS: When running locally without a Supabase session, set
 * DEV_ROLE=student or DEV_ROLE=counselor in .env.local to skip auth.
 * student  -> "dev-student-001"
 * counselor -> "cslr-001"
 */
function getDevBypassUser(): SessionUser | null {
  if (process.env.NODE_ENV !== "development") return null;
  const devRole = process.env.DEV_ROLE as SessionRole | undefined;
  if (!devRole) return null;
  const role: SessionRole = devRole === "counselor" ? "counselor" : "student";
  return {
    userId: role === "counselor" ? "cslr-001" : "dev-student-001",
    role,
    email: undefined,
  };
}

/**
swap this to lookup
the role from the `students` or `counselors` table by `auth_user_id` instead
of relying solely on metadata.
 **/
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return getDevBypassUser();

  const rawRole = user.user_metadata?.role as string | undefined;
  const role: SessionRole = rawRole === "counselor" ? "counselor" : "student";

  return {
    userId: user.id,
    role,
    email: user.email,
  };
}
