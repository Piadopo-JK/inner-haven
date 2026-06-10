"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import AvailableSlotsGrid from "@/components/appointments/AvailableSlotsGrid";
import { Md3Message } from "@/components/ui/md3-message";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentDTO, AvailabilityEmptyState, AvailabilitySlotDTO, StudentDirectoryItemDTO, isConfirmed } from "@/lib/booking/contracts";
import {
  type CounselorDashboardAppointments,
  useAppointments,
  useAppointmentsRealtimeSync,
  useRescheduleCounselorAppointment,
  useUpdateCounselorAppointmentStatus,
  selectCounselorDashboardAppointments,
} from "@/lib/query/hooks/useAppointments";
import { useAvailabilityForMonth } from "@/lib/query/hooks/useAvailability";

const EMPTY_COUNSELOR_DASHBOARD_APPOINTMENTS: CounselorDashboardAppointments = {
  approvedUpcoming: [],
  pendingApproval: [],
  pendingCount: 0,
  todayPending: 0,
  todayScheduled: 0,
  completedCount: 0,
  upcomingApprovedCount: 0,
  nextSession: undefined,
};

function AppointmentActions({
  appointment,
  onAction,
  onReschedule,
  isBusy,
}: {
  appointment: AppointmentDTO;
  onAction: (appointmentId: string, status: "approved" | "cancelled" | "completed") => Promise<void>;
  onReschedule: (appointmentId: string, date: string, time: string) => Promise<void>;
  isBusy: boolean;
}) {
  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const notesHref = `/appointments/${appointment.appointment_id}/notes`;
  const canJoinOnline = appointment.mode === "online" && isConfirmed(appointment.status) && Boolean(appointment.meeting_link);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(appointment.appointment_date);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleViewMonth, setRescheduleViewMonth] = useState(() => {
    const d = new Date(appointment.appointment_date + "T00:00:00");
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "cancel" | "complete" | null>(null);

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

  async function handleRescheduleSubmit() {
    if (!rescheduleDate || !rescheduleTime) return;
    setIsRescheduling(true);
    try {
      await onReschedule(appointment.appointment_id, rescheduleDate, rescheduleTime);
      setIsRescheduleOpen(false);
    } finally {
      setIsRescheduling(false);
    }
  }

  function openReschedule() {
    const d = new Date(appointment.appointment_date + "T00:00:00");
    setRescheduleDate(appointment.appointment_date);
    setRescheduleViewMonth(Number.isNaN(d.getTime()) ? new Date() : d);
    setRescheduleTime("");
    setIsRescheduleOpen(true);
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    const action = confirmAction;
    const status = action === "approve" ? "approved" as const : action === "cancel" ? "cancelled" as const : "completed" as const;
    await onAction(appointment.appointment_id, status);
    setConfirmAction(null);
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Appointment actions" className="text-[var(--md-sys-color-on-surface-variant)] rounded-full h-10 w-10" disabled={isBusy}>
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

          {appointment.status === "pending" ? (
            <DropdownMenuItem className="cursor-pointer" onSelect={() => setConfirmAction("approve")} disabled={isBusy}>
              {isBusy ? "Updating..." : "Accept Appointment"}
            </DropdownMenuItem>
          ) : null}

          {appointment.status === "pending" ? (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={openReschedule}
              disabled={isBusy}
            >
              Reschedule
            </DropdownMenuItem>
          ) : null}

          {isConfirmed(appointment.status) ? (
            <DropdownMenuItem className="cursor-pointer" onSelect={() => setConfirmAction("complete")} disabled={isBusy}>
              {isBusy ? "Updating..." : "Mark Complete"}
            </DropdownMenuItem>
          ) : null}

          {(isConfirmed(appointment.status) || appointment.status === "completed") ? (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={notesHref}>Session Notes</Link>
            </DropdownMenuItem>
          ) : null}

          {(appointment.status === "pending" || isConfirmed(appointment.status)) ? (
            <DropdownMenuItem
              className="cursor-pointer text-[var(--md-sys-color-error)]"
              onSelect={() => setConfirmAction("cancel")}
              disabled={isBusy}
            >
              {isBusy ? "Cancelling..." : "Cancel Appointment"}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {isRescheduleOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => setIsRescheduleOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsRescheduleOpen(false); }}>
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-high)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--md-sys-color-on-surface)" }}>Reschedule Appointment</h3>
              <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-lowest)" }}>
                <Calendar
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
              <AvailableSlotsGrid slots={daySlots} selectedSlot={rescheduleTime} onSelect={setRescheduleTime} isLoading={isLoadingSlots} emptyState={slotsEmptyState} selectedDate={rescheduleDate} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsRescheduleOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleRescheduleSubmit} disabled={isRescheduling || !rescheduleDate || !rescheduleTime} size="sm" className="rounded-xl" style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}>
                  {isRescheduling ? "Saving..." : "Save"}
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
                  onClick={handleConfirmAction}
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
    </>
  );
}

