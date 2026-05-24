"use client";

import { Calendar, Clock, MoreVertical } from "lucide-react";
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
}: AppointmentCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);

  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const editHref = `/appointments/${appointment.appointment_id}/edit`;
  const displayTime = formatDisplayTime(appointment.appointment_time);

  const canCancel =
    appointment.status === "pending" || appointment.status === "approved";
  const canApprove = role === "counselor" && appointment.status === "pending";
  const canJoinOnline = appointment.mode === "online" && Boolean(appointment.meeting_link);
  const canEdit = role === "student" && appointment.status === "pending";
  const showMenu = !["completed", "cancelled", "expired"].includes(appointment.status);
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

  function prefetchAppointmentDetails() {
    void queryClient.prefetchQuery(
      appointmentDetailsQueryOptions(appointment.appointment_id),
    );
  }

  return (
    <Card
      className="w-full min-w-0 max-w-full p-6 rounded-[24px] border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-sm hover:shadow-md transition-shadow overflow-hidden break-words cursor-pointer"
      role="link"
      tabIndex={0}
      onMouseEnter={prefetchAppointmentDetails}
      onFocus={prefetchAppointmentDetails}
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
          <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center shrink-0 overflow-hidden">
            {participantAvatar ? (
              <img src={participantAvatar} alt={participantName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-2xl font-bold text-[var(--md-sys-color-on-surface-variant)]">
                {participantName?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0 max-w-full">
            <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {participantName || "Unknown User"}
            </h3>
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
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
