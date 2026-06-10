"use client";

import { useMemo } from "react";

import { AvailabilityEmptyState, AvailabilitySlotDTO } from "@/lib/booking/contracts";
import { cn } from "@/lib/utils";

function formatSlotTime(rawTime: string) {
  const [rawHour = "0", rawMinute = "00"] = rawTime.split(":");
  const hour24 = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return rawTime;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

type AvailableSlotsGridProps = {
  slots: AvailabilitySlotDTO[];
  selectedSlot?: string;
  onSelect: (time: string) => void;
  isLoading?: boolean;
  emptyState?: AvailabilityEmptyState;
  counselorName?: string;
  selectedDate?: string;
};

function getEmptyMessage(emptyState: AvailabilityEmptyState, counselorName?: string) {
  if (emptyState === "not_configured") {
    const label = counselorName ? `${counselorName} has` : "This counselor has";
    return `${label} not configured a weekly schedule yet.`;
  }

  if (emptyState === "past_time_only") {
    return "No future slots remain for today. Try a later date.";
  }

  if (emptyState === "fully_booked") {
    return "All available slots are already booked for this date.";
  }

  return "No slots available for this date.";
}

export default function AvailableSlotsGrid({
  slots,
  selectedSlot,
  onSelect,
  isLoading,
  emptyState = "available",
  counselorName,
  selectedDate,
}: AvailableSlotsGridProps) {
  const message = getEmptyMessage(emptyState, counselorName);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const isToday = selectedDate === todayIso;
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  function isPastSlot(time: string): boolean {
    if (!isToday) return false;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m <= nowMinutes;
  }

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-8 flex flex-col gap-6 h-full">
      <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
        Available Slots
      </h3>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="animate-pulse text-[var(--md-sys-color-on-surface-variant)]">Loading slots...</div>
        </div>
      ) : slots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12 text-center text-[var(--md-sys-color-on-surface-variant)] opacity-60 italic">
          {message}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.appointment_time;
            const past = isPastSlot(slot.appointment_time);
            const disabled = !slot.available || past;
            return (
              <button
                key={slot.appointment_time}
                disabled={disabled}
                onClick={() => onSelect(slot.appointment_time)}
                className={cn(
                  "py-4 px-6 rounded-2xl border-2 transition-all font-bold text-sm",
                  past
                    ? "opacity-30 cursor-not-allowed bg-[var(--md-sys-color-surface-container)] border-transparent text-[var(--md-sys-color-on-surface-variant)] line-through"
                    : slot.available 
                      ? isSelected 
                        ? "border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]" 
                        : "border-transparent bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline-variant)]"
                      : "opacity-50 cursor-not-allowed bg-[var(--md-sys-color-surface-container)] border-transparent text-[var(--md-sys-color-on-surface-variant)]"
                )}
              >
                {formatSlotTime(slot.appointment_time)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
