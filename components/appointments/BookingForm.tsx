"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Calendar } from "@/components/ui/calendar";
import {
  AppointmentDTO,
  AvailabilityEmptyState,
  AvailabilityResponseDTO,
  AvailabilitySlotDTO,
  CounselorDirectoryItemDTO,
  SessionMode,
} from "@/lib/booking/contracts";
import {
  getCounselorAvailabilityCached,
  emitCounselorAvailabilityChanged,
  subscribeCounselorAvailabilityChanged,
  chunkAlignedRange,
} from "@/lib/cache/settings-client-cache";
import CounselorProfileCard from "@/components/appointments/CounselorProfileCard";
import AvailableSlotsGrid from "@/components/appointments/AvailableSlotsGrid";
import SessionFormatSelection from "@/components/appointments/SessionFormatSelection";
import SessionSummarySidebar from "@/components/appointments/SessionSummarySidebar";
import { Md3Message } from "@/components/ui/md3-message";
import { createClient } from "@/lib/supabase/client";

type BookingFormProps = {
  studentId: string;
  initialAppointment?: AppointmentDTO;
};

type AvailabilitySummary = AvailabilityResponseDTO["schedule_summary"];

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePrefilledDate(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(utc.getTime()) ||
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function parsePrefilledTime(value: string | null): string {
  if (!value) {
    return "";
  }

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}

export default function BookingForm({ studentId, initialAppointment }: BookingFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefills = React.useMemo(() => {
    if (initialAppointment) {
      return {
        counselorId: initialAppointment.counselor_id,
        date: parsePrefilledDate(initialAppointment.appointment_date),
        time: parsePrefilledTime(initialAppointment.appointment_time.slice(0, 5)),
      };
    }

    return {
      counselorId: searchParams.get("counselor_id") || "",
      date: parsePrefilledDate(searchParams.get("date")),
      time: parsePrefilledTime(searchParams.get("time")),
    };
  }, [initialAppointment, searchParams]);
  
  const [counselors, setCounselors] = React.useState<CounselorDirectoryItemDTO[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = React.useState(prefills.counselorId);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(prefills.date ?? new Date());
  const [selectedTime, setSelectedTime] = React.useState(prefills.time);
  const [sessionMode, setSessionMode] = React.useState<SessionMode>(initialAppointment?.mode ?? "online");
  const [reason, setReason] = React.useState(initialAppointment?.reason ?? "");
  const [viewMonth, setViewMonth] = React.useState<Date>(prefills.date ?? new Date());
  
  const [slots, setSlots] = React.useState<AvailabilitySlotDTO[]>([]);
  const [slotsEmptyState, setSlotsEmptyState] = React.useState<AvailabilityEmptyState>("available");
  const [scheduleSummary, setScheduleSummary] = React.useState<AvailabilitySummary>();
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    setSelectedCounselorId(prefills.counselorId);
    setSelectedDate(prefills.date ?? new Date());
    setSelectedTime(prefills.time);
    setSessionMode(initialAppointment?.mode ?? "online");
    setReason(initialAppointment?.reason ?? "");
    setViewMonth(prefills.date ?? new Date());
    setError("");
    setSuccess("");
  }, [initialAppointment, prefills]);

  React.useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    async function loadCounselors() {
      try {
        const response = await fetch("/api/counselors");
        if (response.ok) {
          const data = await response.json();
          setCounselors(data);
        }
      } catch (err) {
        console.error("Failed to load counselors", err);
      }
    }
    loadCounselors();
  }, []);

  React.useEffect(() => {
    if (!selectedCounselorId || !selectedDate) {
      setSlots([]);
      setSlotsEmptyState("available");
      setScheduleSummary(undefined);
      return;
    }

    async function loadSlots() {
      const activeDate = selectedDate;
      if (!activeDate) {
        return;
      }

      setIsLoadingSlots(true);
      const dateStr = formatDateOnly(activeDate);
      try {
        const chunk = chunkAlignedRange(activeDate);
        const cached = await getCounselorAvailabilityCached(selectedCounselorId, chunk.from, chunk.to);

        const data = cached.response.by_date[dateStr];
        if (data) {
          setSlots(data.slots ?? []);
          setSlotsEmptyState(data.empty_state ?? "available");
          setScheduleSummary(data.schedule_summary);
        } else {
          setSlots([]);
          setSlotsEmptyState("not_configured");
          setScheduleSummary(undefined);
        }
      } catch (err) {
        console.error("Failed to load slots", err);
        setSlotsEmptyState("fully_booked");
        setScheduleSummary(undefined);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedCounselorId, selectedDate]);

  React.useEffect(() => {
    if (!selectedCounselorId) return;
    const chunk = chunkAlignedRange(viewMonth);
    void getCounselorAvailabilityCached(selectedCounselorId, chunk.from, chunk.to);
  }, [selectedCounselorId, viewMonth]);

  React.useEffect(() => {
    if (!selectedCounselorId || !selectedDate) {
      return;
    }

    const selectedDateIso = formatDateOnly(selectedDate);
    const supabase = createClient();

    const channel = supabase
      .channel(`booking-form-realtime-${selectedCounselorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `counselor_id=eq.${selectedCounselorId}`,
        },
        (payload) => {
          const nextRow = (payload.new ?? {}) as Record<string, unknown>;
          const previousRow = (payload.old ?? {}) as Record<string, unknown>;
          const nextStatus = nextRow.status as string | undefined;
          const previousStatus = previousRow.status as string | undefined;

          if (nextStatus !== previousStatus || payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            emitCounselorAvailabilityChanged(selectedCounselorId);
            if (
              (nextRow.appointment_date as string | undefined) === selectedDateIso ||
              (previousRow.appointment_date as string | undefined) === selectedDateIso
            ) {
              setSlots([]);
              setScheduleSummary(undefined);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability",
          filter: `counselor_id=eq.${selectedCounselorId}`,
        },
        () => {
          emitCounselorAvailabilityChanged(selectedCounselorId);
          setSlots([]);
          setScheduleSummary(undefined);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedCounselorId, selectedDate]);

  const selectedCounselor = counselors.find(c => c.counselor_id === selectedCounselorId);

  function handleSwitchCounselor() {
    setSelectedCounselorId("");
    setSelectedTime("");
    setSlots([]);
    setSlotsEmptyState("available");
    setScheduleSummary(undefined);
  }

  async function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    if (!event.isTrusted) {
      setError("Please confirm booking manually from the button.");
      return;
    }

    if (!selectedCounselorId || !selectedDate || !selectedTime || !sessionMode) {
      setError("Please complete all selections.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(initialAppointment ? `/api/appointments/${initialAppointment.appointment_id}` : "/api/appointments", {
        method: initialAppointment ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          counselor_id: selectedCounselorId,
          appointment_date: formatDateOnly(selectedDate),
          appointment_time: selectedTime,
          reason: reason.trim(),
          mode: sessionMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      setSuccess(initialAppointment ? "Your appointment has been updated!" : "Your session has been successfully requested!");
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      redirectTimeoutRef.current = setTimeout(() => {
        router.push(initialAppointment ? `/appointments/${initialAppointment.appointment_id}` : "/dashboard");
      }, 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
      <div className="flex flex-col gap-10">
        
        {!selectedCounselorId ? (
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-8 shadow-sm">
             <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-6">
                Choose a Counselor
             </h3>
             <div className="grid gap-4">
                {counselors.map(c => (
                  <button 
                    key={c.counselor_id}
                    onClick={() => setSelectedCounselorId(c.counselor_id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--md-sys-color-on-surface)]">{c.name}</p>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{c.specialization}</p>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        ) : (
          <>
            {selectedCounselor && (
              <CounselorProfileCard
                counselor={selectedCounselor}
                onSwitchCounselor={handleSwitchCounselor}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                        Select Date
                      </h3>
                      <div className="flex gap-1">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full"
                          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full"
                          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                   </div>
                   <Calendar 
                     mode="single"
                     selected={selectedDate}
                     onSelect={setSelectedDate}
                     month={viewMonth}
                     onMonthChange={setViewMonth}
                     className="w-full"
                   />
                  {scheduleSummary && scheduleSummary.source !== "none" ? (
                    <p className="mt-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      Schedule: {scheduleSummary.start_time}-{scheduleSummary.end_time} 
                      {" "}({scheduleSummary.slot_duration_minutes} min slots)
                      {scheduleSummary.breaks.length > 0
                        ? `, break ${scheduleSummary.breaks[0].start_time}-${scheduleSummary.breaks[0].end_time}`
                        : ""}
                    </p>
                  ) : null}
               </div>
               <AvailableSlotsGrid 
                 slots={slots}
                 selectedSlot={selectedTime}
                 onSelect={setSelectedTime}
                 isLoading={isLoadingSlots}
                 emptyState={slotsEmptyState}
                 counselorName={selectedCounselor?.name}
               />
            </div>

            <SessionFormatSelection 
              selectedMode={sessionMode}
              onSelect={setSessionMode}
            />

            <div className="flex flex-col gap-4">
               <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                 State your concern
               </h3>
               <textarea 
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 placeholder={`Tell ${selectedCounselor?.name.split(' ')[0] || 'us'} what's on your mind...`}
                 maxLength={250}
                 className="w-full min-h-[150px] p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] placeholder:opacity-50"
               />
            </div>
          </>
        )}

        {error && <Md3Message tone="error">{error}</Md3Message>}
        {success && <Md3Message tone="success">{success}</Md3Message>}
      </div>

      <SessionSummarySidebar 
        date={selectedDate}
        time={selectedTime}
        mode={sessionMode}
        counselorName={selectedCounselor?.name}
        onConfirm={handleConfirm}
        isSubmitting={isSaving}
        confirmLabel={initialAppointment ? "Save Changes" : "Confirm Session"}
      />
    </div>
  );
}