export default function CounselorAppointmentsCard({
  todayIso,
  students,
}: {
  todayIso: string;
  students: StudentDirectoryItemDTO[];
}) {
  const role = "counselor" as const;
  const [error, setError] = useState<string>("");
  const [showReconnectGoogle, setShowReconnectGoogle] = useState(false);
  const selectDashboardAppointments = useMemo(
    () => selectCounselorDashboardAppointments(todayIso),
    [todayIso],
  );
  const studentNameById = useMemo(
    () =>
      Object.fromEntries(
        students.map((student) => [student.student_id, student.name]),
      ),
    [students],
  );
  const {
    data: dashboardAppointments = EMPTY_COUNSELOR_DASHBOARD_APPOINTMENTS,
  } = useAppointments(role, undefined, {
    select: selectDashboardAppointments,
  });
  useAppointmentsRealtimeSync(role);
  const {
    mutateAsync: updateAppointmentStatus,
    isPending: isUpdating,
    variables: pendingVariables,
  } = useUpdateCounselorAppointmentStatus();
  const { mutateAsync: rescheduleAppointment } = useRescheduleCounselorAppointment();

  function getStudentName(studentId: string) {
    return studentNameById[studentId];
  }

  async function handleAction(appointmentId: string, status: "approved" | "cancelled" | "completed") {
    setError("");
    setShowReconnectGoogle(false);
    try {
      await updateAppointmentStatus({ appointmentId, status });
    } catch (err) {
      const mutationError = err as Error & { reconnectGoogle?: boolean };
      setError(mutationError.message ?? "Unable to update appointment right now. Please try again.");
      setShowReconnectGoogle(Boolean(mutationError.reconnectGoogle));
    }
  }

  async function handleReschedule(appointmentId: string, date: string, time: string) {
    setError("");
    try {
      await rescheduleAppointment({ appointmentId, appointmentDate: date, appointmentTime: time });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reschedule appointment.");
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      {error ? (
        <div className="mb-3 rounded-xl border border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/35 px-3 py-2">
          <Md3Message tone="error">{error}</Md3Message>
          {showReconnectGoogle ? (
            <a
              href="/api/auth/google/initiate"
              className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
              }}
            >
              Reconnect Google
            </a>
          ) : null}
        </div>
      ) : null}

      <AppointmentsSections
        maxItems={8}
        sections={[
          {
            title: "Upcoming Appointments",
            appointments: dashboardAppointments.approvedUpcoming,
            emptyMessage: "No approved upcoming appointments.",
            getParticipantName: (appointment) => getStudentName(appointment.student_id),
            participantNameFallback: "Student",
            renderActions: (appointment) => (
              <AppointmentActions
                appointment={appointment}
                onAction={handleAction}
                onReschedule={handleReschedule}
                isBusy={isUpdating && pendingVariables?.appointmentId === appointment.appointment_id}
              />
            ),
          },
          {
            title: "Pending Appointments",
            appointments: dashboardAppointments.pendingApproval,
            emptyMessage: "No pending appointments.",
            getParticipantName: (appointment) => getStudentName(appointment.student_id),
            participantNameFallback: "Student",
            renderActions: (appointment) => (
              <AppointmentActions
                appointment={appointment}
                onAction={handleAction}
                onReschedule={handleReschedule}
                isBusy={isUpdating && pendingVariables?.appointmentId === appointment.appointment_id}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}