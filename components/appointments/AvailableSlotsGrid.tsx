"use client";

import { AvailabilityEmptyState, AvailabilitySlotDTO } from "@/lib/booking/contracts";
import { cn } from "@/lib/utils";

type AvailableSlotsGridProps = {
  slots: AvailabilitySlotDTO[];
  selectedSlot?: string;
  onSelect: (time: string) => void;
  isLoading?: boolean;
  emptyState?: AvailabilityEmptyState;
  counselorName?: string;
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
}: AvailableSlotsGridProps) {
  const message = getEmptyMessage(emptyState, counselorName);

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
            return (
              <button
                key={slot.appointment_time}
                disabled={!slot.available}
                onClick={() => onSelect(slot.appointment_time)}
                className={cn(
                  "py-4 px-6 rounded-2xl border-2 transition-all font-bold text-sm",
                  slot.available 
                    ? isSelected 
                      ? "border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]" 
                      : "border-transparent bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline-variant)]"
                    : "opacity-50 cursor-not-allowed bg-[var(--md-sys-color-surface-container)] border-transparent text-[var(--md-sys-color-on-surface-variant)]"
                )}
              >
                {slot.appointment_time}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
