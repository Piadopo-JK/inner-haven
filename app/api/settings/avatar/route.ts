import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createServiceClient } from "@/lib/supabase/server";
import {
  assertValidAvatarFile,
  buildAvatarPath,
  deleteAvatarObject,
  extractAvatarPathFromUrl,
  uploadAvatarObject,
} from "@/lib/profile/avatar-storage";

type ProfileRow = {
  avatar_url: string | null;
};

async function getProfileTableAndRow(authUserId: string, role: "student" | "counselor") {
  const supabase = createServiceClient();
  const table = role === "counselor" ? "counselors" : "students";

  const { data, error } = await supabase
    .from(table)
    .select("avatar_url")
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

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { row } = await getProfileTableAndRow(sessionUser.userId, sessionUser.role);
    return NextResponse.json({ avatar_url: row.avatar_url });
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
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing avatar file" }, { status: 400 });
    }

    assertValidAvatarFile(file);

    const { row } = await getProfileTableAndRow(sessionUser.userId, sessionUser.role);
    const oldPath = extractAvatarPathFromUrl(row.avatar_url);

    const path = buildAvatarPath(sessionUser.role, sessionUser.userId, file);
    const uploaded = await uploadAvatarObject(path, file);

    await setAvatarUrl(sessionUser.userId, sessionUser.role, uploaded.publicUrl);

    if (oldPath && oldPath !== path) {
      await deleteAvatarObject(oldPath).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, avatar_url: uploaded.publicUrl, path: uploaded.path });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
