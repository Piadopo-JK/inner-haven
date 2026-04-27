"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Md3Message } from "@/components/ui/md3-message";
import { AvatarPicker, type AvatarPickerHandle } from "@/components/ui/avatar-picker";
import {
  emitProfileSettingsChanged,
  getProfileSettingsCached,
  isProfileSettingsCacheFresh,
  subscribeProfileSettingsChanged,
  subscribeVisibilityRefetch,
  subscribeNetworkRefetch,
  type ProfileSettingsCachePayload,
} from "@/lib/cache/settings-client-cache";

type ProfilePayload = ProfileSettingsCachePayload;

export default function ProfileAppearanceSettingsCard() {
  const [profile, setProfile] = React.useState<ProfilePayload | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isAvatarSubmitting, setIsAvatarSubmitting] = React.useState(false);
  const avatarPickerLargeRef = React.useRef<AvatarPickerHandle>(null);

  React.useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);
  const [name, setName] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [specialization, setSpecialization] = React.useState("");
  const [officeRoom, setOfficeRoom] = React.useState("");
  const [yearLevel, setYearLevel] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadProfile(force = false) {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await getProfileSettingsCached({ force });
        setProfile(payload);
        setName(payload.name ?? "");
        setAvatarUrl(payload.avatar_url ?? "");
        setAbout(payload.about ?? "");
        setSpecialization(payload.specialization ?? "");
        setOfficeRoom(payload.office_room ?? "");
        setYearLevel(payload.year_level ?? "");
        setCourse(payload.course ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile settings.");
      } finally {
        setIsLoading(false);
      }
    }

    const unsubscribe = subscribeProfileSettingsChanged(() => {
      void loadProfile();
    });
    const unsubscribeVisibility = subscribeVisibilityRefetch(isProfileSettingsCacheFresh, () =>
      void loadProfile(),
    );
    const unsubscribeNetwork = subscribeNetworkRefetch(isProfileSettingsCacheFresh, () =>
      void loadProfile(),
    );

    void loadProfile();
    return () => {
      unsubscribe();
      unsubscribeVisibility();
      unsubscribeNetwork();
    };
  }, []);

  const initials = React.useMemo(() => {
    const name = profile?.name || "Profile";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "P";
  }, [profile?.name]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatar_url: avatarUrl,
          about: profile?.role === "counselor" ? about : undefined,
          specialization: profile?.role === "counselor" ? specialization : undefined,
          office_room: profile?.role === "counselor" ? officeRoom : undefined,
          year_level: profile?.role === "student" ? yearLevel : undefined,
          course: profile?.role === "student" ? course : undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to save profile settings.");
      }

      setSuccess("Profile settings saved.");
      setProfile((prev) => {
        if (!prev) return prev;

        const nextProfile = {
          ...prev,
          name: name.trim() || prev.name,
          avatar_url: avatarUrl.trim() || null,
          about: prev.role === "counselor" ? about.trim() || null : prev.about,
          specialization: prev.role === "counselor" ? specialization.trim() || null : prev.specialization,
          office_room: prev.role === "counselor" ? officeRoom.trim() || null : prev.office_room,
          year_level: prev.role === "student" ? yearLevel.trim() || null : prev.year_level,
          course: prev.role === "student" ? course.trim() || null : prev.course,
        };

        emitProfileSettingsChanged(nextProfile);
        return nextProfile;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadAvatar() {
    if (!avatarFile) {
      setError("Select an image file first.");
      return;
    }

    setIsAvatarSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let fileToUpload: File = avatarFile;

      if (previewUrl && avatarPickerLargeRef.current) {
        const adjustedBlob = await avatarPickerLargeRef.current.getAdjustedBlob();
        if (adjustedBlob) {
          fileToUpload = new File([adjustedBlob], avatarFile.name, { type: "image/jpeg" });
        }
      }

      const formData = new FormData();
      formData.set("avatar", fileToUpload);

      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; avatar_url?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to upload avatar.");
      }

      const nextAvatarUrl = payload?.avatar_url ?? "";
      setAvatarUrl(nextAvatarUrl);
      setAvatarFile(null);
      setProfile((prev) => {
        if (!prev) return prev;
        const nextProfile = { ...prev, avatar_url: nextAvatarUrl || null };
        emitProfileSettingsChanged(nextProfile);
        return nextProfile;
      });
      setSuccess("Avatar uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload avatar.");
    } finally {
      setIsAvatarSubmitting(false);
    }
  }

  async function handleDeleteAvatar() {
    setIsAvatarSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/avatar", { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete avatar.");
      }

      setAvatarUrl("");
      setAvatarFile(null);
      setProfile((prev) => {
        if (!prev) return prev;
        const nextProfile = { ...prev, avatar_url: null };
        emitProfileSettingsChanged(nextProfile);
        return nextProfile;
      });
      setSuccess("Avatar deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete avatar.");
    } finally {
      setIsAvatarSubmitting(false);
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
      ) : (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Current Avatar
            </p>
            <div className="flex items-center gap-4 rounded-lg border p-4" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-lowest)" }}>
              <div
                className="h-16 w-16 shrink-0 overflow-hidden rounded-full"
                style={{ borderColor: "var(--md-sys-color-outline-variant)", border: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                {avatarUrl.trim() ? (
                  <img
                    src={avatarUrl.trim()}
                    alt={profile?.name || "Profile"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-lg font-semibold"
                    style={{
                      background: "var(--md-sys-color-primary-container)",
                      color: "var(--md-sys-color-on-primary-container)",
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  {profile?.name || "Profile"}
                </p>
                <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {profile?.role === "counselor" ? "Counselor profile" : "Student profile"}
                </p>
              </div>
            </div>
          </div>

          {profile?.role === "counselor" && previewUrl && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
                Photo Preview (Adjustable)
              </p>
              <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                Drag to reposition or scroll to zoom. See how your photo appears in the counselor directory.
              </p>
              <div className="flex flex-wrap items-end gap-6 rounded-lg border p-4" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-lowest)" }}>
                <div className="flex flex-col items-center gap-2">
                  <AvatarPicker
                    imageUrl={previewUrl}
                    initials={initials}
                    displaySize="small"
                  />
                  <span className="text-[11px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Profile avatar
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <AvatarPicker
                    ref={avatarPickerLargeRef}
                    imageUrl={previewUrl}
                    initials={initials}
                    displaySize="large"
                  />
                  <span className="text-[11px] text-center" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Directory card
                  </span>
                  <span className="text-[10px] text-center opacity-60" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    How you appear in the counselor directory
                  </span>
                </div>
              </div>
            </div>
          )}

          <label className="block text-sm">
            Display name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your display name"
              maxLength={120}
            />
          </label>

          <label className="block text-sm">
            Avatar image file
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleUploadAvatar} disabled={isAvatarSubmitting || !avatarFile}>
              {isAvatarSubmitting ? "Uploading..." : "Upload Avatar"}
            </Button>
            <Button type="button" variant="outline" onClick={handleDeleteAvatar} disabled={isAvatarSubmitting || !avatarUrl}>
              Delete Avatar
            </Button>
          </div>

          {profile?.role === "counselor" ? (
            <>
              <label className="block text-sm">
                Public description
                <textarea
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--md-sys-color-outline-variant)",
                    background: "var(--md-sys-color-surface)",
                    color: "var(--md-sys-color-on-surface)",
                  }}
                  placeholder="Tell students how you can help and what they can expect."
                />
              </label>

              <label className="block text-sm">
                Specialization
                <Input
                  value={specialization}
                  onChange={(event) => setSpecialization(event.target.value)}
                  placeholder="e.g. Academic Counseling, Mental Health"
                  maxLength={200}
                />
              </label>

              <label className="block text-sm">
                Office / Room
                <Input
                  value={officeRoom}
                  onChange={(event) => setOfficeRoom(event.target.value)}
                  placeholder="e.g. Room 204, Guidance Office"
                  maxLength={100}
                />
              </label>
            </>
          ) : (
            <>
              <label className="block text-sm">
                Year Level
                <Input
                  value={yearLevel}
                  onChange={(event) => setYearLevel(event.target.value)}
                  placeholder="e.g. 2nd Year, Grade 11"
                  maxLength={50}
                />
              </label>

              <label className="block text-sm">
                Course / Program
                <Input
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  placeholder="e.g. BS Computer Science"
                  maxLength={200}
                />
              </label>
            </>
          )}

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
