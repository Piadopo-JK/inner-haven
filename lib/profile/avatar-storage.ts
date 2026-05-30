import { createServiceClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export type AvatarUploadResult = {
  path: string;
  publicUrl: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

function inferExtension(fileName: string, mimeType: string) {
  const fromName = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : undefined;
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName;
  }

  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";

  return "jpg";
}

export function assertValidAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Avatar must be an image file.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Avatar file is too large (max 5MB).");
  }
}

export function buildAvatarPath(role: "student" | "counselor", authUserId: string, file: File) {
  const extension = inferExtension(file.name, file.type);
  const rawName = sanitizeFileName(file.name || "avatar");
  const baseName = rawName.replace(/\.[a-zA-Z0-9]+$/, "") || "avatar";
  const stamp = Date.now();
  return `${role}/${authUserId}/${stamp}-${baseName}.${extension}`;
}

export async function uploadAvatarObject(path: string, file: File): Promise<AvatarUploadResult> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteAvatarObject(path: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}

export function extractAvatarPathFromUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export function avatarBucketName() {
  return AVATAR_BUCKET;
}
