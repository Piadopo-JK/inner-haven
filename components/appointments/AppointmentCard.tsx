"use client";

import { Calendar, Clock, MoreVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AppointmentDTO } from "@/lib/booking/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { appointmentDetailsQueryOptions } from "@/lib/query/queries";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentCardProps {
  appointment: AppointmentDTO;
  role: "student" | "counselor";
  participantName?: string;
  participantAvatar?: string;
  onCancelAppointment?: (appointment: AppointmentDTO) => Promise<void>;
  onApproveAppointment?: (appointment: AppointmentDTO) => Promise<void>;
  onDeclineAppointment?: (appointment: AppointmentDTO) => Promise<void>;
  onCompleteAppointment?: (appointment: AppointmentDTO) => Promise<void>;
}

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

function getStatusRibbon(appointment: AppointmentDTO, todayIso: string) {
  const isRescheduled =
    appointment.updated_at &&
    appointment.created_at &&
    new Date(appointment.updated_at).getTime() - new Date(appointment.created_at).getTime() > 60_000;

  if (appointment.status === "cancelled") {
    return {
      label: "Cancelled",
      className:
        "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]",
    };
  }

  if (appointment.status === "expired") {
    return {
      label: "Expired",
      className:
        "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]",
    };
  }

  if (appointment.status === "completed") {
    return {
      label: "Completed",
      className:
        "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
    };
  }

  if (appointment.status === "approved" && appointment.appointment_date >= todayIso && isRescheduled) {
    return {
      label: "Rescheduled",
      className:
        "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]",
    };
  }

  return null;
}

export default function AppointmentCard({
  appointment,
  role,
  participantName,
  participantAvatar,
  onCancelAppointment,
  onApproveAppointment,
  onDeclineAppointment,
  onCompleteAppointment,
}: AppointmentCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);

  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const editHref = `/appointments/${appointment.appointment_id}/edit`;
  const notesHref = `/appointments/${appointment.appointment_id}/notes`;
  const displayTime = formatDisplayTime(appointment.appointment_time);

  const canCancel =
    appointment.status === "pending" || appointment.status === "approved";
  const canApprove = role === "counselor" && appointment.status === "pending";
  const canDecline = role === "counselor" && appointment.status === "pending";
  const canComplete = role === "counselor" && appointment.status === "approved";
  const canJoinOnline = appointment.mode === "online" && appointment.status === "approved" && Boolean(appointment.meeting_link);
  const canEdit = role === "student" && appointment.status === "pending";
  const canViewNotes = (role === "counselor" && (appointment.status === "approved" || appointment.status === "completed"))
    || (role === "student" && appointment.status === "completed");
  const showMenu = !["cancelled", "expired"].includes(appointment.status);
  const todayIso = new Date().toISOString().split("T")[0];
  const ribbon = getStatusRibbon(appointment, todayIso);

  const date = new Date(appointment.appointment_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleCancel() {
    if (!onCancelAppointment) return;
    setIsCancelling(true);
    try {
      await onCancelAppointment(appointment);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleApprove() {
    if (!onApproveAppointment) return;
    setIsCancelling(true);
    try {
      await onApproveAppointment(appointment);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleDecline() {
    if (!onDeclineAppointment) return;
    setIsCancelling(true);
    try {
      await onDeclineAppointment(appointment);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleComplete() {
    if (!onCompleteAppointment) return;
    setIsCancelling(true);
    try {
      await onCompleteAppointment(appointment);
    } finally {
      setIsCancelling(false);
    }
  }

  function prefetchAppointmentDetails() {
    void queryClient.prefetchQuery(
      appointmentDetailsQueryOptions(appointment.appointment_id),
    );
  }

  return (
    <Card
      className="w-full min-w-0 max-w-full p-6 rounded-[24px] cursor-pointer overflow-hidden break-words transition-all duration-200"
      style={{
        border: "1px solid var(--md-sys-color-outline-variant)",
        background: "var(--md-sys-color-surface)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
      role="link"
      tabIndex={0}
      onMouseEnter={(e) => {
        prefetchAppointmentDetails();
        const el = e.currentTarget;
        el.style.borderColor = "var(--md-sys-color-primary)";
        el.style.boxShadow = "var(--md-sys-elevation-level3)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--md-sys-color-outline-variant)";
        el.style.boxShadow = "var(--md-sys-elevation-level1)";
      }}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-no-card-nav='true']")) {
          return;
        }
        router.push(detailsHref);
      }}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-no-card-nav='true']")) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(detailsHref);
        }
      }}
    >
      <div className="flex items-center justify-between min-w-0 gap-3">
        <div className="flex gap-4 min-w-0 flex-1">
          <div className="relative w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center shrink-0 overflow-hidden">
            {participantAvatar ? (
              <Image src={participantAvatar!} alt={participantName ?? "Participant"} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="text-2xl font-bold text-[var(--md-sys-color-on-surface-variant)]">
                {participantName?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0 max-w-full">
            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {participantName || "Unknown User"}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--md-sys-color-on-surface-variant)] font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{displayTime}</span>
              </div>
            </div>
            {ribbon ? (
              <span
                className={`mt-1 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${ribbon.className}`}
              >
                {ribbon.label}
              </span>
            ) : null}
          </div>
        </div>

        {showMenu ? (
          <div
            data-no-card-nav="true"
            className="self-center shrink-0"
            onClick={(event) => event.stopPropagation()}
          >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Appointment actions"
                className="text-[var(--md-sys-color-on-surface-variant)] rounded-full h-10 w-10"
                disabled={isCancelling}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {canJoinOnline ? (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a href={appointment.meeting_link} target="_blank" rel="noreferrer">
                    Join Session Now
                  </a>
                </DropdownMenuItem>
              ) : null}
              {canApprove ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleApprove}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Updating..." : "Accept Appointment"}
                </DropdownMenuItem>
              ) : null}
              {canDecline ? (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={editHref}>Reschedule</Link>
                </DropdownMenuItem>
              ) : null}
              {canComplete ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleComplete}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Updating..." : "Mark Complete"}
                </DropdownMenuItem>
              ) : null}
              {canViewNotes ? (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={notesHref}>Session Notes</Link>
                </DropdownMenuItem>
              ) : null}
              {canEdit ? (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={editHref}>Edit Appointment</Link>
                </DropdownMenuItem>
              ) : null}
              {canCancel ? (
                <DropdownMenuItem
                  className="cursor-pointer text-[var(--md-sys-color-error)]"
                  onSelect={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Cancel Appointment"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        ) : null}
      </div>

      {appointment.reason ? (
        <div className="mt-6 p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] min-w-0 w-full max-w-full overflow-hidden">
          <TruncatedText
            text={appointment.reason_preview || appointment.reason}
            lines={2}
            italic
            className="block min-w-0 w-full max-w-full overflow-hidden break-words text-[var(--md-sys-color-on-surface)]"
          />
        </div>
      ) : null}
    </Card>
  );
}
