"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { TruncatedText } from "@/components/ui/truncated-text";
import { AppointmentDTO } from "@/lib/booking/contracts";

type AppointmentSection = {
  title: string;
  appointments: AppointmentDTO[];
  emptyMessage: string;
  headerAction?: ReactNode;
  renderActions?: (appointment: AppointmentDTO) => ReactNode;
  getParticipantName?: (appointment: AppointmentDTO) => string | undefined;
  participantNameFallback?: string;
};

function formatDisplayTime(rawTime: string) {
  const [rawHour = "0", rawMinute = "00"] = rawTime.split(":");
  const hour24 = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return rawTime;
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function getDefaultHeaderAction(section: AppointmentSection) {
  if (section.title !== "Upcoming Appointments") {
    return null;
  }

  return (
    <Button asChild variant="link" className="text-[var(--md-sys-color-primary)] font-medium p-0 h-auto">
      <Link href="/appointments">View Appointments</Link>
    </Button>
  );
}

function AppointmentItem({
  appointment,
  renderActions,
  getParticipantName,
  participantNameFallback,
}: {
  appointment: AppointmentDTO;
  renderActions?: (appointment: AppointmentDTO) => ReactNode;
  getParticipantName?: (appointment: AppointmentDTO) => string | undefined;
  participantNameFallback?: string;
}) {
  const date = new Date(`${appointment.appointment_date}T00:00:00Z`);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate().toString().padStart(2, "0");
  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const participantName = getParticipantName?.(appointment) || participantNameFallback;
  const displayTime = formatDisplayTime(appointment.appointment_time);

  const colorClass =
    appointment.status === "approved"
      ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
      : "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]";

  return (
    <div
      className="w-full min-w-0 max-w-full rounded-3xl p-5 flex items-center gap-6 overflow-hidden break-words"
      style={{
        background: "var(--md-sys-color-surface)",
        border: "1px solid var(--md-sys-color-outline-variant)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
    >
      <div className={`${colorClass} w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0`}>
        <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">{month}</span>
        <span className="text-3xl font-medium">{day}</span>
      </div>

      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
        {participantName ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-primary)] mb-0.5">
            {participantName}
          </p>
        ) : null}
        <div className="mb-0 min-w-0 max-w-full overflow-hidden">
          <TruncatedText
            text={appointment.reason_preview || appointment.reason || "Session"}
            lines={1}
            className="block w-full min-w-0 overflow-hidden break-words whitespace-normal text-lg font-medium text-[var(--md-sys-color-on-surface)]"
          />
        </div>
        <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
          {appointment.mode === "online" ? "Online Session" : "In-Person"} •{" "}
          <span className="text-[var(--md-sys-color-primary)] font-medium">{displayTime}</span>
        </p>
      </div>

      {renderActions ? (
        <div className="flex items-center gap-2">{renderActions(appointment)}</div>
      ) : (
        <Button asChild variant="ghost" size="icon" className="text-[var(--md-sys-color-on-surface-variant)]">
          <Link href={detailsHref} aria-label="Open appointment details">
            <MoreVertical className="w-6 h-6" />
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function AppointmentsSections({ sections }: { sections: AppointmentSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-[var(--md-sys-color-on-surface)]">{section.title}</h2>
            {section.headerAction ?? getDefaultHeaderAction(section)}
          </div>

          <div className="flex flex-col gap-3">
            {section.appointments.length > 0 ? (
              section.appointments.map((appointment) => (
                <AppointmentItem
                  key={appointment.appointment_id}
                  appointment={appointment}
                  renderActions={section.renderActions}
                  getParticipantName={section.getParticipantName}
                  participantNameFallback={section.participantNameFallback}
                />
              ))
            ) : (
              <p className="text-[var(--md-sys-color-on-surface-variant)] text-center py-5">{section.emptyMessage}</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}