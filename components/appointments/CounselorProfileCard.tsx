"use client";

import { User, Info, ArrowLeftRight } from "lucide-react";
import { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";

type CounselorProfileCardProps = {
  counselor: CounselorDirectoryItemDTO;
  onSwitchCounselor: () => void;
};

export default function CounselorProfileCard({ counselor, onSwitchCounselor }: CounselorProfileCardProps) {
  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-8 shadow-sm">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-[var(--md-sys-color-primary-container)]">
          {counselor.avatar_url ? (
            <img src={counselor.avatar_url} alt={counselor.name} className="h-full w-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center">
              <User className="w-12 h-12 text-[var(--md-sys-color-on-surface-variant)] opacity-20" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">
              {counselor.name}
            </h2>
            <button
              type="button"
              onClick={onSwitchCounselor}
              className="inline-flex items-center justify-center rounded-full p-1.5 text-[var(--md-sys-color-on-surface-variant)] opacity-70 transition hover:opacity-100 hover:bg-[var(--md-sys-color-surface-container-low)]"
              aria-label="Switch counselor"
              title="Switch counselor"
            >
              <ArrowLeftRight className="w-6 h-6" />
            </button>
          </div>
          <p className="text-[var(--md-sys-color-tertiary)] font-bold mb-6">
            {counselor.specialization || "Wellness Specialist"}
          </p>

          <div className="flex items-center gap-2 mb-2 text-[var(--md-sys-color-on-surface)]">
            <Info className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="text-sm font-bold uppercase tracking-wider">About {counselor.name.split(' ')[0]}</span>
          </div>
          <p className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed text-sm">
            {counselor.about || `${counselor.name} is dedicated to supporting your mental health and wellness journey. With expertise in ${counselor.specialization || 'student counseling'}, they provide a compassionate and evidence-based approach to help you navigate challenges.`}
          </p>
        </div>
      </div>
    </div>
  );
}
