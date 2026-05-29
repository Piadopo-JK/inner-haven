"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AppointmentDTO,
  AvailabilityEmptyState,
  AvailabilityResponseDTO,
  AvailabilitySlotDTO,
  SessionMode,
} from "@/lib/booking/contracts";
import {
  useAvailabilityForMonth,
  useInvalidateCounselorAvailability,
} from "@/lib/query/hooks/useAvailability";
import { useCounselors } from "@/lib/query/hooks/useCounselors";
import { availabilityForMonthQueryOptions } from "@/lib/query/queries";
import { useSaveAppointment } from "@/lib/query/hooks/useAppointments";
import { createClient } from "@/lib/supabase/client";
import CounselorProfileCard from "@/components/appointments/CounselorProfileCard";
import AvailableSlotsGrid from "@/components/appointments/AvailableSlotsGrid";
import SessionFormatSelection from "@/components/appointments/SessionFormatSelection";
import SessionSummarySidebar from "@/components/appointments/SessionSummarySidebar";
import LoaderAnimations, { EnvelopeLoader } from "@/components/loading/BrandedLoaders";
import { Md3Message } from "@/components/ui/md3-message";
import { LOADING_MESSAGES } from "@/lib/loading/states";

type BookingFormProps = {
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
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw), month = Number(monthRaw), day = Number(dayRaw);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utc.getTime()) || utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return undefined;
  return new Date(year, month - 1, day);
}

function parsePrefilledTime(value: string | null): string {
  if (!value) return "";
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}

