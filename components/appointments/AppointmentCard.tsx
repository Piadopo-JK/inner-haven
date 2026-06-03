"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock, MoreVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AppointmentDTO, AvailabilityEmptyState, AvailabilitySlotDTO } from "@/lib/booking/contracts";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { appointmentDetailsQueryOptions } from "@/lib/query/queries";
import { TruncatedText } from "@/components/ui/truncated-text";
import AvailableSlotsGrid from "@/components/appointments/AvailableSlotsGrid";
import { useAvailabilityForMonth } from "@/lib/query/hooks/useAvailability";
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
  onCompleteAppointment?: (appointment: AppointmentDTO) => Promise<void>;
  onRescheduleAppointment?: (appointmentId: string, date: string, time: string) => Promise<void>;
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
  onCompleteAppointment,
  onRescheduleAppointment,
}: AppointmentCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "approve" | "complete" | null>(null);
  const menuActionRef = useRef(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(appointment.appointment_date);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleViewMonth, setRescheduleViewMonth] = useState(() => {
    const d = new Date(appointment.appointment_date + "T00:00:00");
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });

  // Fetch availability for the selected date
  const { data: availabilityWindow, isLoading: isLoadingSlots } = useAvailabilityForMonth(
    appointment.counselor_id,
    rescheduleViewMonth,
  );

  const daySlots: AvailabilitySlotDTO[] = useMemo(() => {
    if (!availabilityWindow?.by_date) return [];
    const dayData = availabilityWindow.by_date[rescheduleDate];
    return dayData?.slots ?? [];
  }, [availabilityWindow, rescheduleDate]);

  const slotsEmptyState: AvailabilityEmptyState = useMemo(() => {
    if (!availabilityWindow?.by_date) return "available";
    const dayData = availabilityWindow.by_date[rescheduleDate];
    return dayData?.empty_state ?? "available";
  }, [availabilityWindow, rescheduleDate]);

  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const editHref = `/appointments/${appointment.appointment_id}/edit`;
  const notesHref = `/appointments/${appointment.appointment_id}/notes`;
  const displayTime = formatDisplayTime(appointment.appointment_time);

  const canCancel =
    appointment.status === "pending" || appointment.status === "approved";
  const canApprove = role === "counselor" && appointment.status === "pending";
  const canReschedule = role === "counselor" && appointment.status === "pending";
  const canComplete = role === "counselor" && appointment.status === "approved";
  const canJoinOnline = appointment.mode === "online" && appointment.status === "approved" && Boolean(appointment.meeting_link);
  const canEdit = role === "student" && appointment.status === "pending";
  const canViewNotes = (role === "counselor" && (appointment.status === "approved" || appointment.status === "completed"))
    || (role === "student" && appointment.status === "completed");
  const showMenu = !["cancelled", "expired"].includes(appointment.status);
  const isInert = appointment.status === "cancelled" || appointment.status === "expired";
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
      setConfirmAction(null);
    }
  }

  async function handleApprove() {
    if (!onApproveAppointment) return;
    setIsCancelling(true);
    try {
      await onApproveAppointment(appointment);
    } finally {
      setIsCancelling(false);
      setConfirmAction(null);
    }
  }

  async function handleComplete() {
    if (!onCompleteAppointment) return;
    setIsCancelling(true);
    try {
      await onCompleteAppointment(appointment);
    } finally {
      setIsCancelling(false);
      setConfirmAction(null);
    }
  }

  async function handleRescheduleSubmit() {
    if (!onRescheduleAppointment || !rescheduleDate || !rescheduleTime) return;
    setIsCancelling(true);
    try {
      await onRescheduleAppointment(appointment.appointment_id, rescheduleDate, rescheduleTime);
      setIsRescheduleOpen(false);
    } finally {
      setIsCancelling(false);
    }
  }

  function openReschedule() {
    const d = new Date(appointment.appointment_date + "T00:00:00");
    setRescheduleDate(appointment.appointment_date);
    setRescheduleViewMonth(Number.isNaN(d.getTime()) ? new Date() : d);
    setRescheduleTime("");
    setIsRescheduleOpen(true);
  }

  function prefetchAppointmentDetails() {
    void queryClient.prefetchQuery(
      appointmentDetailsQueryOptions(appointment.appointment_id),
    );
  }

  return (
    <Card
      className={`w-full min-w-0 max-w-full p-6 rounded-[24px] overflow-hidden break-words transition-all duration-200 ${isInert ? "" : "cursor-pointer"}`}
      style={{
        border: "1px solid var(--md-sys-color-outline-variant)",
        background: "var(--md-sys-color-surface)",
        boxShadow: "var(--md-sys-elevation-level1)",
        ...(isInert ? { opacity: 0.75 } : {}),
      }}
      role={isInert ? undefined : "link"}
      tabIndex={isInert ? undefined : 0}
      onMouseEnter={isInert ? undefined : (e) => {
        prefetchAppointmentDetails();
        const el = e.currentTarget;
        el.style.borderColor = "var(--md-sys-color-primary)";
        el.style.boxShadow = "var(--md-sys-elevation-level3)";
      }}
      onMouseLeave={isInert ? undefined : (e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--md-sys-color-outline-variant)";
        el.style.boxShadow = "var(--md-sys-elevation-level1)";
      }}
      onClick={isInert ? undefined : (event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-no-card-nav='true']") || menuActionRef.current) {
          menuActionRef.current = false;
          return;
        }
        router.push(detailsHref);
      }}
      onKeyDown={isInert ? undefined : (event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-no-card-nav='true']") || menuActionRef.current) {
          menuActionRef.current = false;
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(detailsHref);
        }
      }}
    >
      <div className="flex items-start justify-between min-w-0 gap-3">
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
            className="shrink-0 mt-1"
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
                  onSelect={() => { menuActionRef.current = true; setConfirmAction("approve"); }}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Updating..." : "Accept Appointment"}
                </DropdownMenuItem>
              ) : null}
              {canReschedule ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => { menuActionRef.current = true; openReschedule(); }}
                  disabled={isCancelling}
                >
                  Reschedule
                </DropdownMenuItem>
              ) : null}
              {canComplete ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => { menuActionRef.current = true; setConfirmAction("complete"); }}
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
                  onSelect={() => { menuActionRef.current = true; setConfirmAction("cancel"); }}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Cancel Appointment"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        ) : null}

        {isRescheduleOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setIsRescheduleOpen(false)}
            />
            <div
              data-no-card-nav="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setIsRescheduleOpen(false); }}
            >
              <div
                className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
                style={{
                  borderColor: "var(--md-sys-color-outline-variant)",
                  background: "var(--md-sys-color-surface-container-high)",
                }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  Reschedule Appointment
                </h3>

                <div
                  className="rounded-2xl border p-4 mb-4"
                  style={{
                    borderColor: "var(--md-sys-color-outline-variant)",
                    background: "var(--md-sys-color-surface-container-lowest)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Select Date
                    </p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Previous month"
                        className="w-8 h-8 rounded-full"
                        onClick={() => setRescheduleViewMonth(new Date(rescheduleViewMonth.getFullYear(), rescheduleViewMonth.getMonth() - 1, 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Next month"
                        className="w-8 h-8 rounded-full"
                        onClick={() => setRescheduleViewMonth(new Date(rescheduleViewMonth.getFullYear(), rescheduleViewMonth.getMonth() + 1, 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CalendarPicker
                    mode="single"
                    selected={(() => { const d = new Date(rescheduleDate + "T00:00:00"); return Number.isNaN(d.getTime()) ? undefined : d; })()}
                    onSelect={(day) => {
                      if (day) {
                        const y = day.getFullYear();
                        const m = String(day.getMonth() + 1).padStart(2, "0");
                        const d = String(day.getDate()).padStart(2, "0");
                        setRescheduleDate(`${y}-${m}-${d}`);
                        setRescheduleTime("");
                      }
                    }}
                    month={rescheduleViewMonth}
                    onMonthChange={setRescheduleViewMonth}
                  />
                </div>

                <AvailableSlotsGrid
                  slots={daySlots}
                  selectedSlot={rescheduleTime}
                  onSelect={setRescheduleTime}
                  isLoading={isLoadingSlots}
                  emptyState={slotsEmptyState}
                  selectedDate={rescheduleDate}
                />

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRescheduleOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRescheduleSubmit}
                    disabled={isCancelling || !rescheduleDate || !rescheduleTime}
                    size="sm"
                    className="rounded-xl"
                    style={{
                      background: "var(--md-sys-color-primary)",
                      color: "var(--md-sys-color-on-primary)",
                    }}
                  >
                    {isCancelling ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {confirmAction && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => setConfirmAction(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}>
              <div
                className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-xl"
                style={{
                  borderColor: "var(--md-sys-color-outline-variant)",
                  background: "var(--md-sys-color-surface-container-high)",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  {confirmAction === "cancel"
                    ? "Cancel this appointment?"
                    : confirmAction === "approve"
                    ? "Accept this appointment?"
                    : "Mark this appointment as complete?"}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {confirmAction === "cancel"
                    ? "This action cannot be undone."
                    : confirmAction === "approve"
                    ? "The student will be notified."
                    : "The session will be marked as finished."}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)} className="rounded-xl">Back</Button>
                  <Button
                    size="sm"
                    onClick={confirmAction === "cancel" ? handleCancel : confirmAction === "approve" ? handleApprove : handleComplete}
                    className="rounded-xl"
                    style={confirmAction === "cancel"
                      ? { background: "var(--md-sys-color-error)", color: "var(--md-sys-color-on-error)" }
                      : { background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
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
