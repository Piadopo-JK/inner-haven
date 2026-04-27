"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";

const ACCENT_BACKGROUNDS = [
  "var(--md-sys-color-primary-container)",
  "#2c2c2c",
  "var(--md-sys-color-tertiary-container)",
];

const ACCENT_FOREGROUNDS = [
  "var(--md-sys-color-on-primary-container)",
  "#ffffff",
  "var(--md-sys-color-on-tertiary-container)",
];

type CounselorCardProps = {
  counselor: CounselorDirectoryItemDTO;
  canBook?: boolean;
  colorIndex?: number;
  isOnline?: boolean;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function CounselorCard({
  counselor,
  canBook = true,
  colorIndex = 0,
  isOnline = false,
}: CounselorCardProps) {
  const accentBg = ACCENT_BACKGROUNDS[colorIndex % ACCENT_BACKGROUNDS.length];
  const accentFg = ACCENT_FOREGROUNDS[colorIndex % ACCENT_FOREGROUNDS.length];

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[20px] bg-white"
      style={{ boxShadow: "var(--md-sys-elevation-level2)" }}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: "4 / 5", background: accentBg, borderRadius: "20px 20px 0 0" }}
      >
        {isOnline ? (
          <span
            className="absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: "var(--md-sys-color-tertiary-container)",
              color: "var(--md-sys-color-on-tertiary-container)",
              border: "1px solid var(--md-sys-color-tertiary)",
            }}
          >
            Online
          </span>
        ) : null}
        {counselor.avatar_url ? (
          <img
            src={counselor.avatar_url}
            alt={counselor.name}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ borderRadius: "20px 20px 0 0" }}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-5xl font-bold select-none"
            style={{ color: accentFg }}
          >
            {getInitials(counselor.name)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3
            className="text-lg font-bold leading-snug"
            style={{ color: "var(--md-sys-color-on-surface)" }}
          >
            {counselor.name}
          </h3>
          <p
            className="mt-0.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--md-sys-color-primary)" }}
          >
            {counselor.specialization}
          </p>
        </div>

        <p
          className="line-clamp-3 text-sm leading-relaxed"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          {counselor.about ||
            `${counselor.name} is a dedicated ${counselor.specialization || "specialist"} ready to support you.`}
        </p>

        <div className="mt-auto flex flex-col items-stretch gap-2 pt-3">
          {canBook ? (
            <Link
              href={`/appointments/new?counselor_id=${counselor.counselor_id}`}
              className="block w-full rounded-[10px] py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "var(--md-sys-color-primary)",
                boxShadow: "var(--md-sys-elevation-level1)",
              }}
            >
              Book Session
            </Link>
          ) : (
            <span
              className="block w-full cursor-not-allowed rounded-[10px] py-2.5 text-center text-sm font-semibold text-white opacity-50"
              style={{ background: "var(--md-sys-color-primary)" }}
            >
              Book Session
            </span>
          )}

          <span
            className="flex cursor-not-allowed items-center justify-center gap-1.5 text-xs opacity-40"
            title="Coming soon"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            <Mail className="h-3.5 w-3.5" />
            Send Anonymous Concern
          </span>
        </div>
      </div>
    </div>
  );
}
