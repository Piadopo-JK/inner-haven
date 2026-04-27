"use client";

import { Calendar, Clock, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cancelStudentAppointmentAction } from "@/app/actions/appointments";
import { AppointmentDTO } from "@/lib/booking/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function AppointmentCard({
  appointment,
  role,
  participantName,
  participantAvatar,
}: AppointmentCardProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const editHref = `/appointments/${appointment.appointment_id}/edit`;
  const displayTime = formatDisplayTime(appointment.appointment_time);

  const canCancel =
    appointment.status === "pending" || appointment.status === "approved";
  const canEdit = role === "student" && appointment.status === "pending";

  const date = new Date(appointment.appointment_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await cancelStudentAppointmentAction(appointment.appointment_id);
      router.refresh();
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Card className="w-full min-w-0 max-w-full p-6 rounded-[24px] border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-sm hover:shadow-md transition-shadow overflow-hidden break-words">
      <div className="flex items-start justify-between min-w-0">
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
          </div>
        </div>

        <DropdownMenu>
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
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={detailsHref}>View Details</Link>
            </DropdownMenuItem>
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
