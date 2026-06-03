"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useProfile } from "@/lib/query/hooks/useProfile";

export default function ProfileMenu() {
  const { data: profile } = useProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const avatarUrl = profile?.avatar_url ?? null;
  const initials = profile?.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p: string) => p.charAt(0).toUpperCase())
        .join("") || "U"
    : "U";

  if (!mounted) {
    return (
      <div
        className="relative rounded-full h-10 w-10 overflow-hidden flex items-center justify-center"
        style={{
          border: "2px solid var(--md-sys-color-outline-variant)",
          boxShadow: "0 0 0 2px var(--md-sys-color-surface)",
          background: "var(--md-sys-color-surface-container-high)",
        }}
        aria-hidden="true"
      />
    );
  }

  const avatarContent = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt="Profile"
      fill
      className="object-cover"
      sizes="32px"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div
      className="flex h-full w-full items-center justify-center text-sm font-semibold"
      style={{
        background: "var(--md-sys-color-primary-container)",
        color: "var(--md-sys-color-on-primary-container)",
      }}
    >
      {initials}
    </div>
  );

  return (
    <div
      className="relative rounded-full h-10 w-10 overflow-hidden flex items-center justify-center"
      style={{
        border: "2px solid var(--md-sys-color-outline-variant)",
        boxShadow: "0 0 0 2px var(--md-sys-color-surface)",
      }}
      title={profile?.name ?? "Profile"}
    >
      {avatarContent}
    </div>
  );
}
