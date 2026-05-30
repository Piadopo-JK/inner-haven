"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Settings } from "lucide-react";

import { useProfile } from "@/lib/query/hooks/useProfile";

export default function ProfileMenu() {
  const { data: profile } = useProfile();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const avatarUrl = profile?.avatar_url ?? null;
  const initials = profile?.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p: string) => p.charAt(0).toUpperCase())
        .join("") || "U"
    : "U";

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
    <div className="relative" ref={dropdownRef}>
      <Link
        href="/settings"
        className="md:hidden relative rounded-full h-10 w-10 overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
        style={{
          border: "2px solid var(--md-sys-color-outline-variant)",
          boxShadow: "0 0 0 2px var(--md-sys-color-surface)",
        }}
        title="Open settings"
      >
        {avatarContent}
      </Link>

      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onMouseEnter={() => setIsDropdownOpen(true)}
        className="hidden md:flex relative rounded-full h-10 w-10 overflow-hidden items-center justify-center transition-opacity hover:opacity-80"
        style={{
          border: "2px solid var(--md-sys-color-outline-variant)",
          boxShadow: "0 0 0 2px var(--md-sys-color-surface)",
        }}
        title="User profile"
      >
        {avatarContent}
      </button>

      {isDropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 py-2"
          style={{
            background: "var(--md-sys-color-surface-container)",
            border: "1px solid var(--md-sys-color-outline-variant)",
          }}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
            style={{
              color: "var(--md-sys-color-on-surface)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--md-sys-color-surface-container-high)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </div>
  );
}
