import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { avatarBucketName } from "@/lib/profile/avatar-storage";
import { loadProfileSettings } from "@/lib/settings/server";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createServiceClient } from "@/lib/supabase/server";

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isAvatarBucketPublicUrl(value: string) {
  try {
    const parsed = new URL(value);
    const marker = `/storage/v1/object/public/${avatarBucketName()}/`;
    return parsed.pathname.includes(marker);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await loadProfileSettings(sessionUser);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: unknown;
      avatar_url?: unknown;
      about?: unknown;
      specialization?: unknown;
      office_room?: unknown;
      year_level?: unknown;
      course?: unknown;
    };

    const name = normalizeString(body.name);
    const avatarUrl = normalizeString(body.avatar_url);
    const about = normalizeString(body.about);
    const specialization = normalizeString(body.specialization);
    const officeRoom = normalizeString(body.office_room);
    const yearLevel = normalizeString(body.year_level);
    const course = normalizeString(body.course);

    if (avatarUrl && !isAvatarBucketPublicUrl(avatarUrl)) {
      return NextResponse.json({ error: "Avatar URL must be from the public avatars bucket." }, { status: 400 });
    }

    if (name && name.length > 120) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (avatarUrl && avatarUrl.length > 1000) {
      return NextResponse.json({ error: "Avatar URL is too long" }, { status: 400 });
    }

    if (about && about.length > 2000) {
      return NextResponse.json({ error: "Description is too long" }, { status: 400 });
    }

    if (specialization && specialization.length > 200) {
      return NextResponse.json({ error: "Specialization is too long" }, { status: 400 });
    }

    if (officeRoom && officeRoom.length > 100) {
      return NextResponse.json({ error: "Office room is too long" }, { status: 400 });
    }

    if (yearLevel && yearLevel.length > 50) {
      return NextResponse.json({ error: "Year level is too long" }, { status: 400 });
    }

    if (course && course.length > 200) {
      return NextResponse.json({ error: "Course is too long" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const nextName = name ?? undefined;

    if (sessionUser.role === "counselor") {
      const { error } = await supabase
        .from("counselors")
        .update({
          name: nextName,
          avatar_url: avatarUrl,
          about,
          specialization,
          office_room: officeRoom,
        })
        .eq("auth_user_id", sessionUser.userId);

      if (error) {
        throw error;
      }

      revalidatePath("/dashboard");
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from("students")
      .update({
        name: nextName,
        avatar_url: avatarUrl,
        year_level: yearLevel,
        course,
      })
      .eq("auth_user_id", sessionUser.userId);

    if (error) {
      throw error;
    }

    revalidatePath("/app/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save profile settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
