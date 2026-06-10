import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createServiceClient } from "@/lib/supabase/server";
import {
  assertValidAvatarFile,
  buildAvatarPath,
  buildHeroCardPath,
  deleteAvatarObject,
  extractAvatarPathFromUrl,
  uploadAvatarObject,
} from "@/lib/profile/avatar-storage";

type ProfileRow = {
  avatar_url: string | null;
  hero_card_url: string | null;
};

async function getProfileTableAndRow(authUserId: string, role: "student" | "counselor") {
  const supabase = createServiceClient();
  const table = role === "counselor" ? "counselors" : "students";

  const { data, error } = await supabase
    .from(table)
    .select("avatar_url, hero_card_url")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Profile not found.");
  }

  return { table, row: data as ProfileRow };
}

async function setAvatarUrl(authUserId: string, role: "student" | "counselor", avatarUrl: string | null) {
  const supabase = createServiceClient();
  const table = role === "counselor" ? "counselors" : "students";

  const { error } = await supabase
    .from(table)
    .update({ avatar_url: avatarUrl })
    .eq("auth_user_id", authUserId);

  if (error) {
    throw new Error(error.message);
  }
}

async function setHeroCardUrl(authUserId: string, heroCardUrl: string | null) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("counselors")
    .update({ hero_card_url: heroCardUrl })
    .eq("auth_user_id", authUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { row } = await getProfileTableAndRow(sessionUser.userId, sessionUser.role);
    return NextResponse.json({
      avatar_url: row.avatar_url,
      hero_card_url: row.hero_card_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const avatarFile = formData.get("avatar");
    const heroCardFile = formData.get("hero_card");

    if (!(avatarFile instanceof File)) {
      return NextResponse.json({ error: "Missing avatar file" }, { status: 400 });
    }

    assertValidAvatarFile(avatarFile);

    if (heroCardFile instanceof File) {
      assertValidAvatarFile(heroCardFile);
    }

    const { row } = await getProfileTableAndRow(sessionUser.userId, sessionUser.role);

    // Upload avatar
    const oldAvatarPath = extractAvatarPathFromUrl(row.avatar_url);
    const avatarPath = buildAvatarPath(sessionUser.role, sessionUser.userId, avatarFile);
    const uploadedAvatar = await uploadAvatarObject(avatarPath, avatarFile);
    await setAvatarUrl(sessionUser.userId, sessionUser.role, uploadedAvatar.publicUrl);

    if (oldAvatarPath && oldAvatarPath !== avatarPath) {
      await deleteAvatarObject(oldAvatarPath).catch(() => undefined);
    }

    // Upload hero card (counselor only)
    let uploadedHeroCardUrl: string | null = null;
    if (heroCardFile instanceof File && sessionUser.role === "counselor") {
      const oldHeroPath = extractAvatarPathFromUrl(row.hero_card_url);
      const heroPath = buildHeroCardPath(sessionUser.role, sessionUser.userId, heroCardFile);
      const uploadedHero = await uploadAvatarObject(heroPath, heroCardFile);
      uploadedHeroCardUrl = uploadedHero.publicUrl;
      await setHeroCardUrl(sessionUser.userId, uploadedHeroCardUrl);

      if (oldHeroPath && oldHeroPath !== heroPath) {
        await deleteAvatarObject(oldHeroPath).catch(() => undefined);
      }
    }

    return NextResponse.json({
      ok: true,
      avatar_url: uploadedAvatar.publicUrl,
      hero_card_url: uploadedHeroCardUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const targetType = url.searchParams.get("type");

    if (targetType === "hero_card" && sessionUser.role === "counselor") {
      // Delete hero card only
      const { row } = await getProfileTableAndRow(sessionUser.userId, sessionUser.role);
      const path = extractAvatarPathFromUrl(row.hero_card_url);

      if (path) {
        await deleteAvatarObject(path).catch(() => undefined);
      }

      await setHeroCardUrl(sessionUser.userId, null);
      return NextResponse.json({ ok: true });
    }

    // Default: delete avatar
    const { row } = await getProfileTableAndRow(sessionUser.userId, sessionUser.role);
    const path = extractAvatarPathFromUrl(row.avatar_url);

    if (path) {
      await deleteAvatarObject(path).catch(() => undefined);
    }

    await setAvatarUrl(sessionUser.userId, sessionUser.role, null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
