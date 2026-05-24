"use client";

import { Calendar, Clock, Video, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionMode } from "@/lib/booking/contracts";

type SummaryItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subvalue?: string;
};

function SummaryItem({ icon, label, value, subvalue }: SummaryItemProps) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] opacity-60">
          {label}
        </p>
        <p className="font-bold text-[var(--md-sys-color-on-surface)] leading-tight">{value}</p>
        {subvalue && <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] opacity-70">{subvalue}</p>}
      </div>
    </div>
  );
}

type SessionSummarySidebarProps = {
  date?: Date;
  time?: string;
  mode?: SessionMode;
  counselorName?: string;
  onConfirm: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting?: boolean;
  confirmLabel?: string;
};

export default function SessionSummarySidebar({ date, time, mode, counselorName, onConfirm, isSubmitting, confirmLabel }: SessionSummarySidebarProps) {
  const dateStr = date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not selected';

  return (
    <div className="sticky top-20 md:top-24">
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-8 shadow-lg relative overflow-hidden">
        <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-8">
          Session Summary
        </h3>

        <div className="flex flex-col gap-6 mb-10">
          <SummaryItem 
            icon={<Calendar className="w-5 h-5" />} 
            label="Date" 
            value={dateStr} 
          />
          <SummaryItem 
            icon={<Clock className="w-5 h-5" />} 
            label="Time" 
            value={time || 'Not selected'} 
            subvalue={time ? '(60 min)' : undefined}
          />
          <SummaryItem 
            icon={mode === 'online' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />} 
            label="Platform" 
            value={mode === 'online' ? 'Google Meet' : 'In-person'} 
            subvalue={undefined}
          />
          <SummaryItem 
            icon={<User className="w-5 h-5" />} 
            label="Counselor" 
            value={counselorName || 'Not selected'} 
          />
        </div>

        <div className="pt-6 border-t border-[var(--md-sys-color-outline-variant)] flex flex-col gap-6">
          
          <Button 
            onClick={onConfirm}
            disabled={!date || !time || !mode || !counselorName || isSubmitting}
            className="w-full py-8 rounded-3xl bg-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/90 text-[var(--md-sys-color-on-primary)] font-bold text-lg shadow-xl transition-all"
          >
            {isSubmitting ? 'Saving...' : (confirmLabel ?? 'Confirm Session')}
          </Button>

          <p className="text-[10px] text-center text-[var(--md-sys-color-on-surface-variant)] opacity-70 px-4">
            You can reschedule or cancel up to 24 hours before your session starts.
          </p>
        </div>
      </div>
    </div>
  );
}
