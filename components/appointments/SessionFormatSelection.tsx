"use client";

import { Video, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionMode } from "@/lib/booking/contracts";

type FormatOptionProps = {
  mode: SessionMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: (mode: SessionMode) => void;
};

function FormatOption({ mode, label, description, icon, selected, onSelect }: FormatOptionProps) {
  return (
    <button
      onClick={() => onSelect(mode)}
      className={cn(
        "flex-1 p-6 rounded-3xl border-2 transition-all text-left flex items-center gap-4 relative",
        selected 
          ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] shadow-sm" 
          : "border-transparent bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline-variant)]"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
        selected
          ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]"
          : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]"
      )}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-[var(--md-sys-color-on-surface)]">{label}</h4>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] opacity-70">{description}</p>
      </div>
      {selected && (
        <CheckCircle2 className="w-6 h-6 text-[var(--md-sys-color-primary)] absolute top-6 right-6" />
      )}
    </button>
  );
}

export default function SessionFormatSelection({ selectedMode, onSelect }: { selectedMode: SessionMode, onSelect: (mode: SessionMode) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
        Session Format
      </h3>
      <div className="flex flex-col md:flex-row gap-4">
        <FormatOption 
          mode="online"
          label="Google Meet"
          description="Secure video call link"
          icon={<Video className="w-6 h-6" />}
          selected={selectedMode === 'online'}
          onSelect={onSelect}
        />
        <FormatOption 
          mode="in_person"
          label="In-person"
          description="Main Campus Lounge"
          icon={<MapPin className="w-6 h-6" />}
          selected={selectedMode === 'in_person'}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
