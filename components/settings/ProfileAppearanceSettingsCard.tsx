"use client";

import * as React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Md3Message } from "@/components/ui/md3-message";
import { AvatarPicker, type AvatarPickerHandle } from "@/components/ui/avatar-picker";
import {
  useDeleteProfileAvatar,
  useProfile,
  useSaveProfile,
  useUploadProfileAvatar,
} from "@/lib/query/hooks/useProfile";

export default function ProfileAppearanceSettingsCard() {
  const { data: profile, isLoading, error: loadError } = useProfile();
  const { mutateAsync: saveProfile, isPending: isSaving } = useSaveProfile();
  const { mutateAsync: uploadProfileAvatar, isPending: isUploadingAvatar } = useUploadProfileAvatar();
  const { mutateAsync: deleteProfileAvatar, isPending: isDeletingAvatar } = useDeleteProfileAvatar();

  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const avatarPickerLargeRef = React.useRef<AvatarPickerHandle>(null);

  const [name, setName] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [specialization, setSpecialization] = React.useState("");
  const [officeRoom, setOfficeRoom] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const isAvatarSubmitting = isUploadingAvatar || isDeletingAvatar;

  React.useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setAbout(profile.about ?? "");
    setSpecialization(profile.specialization ?? "");
    setOfficeRoom(profile.office_room ?? "");
  }, [profile]);

  React.useEffect(() => {
    if (!avatarFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const initials = React.useMemo(() => {
    const n = profile?.name || "Profile";
    return n.trim().split(/\s+/).slice(0, 2).map((p: string) => p.charAt(0).toUpperCase()).join("") || "P";
  }, [profile?.name]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    try {
      await saveProfile({
        name,
        avatarUrl,
        about,
        specialization,
        officeRoom,
      });
      setSuccess("Profile settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile settings.");
    }
  }

  async function handleUploadAvatar() {
    if (!avatarFile) { setError("Select an image file first."); return; }
    setError(null);
    setSuccess(null);
    try {
      let fileToUpload: File = avatarFile;
      if (previewUrl && avatarPickerLargeRef.current) {
        const blob = await avatarPickerLargeRef.current.getAdjustedBlob();
        if (blob) fileToUpload = new File([blob], avatarFile.name, { type: "image/jpeg" });
      }
      const payload = await uploadProfileAvatar(fileToUpload);
      const nextAvatarUrl = payload.avatar_url ?? "";
      setAvatarUrl(nextAvatarUrl);
      setAvatarFile(null);
      setSuccess("Avatar uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload avatar.");
    }
  }

  async function handleDeleteAvatar() {
    setError(null);
    setSuccess(null);
    try {
      await deleteProfileAvatar();
      setAvatarUrl("");
      setAvatarFile(null);
      setSuccess("Avatar deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete avatar.");
    }
  }

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
      <h2 className="text-base font-semibold">Profile Appearance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your profile photo to the avatars bucket. Counselors can also update the public description shown in booking and directory cards.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading profile settings...</p>
      ) : loadError ? (
        <Md3Message tone="error" className="mt-4">
          {loadError instanceof Error ? loadError.message : "Unable to load profile settings."}
        </Md3Message>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            Display name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" maxLength={120} />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>Update your profile picture</p>
            <div className="flex flex-col gap-4 rounded-lg border p-4" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-lowest)" }}>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full" style={{ border: "1px solid var(--md-sys-color-outline-variant)" }}>
                  {avatarUrl.trim() ? (
                    <Image src={avatarUrl.trim()} alt={profile?.name || "Profile"} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}>
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>{profile?.name || "Profile"}</p>
                  <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {profile?.role === "counselor" ? "Counselor profile" : "Student profile"}
                  </p>
                </div>
              </div>
              <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              <div className="flex items-center gap-3">
                <Button type="button" onClick={handleUploadAvatar} disabled={isAvatarSubmitting || !avatarFile}>
                  {isAvatarSubmitting ? "Uploading..." : "Upload Avatar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleDeleteAvatar} disabled={isAvatarSubmitting || !avatarUrl}>
                  Delete Avatar
                </Button>
              </div>
            </div>
          </div>

          {previewUrl && (
            <>
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => { setAvatarFile(null); setPreviewUrl(null); }} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-high)" }}>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>Adjust Photo</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Drag to reposition or scroll to zoom.
                  </p>
                  <div className="flex flex-wrap items-end justify-center gap-6 mb-4">
                    <div className="flex flex-col items-center gap-2">
                      <AvatarPicker ref={avatarPickerLargeRef} imageUrl={previewUrl} initials={initials} displaySize="small" />
                      <span className="text-[11px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Profile avatar</span>
                    </div>
                    {profile?.role === "counselor" && (
                      <div className="flex flex-col items-center gap-2">
                        <AvatarPicker imageUrl={previewUrl} initials={initials} displaySize="large" />
                        <span className="text-[11px] text-center" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Directory card</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" className="rounded-full" onClick={() => { setAvatarFile(null); setPreviewUrl(null); }}>Cancel</Button>
                    <Button className="rounded-full" onClick={handleUploadAvatar} disabled={isAvatarSubmitting}>Upload</Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {profile?.role === "counselor" ? (
            <>
              <label className="block text-sm">
                Public description
                <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)" }} placeholder="Tell students how you can help and what they can expect." />
              </label>
              <label className="block text-sm">
                Specialization
                <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Academic Counseling, Mental Health" maxLength={200} />
              </label>
              <label className="block text-sm">
                Office / Room
                <Input value={officeRoom} onChange={(e) => setOfficeRoom(e.target.value)} placeholder="e.g. Room 204, Guidance Office" maxLength={100} />
              </label>
            </>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSave} disabled={isSaving || isAvatarSubmitting}>
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
            {error ? <Md3Message tone="error">{error}</Md3Message> : null}
            {success ? <Md3Message tone="success">{success}</Md3Message> : null}
          </div>
        </div>
      )}
    </section>
  );
}
