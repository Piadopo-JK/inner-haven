import { createClient } from "@/lib/supabase/server";

export type SessionRole = "student" | "counselor";

export type SessionUser = {
  userId: string;
  role: SessionRole;
  email: string | undefined;
};

/**
 * Determines role by checking the counselors table for a matching auth_user_id.
 * Falls back to "student" if no counselor row is found.
 * This is more reliable than reading user_metadata, which can be inconsistent
 * depending on how the metadata was set (dashboard vs sign-up flow).
 **/
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: counselorRow } = await supabase
    .from("counselors")
    .select("counselor_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const role: SessionRole = counselorRow ? "counselor" : "student";

  return {
    userId: user.id,
    role,
    email: user.email,
  };
}
