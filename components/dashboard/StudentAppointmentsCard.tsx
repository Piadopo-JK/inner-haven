"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Md3Message } from "@/components/ui/md3-message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import { AppointmentDTO, CounselorDirectoryItemDTO, isConfirmed } from "@/lib/booking/contracts";
import {
  useAppointments,
  useAppointmentsRealtimeSync,
  useCancelStudentAppointment,
  type StudentDashboardAppointments,
  selectStudentDashboardAppointments,
} from "@/lib/query/hooks/useAppointments";

const EMPTY_STUDENT_DASHBOARD_APPOINTMENTS: StudentDashboardAppointments = {
  approvedUpcoming: [],
  pendingUpcoming: [],
};

function AppointmentActions({
  appointment,
  onCancel,
}: {
  appointment: AppointmentDTO;
  onCancel: (appointment: AppointmentDTO) => Promise<void>;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const canCancel = appointment.status === "pending" || isConfirmed(appointment.status);
  const canJoinOnline = appointment.mode === "online" && isConfirmed(appointment.status) && Boolean(appointment.meeting_link);
  const canEdit = appointment.status === "pending";
  const canViewNotes = appointment.status === "completed";
  const editHref = `/appointments/${appointment.appointment_id}/edit`;
  const notesHref = `/appointments/${appointment.appointment_id}/notes`;

  async function handleCancel() {
    setIsBusy(true);
    try {
      await onCancel(appointment);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Appointment actions"
            className="text-[var(--md-sys-color-on-surface-variant)] rounded-full h-10 w-10"
            disabled={isBusy}
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
          {canEdit ? (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={editHref}>Edit Appointment</Link>
            </DropdownMenuItem>
          ) : null}
          {canCancel ? (
            <DropdownMenuItem
              className="cursor-pointer text-[var(--md-sys-color-error)]"
              onSelect={() => setShowConfirmCancel(true)}
              disabled={isBusy}
            >
              {isBusy ? "Cancelling..." : "Cancel Appointment"}
            </DropdownMenuItem>
          ) : null}
          {canViewNotes ? (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={notesHref}>Session Notes</Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {showConfirmCancel && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowConfirmCancel(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmCancel(false); }}>
            <div className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-xl" style={{ borderColor: "var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-high)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>Cancel this appointment?</p>
              <p className="mt-1 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>This action cannot be undone.</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowConfirmCancel(false)} className="rounded-xl">Back</Button>
                <Button size="sm" onClick={handleCancel} className="rounded-xl" style={{ background: "var(--md-sys-color-error)", color: "var(--md-sys-color-on-error)" }}>Confirm</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function StudentAppointmentsCard({
  todayIso,
  counselors,
}: {
  todayIso: string;
  counselors: CounselorDirectoryItemDTO[];
}) {
  const role = "student" as const;
  const selectDashboardAppointments = useMemo(
    () => selectStudentDashboardAppointments(todayIso),
    [todayIso],
  );

  const { data: dashboardAppointments = EMPTY_STUDENT_DASHBOARD_APPOINTMENTS } = useAppointments(role, undefined, {
    select: selectDashboardAppointments,
  });
  useAppointmentsRealtimeSync(role);

  const { mutateAsync: cancelAppointment } = useCancelStudentAppointment();
  const [error, setError] = useState("");

  function getCounselorName(counselorId: string) {
    return counselors.find((c) => c.counselor_id === counselorId)?.name;
  }

  async function handleOptimisticCancel(appointment: AppointmentDTO) {
    setError("");
    try {
      await cancelAppointment(appointment.appointment_id);
    } catch {
      setError("Unable to cancel appointment right now. Please try again.");
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      {error ? <Md3Message tone="error" className="mb-3">{error}</Md3Message> : null}
      <AppointmentsSections
        maxItems={8}
        sections={[
          {
            title: "Upcoming Appointments",
            appointments: dashboardAppointments.approvedUpcoming,
            emptyMessage: "No approved upcoming appointments.",
            getParticipantName: (a) => getCounselorName(a.counselor_id),
            participantNameFallback: "Counselor",
            renderActions: (a) => (
              <AppointmentActions appointment={a} onCancel={handleOptimisticCancel} />
            ),
          },
          {
            title: "Pending Appointments",
            appointments: dashboardAppointments.pendingUpcoming,
            emptyMessage: "No pending appointments.",
            getParticipantName: (a) => getCounselorName(a.counselor_id),
            participantNameFallback: "Counselor",
            renderActions: (a) => (
              <AppointmentActions appointment={a} onCancel={handleOptimisticCancel} />
            ),
          },
        ]}
      />
    </Card>
  );
}
