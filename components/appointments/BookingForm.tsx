"use client";

import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Md3Message } from "@/components/ui/md3-message";
import { cn } from "@/lib/utils";
import { CounselorDirectoryItemDTO, SessionMode } from "@/lib/booking/contracts";

type BookingFormProps = {
  className?: string;
  studentId: string;
};

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${minuteStr} ${suffix}`;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingForm({ className, studentId }: BookingFormProps) {
  const [counselors, setCounselors] = React.useState<CounselorDirectoryItemDTO[]>([]);
  const [counselorId, setCounselorId] = React.useState("");
  const [sessionMode, setSessionMode] = React.useState<SessionMode>("in_person");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = React.useState("");
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [availableTimes, setAvailableTimes] = React.useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [slotsError, setSlotsError] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/counselors")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: CounselorDirectoryItemDTO[]) => {
        if (isMounted) setCounselors(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!counselorId || !selectedDate) {
      setAvailableTimes([]);
      setSlotsError("");
      return;
    }

    setSlotsLoading(true);
    setSlotsError("");
    const date = formatDateOnly(selectedDate);
    fetch(`/api/availability?counselor_id=${counselorId}&date=${date}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((slots: { appointment_time: string; available: boolean }[]) => {
        setAvailableTimes(
          slots.filter((slot) => slot.available).map((slot) => slot.appointment_time),
        );
        setSlotsLoading(false);
      })
      .catch(() => {
        setAvailableTimes([]);
        setSlotsError("Could not load availability. Please try again.");
        setSlotsLoading(false);
      });
  }, [counselorId, selectedDate]);

  const isValid = Boolean(counselorId && sessionMode && selectedDate && selectedTime);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValid || !selectedDate) {
      setError("Please select counselor, session type, date, and time.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        counselor_id: counselorId,
        appointment_date: formatDateOnly(selectedDate),
        appointment_time: selectedTime,
        reason: reason.trim(),
        mode: sessionMode,
      }),
    });
    setIsSaving(false);

    if (!response.ok) {
      setError("Failed to submit booking. Please try again.");
      return;
    }

    const selectedCounselor = counselors.find((c) => c.counselor_id === counselorId);
    setSuccess(
      [
        `Counselor: ${selectedCounselor?.name ?? counselorId}`,
        `Session Type: ${sessionMode}`,
        `Date: ${formatDateOnly(selectedDate)}`,
        `Time: ${selectedTime}`,
        `Reason: ${reason.trim() || "None"}`,
      ].join(" | "),
    );
    setCounselorId("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setReason("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("grid gap-5 text-[var(--md-sys-color-on-surface)]", className)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor="counselor"
            className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]"
          >
            Select Counselor
          </label>
          <select
            id="counselor"
            value={counselorId}
            onChange={(event) => setCounselorId(event.target.value)}
            className="h-9 w-full rounded-md border px-3 text-sm border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            required
          >
            <option value="">Select Counselor</option>
            {counselors.map((counselor) => (
              <option key={counselor.counselor_id} value={counselor.counselor_id}>
                {counselor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="session-type"
            className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]"
          >
            Session Type
          </label>
          <select
            id="session-type"
            value={sessionMode}
            onChange={(event) => setSessionMode(event.target.value as SessionMode)}
            className="h-9 w-full rounded-md border px-3 text-sm border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            required
          >
            <option value="in_person">in_person</option>
            <option value="online">online</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border p-3 border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Select date</p>

            <div className="mb-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                aria-label="Previous month"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                  )
                }
              >
                {"<"}
              </Button>

              <div className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                {currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                aria-label="Next month"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                  )
                }
              >
                {">"}
              </Button>
            </div>

            <Calendar
              mode="single"
              month={currentMonth}
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date ?? undefined)}
              onMonthChange={(month) => setCurrentMonth(month)}
              className="w-full rounded-md border"
            />
          </div>

          <div className="grid content-start gap-2">
            <p className="text-sm font-medium">Select time</p>
            <div className="grid grid-cols-2 gap-2">
              {!counselorId || !selectedDate ? (
                <p className="col-span-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Select a counselor and date first.
                </p>
              ) : slotsLoading ? (
                <p className="col-span-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Loading times…
                </p>
              ) : slotsError ? (
                <Md3Message tone="error" className="col-span-2 text-xs">
                  {slotsError}
                </Md3Message>
              ) : availableTimes.length === 0 ? (
                <p className="col-span-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No available times for this date.
                </p>
              ) : (
                availableTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm border-[var(--md-sys-color-outline-variant)]",
                      selectedTime === time
                        ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                        : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]",
                    )}
                  >
                    {formatTime(time)}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="reason"
          className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]"
        >
          Reason
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Add context for the counselor"
          className="min-h-24 w-full rounded-md border px-3 py-2 text-sm border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
        />
      </div>

      {error ? (
        <Md3Message tone="error" className="whitespace-pre-wrap">
          {error}
        </Md3Message>
      ) : null}

      {!error && success ? (
        <Md3Message tone="success" className="whitespace-pre-wrap">
          {success}
        </Md3Message>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}
