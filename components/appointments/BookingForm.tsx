"use client";

import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Appointment,
  AppointmentStatus,
  Counselor,
  SessionNote,
  SessionType,
} from "@/lib/entities";
import {
  placeholderCounselors,
  saveAppointmentPlaceholder,
} from "@/lib/placeholders/booking";

type BookingFormProps = {
  className?: string;
  defaultStudentId?: string;
  counselors?: Counselor[];
  onConfirm?: (appointment: Appointment, note?: SessionNote) => void;
};

const timeSlots = [
  { label: "9 AM", value: "09:00" },
  { label: "10 AM", value: "10:00" },
  { label: "2 PM", value: "14:00" },
  { label: "3 PM", value: "15:00" },
] as const;

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingForm({
  className,
  defaultStudentId = "student-local",
  counselors,
  onConfirm,
}: BookingFormProps) {
  const [availableCounselors, setAvailableCounselors] = React.useState<Counselor[]>(
    counselors ?? placeholderCounselors,
  );
  const [counselorId, setCounselorId] = React.useState("");
  const [sessionType, setSessionType] = React.useState<SessionType>(SessionType.IN_PERSON);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = React.useState("");
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [additionalNotes, setAdditionalNotes] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setAvailableCounselors(counselors?.length ? counselors : placeholderCounselors);
  }, [counselors]);

  const isValid = Boolean(counselorId && sessionType && selectedDate && selectedTime);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValid || !selectedDate) {
      setError("Please select counselor, session type, date, and time.");
      return;
    }

    const appointmentId = crypto.randomUUID();

    const appointment = new Appointment({
      appointment_id: appointmentId,
      student_id: defaultStudentId,
      counselor_id: counselorId,
      appointment_date: formatDateOnly(selectedDate),
      appointment_time: selectedTime,
      mode: sessionType,
      reason: additionalNotes.trim(),
      status: AppointmentStatus.PENDING,
    });

    const noteText = additionalNotes.trim();
    const note = noteText
      ? new SessionNote({
          note_id: crypto.randomUUID(),
          appointment_id: appointmentId,
          counselor_id: counselorId,
          note_content: noteText,
        })
      : undefined;

    onConfirm?.(appointment, note);

    setIsSaving(true);
      const saveResult = await saveAppointmentPlaceholder(appointment, note); // taken from lib/placeholders/booking , removed
    setIsSaving(false);

    const selectedCounselor = availableCounselors.find(
      (item) => item.counselor_id === counselorId,
    );

    setSuccess(
      [
        `Counselor: ${selectedCounselor?.name ?? counselorId}`,
        `Session Type: ${sessionType}`,
        `Date: ${appointment.appointment_date}`,
        `Time: ${appointment.appointment_time}`,
        `Additional Notes: ${noteText || "None"}`,
      ].join(" | "),
    );
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
            {availableCounselors.map((counselor) => (
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
            value={sessionType}
            onChange={(event) => setSessionType(event.target.value as SessionType)}
            className="h-9 w-full rounded-md border px-3 text-sm border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            required
          >
            <option value={SessionType.IN_PERSON}>in_person</option>
            <option value={SessionType.ONLINE}>online</option>
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
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedTime(slot.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm border-[var(--md-sys-color-outline-variant)]",
                    selectedTime === slot.value
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)] text-white"
                      : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]",
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="additional-notes"
          className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]"
        >
          Additional notes
        </label>
        <textarea
          id="additional-notes"
          value={additionalNotes}
          onChange={(event) => setAdditionalNotes(event.target.value)}
          placeholder="Add context for the counselor"
          className="min-h-24 w-full rounded-md border px-3 py-2 text-sm border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
        />
      </div>

      {(error || success) && (
        <p
          className={cn(
            "text-sm whitespace-pre-wrap",
            error ? "text-red-600" : "text-green-600",
          )}
        >
          {error || success}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}
