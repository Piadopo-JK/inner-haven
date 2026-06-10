import { createClient } from "@/lib/supabase/server";
import { bookingService } from "@/lib/booking/service";
import { buildAvatarPath, uploadAvatarObject } from "@/lib/profile/avatar-storage";
import { NextResponse } from "next/server";

async function downloadAndUploadAvatar(
  url: string,
  authUserId: string,
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const file = new File([blob], "google-avatar.jpg", {
      type: blob.type || "image/jpeg",
    });
    const path = buildAvatarPath("student", authUserId, file);
    const uploaded = await uploadAvatarObject(path, file);
    return uploaded.publicUrl;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          null;
        const googleAvatarUrl =
          user.user_metadata?.avatar_url || null;

        const avatarUrl = googleAvatarUrl
          ? await downloadAndUploadAvatar(googleAvatarUrl, user.id)
          : null;

        await bookingService.ensureStudentProfile({
          authUserId: user.id,
          email: user.email,
          name: fullName,
          avatarUrl,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
