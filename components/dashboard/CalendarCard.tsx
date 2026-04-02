"use client";

import * as React from "react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Calendar } from "@/components/ui/calendar";
import { AppointmentDTO } from "@/lib/booking/contracts";

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type CalendarCardProps = {
  appointments?: AppointmentDTO[];
};

export default function CalendarCard({ appointments = [] }: CalendarCardProps) {
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const bookedDates = React.useMemo(() => {
    const unique = new Set(appointments.map((appointment) => appointment.appointment_date));
    return Array.from(unique).map((value) => new Date(`${value}T00:00:00`));
  }, [appointments]);

  const selectedDayAppointments = React.useMemo(() => {
    if (!date) return [];
    const selected = formatDateOnly(date);
    return appointments.filter((appointment) => appointment.appointment_date === selected);
  }, [appointments, date]);

  return (
    <DashboardCard title="Calendar">
      <div className="w-full grid gap-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={{ booked: bookedDates }}
          modifiersClassNames={{
            booked:
              "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-full",
          }}
          className="w-full rounded-lg p-2"
          style={{ border: "1px solid var(--md-sys-color-outline-variant)" }}
        />

        {date ? (
          <div className="grid gap-2">
            <p
              className="text-xs font-medium"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
              Appointments on {formatDateOnly(date)}
            </p>

            {selectedDayAppointments.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                No appointments for this date.
              </p>
            ) : (
              <div className="grid gap-2">
                {selectedDayAppointments.map((appointment) => (
                  <article
                    key={appointment.appointment_id}
                    className="rounded-md border p-2"
                    style={{
                      borderColor: "var(--md-sys-color-outline-variant)",
                      background: "var(--md-sys-color-surface-container-low)",
                    }}
                  >
                    <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface)" }}>
                      {appointment.appointment_time} • {appointment.status}
                    </p>
                    <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      {appointment.reason || "No reason provided"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