export default function BookingForm({ initialAppointment }: BookingFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invalidateAvailability = useInvalidateCounselorAvailability();
  const { mutateAsync: saveAppointment, isPending: isSaving } = useSaveAppointment();
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

  const {
    data: counselors = [],
    isLoading: isLoadingCounselors,
    error: counselorsLoadError,
  } = useCounselors();
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
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isRedirectingAfterConfirm, setIsRedirectingAfterConfirm] = React.useState(false);
  const showConfirmEnvelope = isSaving || isRedirectingAfterConfirm;

  React.useEffect(() => {
    setSelectedCounselorId(prefills.counselorId);
    setSelectedDate(prefills.date ?? new Date());
    setSelectedTime(prefills.time);
    setSessionMode(initialAppointment?.mode ?? "online");
    setReason(initialAppointment?.reason ?? "");
    setViewMonth(prefills.date ?? new Date());
    setError("");
    setSuccess("");
    setIsRedirectingAfterConfirm(false);
  }, [initialAppointment, prefills]);

  React.useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const { data: availabilityData } = useAvailabilityForMonth(selectedCounselorId, viewMonth);

  // Derive slots from TQ availability data whenever date or availability changes
  React.useEffect(() => {
    if (!selectedCounselorId || !selectedDate) {
      setSlots([]);
      setSlotsEmptyState("available");
      setScheduleSummary(undefined);
      return;
    }

    if (!availabilityData) {
      setIsLoadingSlots(true);
      return;
    }

    setIsLoadingSlots(false);
    const dateStr = formatDateOnly(selectedDate);
    const data = availabilityData.by_date[dateStr];
    if (data) {
      setSlots(data.slots ?? []);
      setSlotsEmptyState(data.empty_state ?? "available");
      setScheduleSummary(data.schedule_summary);
    } else {
      setSlots([]);
      setSlotsEmptyState("not_configured");
      setScheduleSummary(undefined);
    }
  }, [selectedCounselorId, selectedDate, availabilityData]);

  // Supabase realtime: invalidate availability on appointment / schedule table changes
  React.useEffect(() => {
    if (!selectedCounselorId || !selectedDate) return;

    const selectedDateIso = formatDateOnly(selectedDate);
    const supabase = createClient();

    const channel = supabase
      .channel(`booking-form-realtime-${selectedCounselorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `counselor_id=eq.${selectedCounselorId}` },
        (payload) => {
          const nextRow = (payload.new ?? {}) as Record<string, unknown>;
          const previousRow = (payload.old ?? {}) as Record<string, unknown>;
          const nextStatus = nextRow.status as string | undefined;
          const previousStatus = previousRow.status as string | undefined;

          if (nextStatus !== previousStatus || payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            void invalidateAvailability(selectedCounselorId);
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
        { event: "*", schema: "public", table: "availability", filter: `counselor_id=eq.${selectedCounselorId}` },
        () => {
          void invalidateAvailability(selectedCounselorId);
          setSlots([]);
          setScheduleSummary(undefined);
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [selectedCounselorId, selectedDate, invalidateAvailability]);

  const selectedCounselor = counselors.find((c) => c.counselor_id === selectedCounselorId);

  function prefetchCounselorAvailability(counselorId: string) {
    void queryClient.prefetchQuery(
      availabilityForMonthQueryOptions(counselorId, viewMonth),
    );
  }

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

    setError("");
    setSuccess("");
    setIsRedirectingAfterConfirm(true);

    try {
      await saveAppointment({
        appointmentId: initialAppointment?.appointment_id,
        counselorId: selectedCounselorId,
        appointmentDate: formatDateOnly(selectedDate),
        appointmentTime: selectedTime,
        reason: reason.trim(),
        mode: sessionMode,
      });

      setSuccess(initialAppointment ? "Your appointment has been updated!" : "Your session has been successfully requested!");
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(initialAppointment ? `/appointments/${initialAppointment.appointment_id}` : "/dashboard");
      }, 2000);
    } catch (err) {
      setIsRedirectingAfterConfirm(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="relative">
      <LoaderAnimations />
      {showConfirmEnvelope ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-6"
          style={{
            background: "color-mix(in srgb, var(--md-sys-color-surface) 78%, transparent)",
            backdropFilter: "blur(4px)",
          }}
        >
          <EnvelopeLoader
            message={initialAppointment ? LOADING_MESSAGES.booking.update : LOADING_MESSAGES.booking.submit}
            className="flex min-h-svh items-center justify-center"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-10">
          {!selectedCounselorId ? (
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-6">Choose a Counselor</h3>
              {isLoadingCounselors ? (
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading counselors...</p>
              ) : counselorsLoadError ? (
                <Md3Message tone="error">
                  {counselorsLoadError instanceof Error
                    ? counselorsLoadError.message
                    : "Unable to load counselors right now."}
                </Md3Message>
              ) : (
                <div className="grid gap-4">
                  {counselors.map((c) => (
                    <button
                      key={c.counselor_id}
                      onClick={() => setSelectedCounselorId(c.counselor_id)}
                      onMouseEnter={() => prefetchCounselorAvailability(c.counselor_id)}
                      onFocus={() => prefetchCounselorAvailability(c.counselor_id)}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-all text-left"
                    >
                      <div className="relative w-12 h-12 rounded-full shrink-0 overflow-hidden border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)]">
                        {c.avatar_url ? (
                          <Image src={c.avatar_url} alt={c.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)] opacity-60" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--md-sys-color-on-surface)]">{c.name}</p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{c.specialization}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {selectedCounselor && (
                <CounselorProfileCard counselor={selectedCounselor} onSwitchCounselor={handleSwitchCounselor} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Select Date</h3>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label="Previous month" className="w-8 h-8 rounded-full" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Next month" className="w-8 h-8 rounded-full" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>
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
                      Schedule: {scheduleSummary.start_time}-{scheduleSummary.end_time}{" "}
                      ({scheduleSummary.slot_duration_minutes} min slots)
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

              <SessionFormatSelection selectedMode={sessionMode} onSelect={setSessionMode} />

              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">State your concern</h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Tell ${selectedCounselor?.name.split(" ")[0] || "us"} what's on your mind...`}
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
          isSubmitting={isSaving || isRedirectingAfterConfirm}
          confirmLabel={initialAppointment ? "Save Changes" : "Confirm Session"}
        />
      </div>
    </div>
  );
}
