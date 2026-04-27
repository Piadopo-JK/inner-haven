"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Settings } from "lucide-react";

import {
  getProfileSettingsCached,
  isProfileSettingsCacheFresh,
  subscribeProfileSettingsChanged,
  subscribeVisibilityRefetch,
  subscribeNetworkRefetch,
} from "@/lib/cache/settings-client-cache";

export default function ProfileMenu() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyProfile = (data: { avatar_url?: string | null; name?: string }) => {
      setAvatarUrl(data.avatar_url || null);
      if (data.name) {
        const parts = data.name.trim().split(/\s+/).slice(0, 2);
        setInitials(parts.map((p) => p.charAt(0).toUpperCase()).join("") || "U");
      }
    };

    const loadProfile = async (force = false) => {
      try {
        const data = await getProfileSettingsCached({ force });
        applyProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onMouseEnter={() => setIsDropdownOpen(true)}
        className="rounded-full h-10 w-10 overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
        style={{
          border: "2px solid var(--md-sys-color-outline-variant)",
          boxShadow: "0 0 0 2px var(--md-sys-color-surface)",
        }}
        title="User profile"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="h-full w-full object-cover"
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
        )}
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
              e.currentTarget.style.background = "var(--md-sys-color-surface-container-high)";
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
