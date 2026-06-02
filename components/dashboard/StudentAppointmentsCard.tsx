"use client";

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
import { AppointmentDTO, CounselorDirectoryItemDTO } from "@/lib/booking/contracts";
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
  const canCancel = appointment.status === "pending" || appointment.status === "approved";
  const canJoinOnline = appointment.mode === "online" && appointment.status === "approved" && Boolean(appointment.meeting_link);

  async function handleCancel() {
    setIsBusy(true);
    try {
      await onCancel(appointment);
    } finally {
      setIsBusy(false);
    }
  }

  return (
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
        {canCancel ? (
          <DropdownMenuItem
            className="cursor-pointer text-[var(--md-sys-color-error)]"
            onSelect={handleCancel}
            disabled={isBusy}
          >
            {isBusy ? "Cancelling..." : "Cancel Appointment"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
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
