"use client";

import { MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";

import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import { Md3Message } from "@/components/ui/md3-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentDTO, StudentDirectoryItemDTO } from "@/lib/booking/contracts";
import {
  type CounselorDashboardAppointments,
  useAppointments,
  useAppointmentsRealtimeSync,
  useUpdateCounselorAppointmentStatus,
  selectCounselorDashboardAppointments,
} from "@/lib/query/hooks/useAppointments";

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
  isBusy,
}: {
  appointment: AppointmentDTO;
  onAction: (appointmentId: string, status: "approved" | "cancelled") => Promise<void>;
  isBusy: boolean;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-[var(--md-sys-color-on-surface-variant)] rounded-full h-10 w-10" disabled={isBusy}>
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {appointment.status === "pending" ? (
          <DropdownMenuItem className="cursor-pointer" onSelect={() => void onAction(appointment.appointment_id, "approved")} disabled={isBusy}>
            {isBusy ? "Updating..." : "Accept"}
          </DropdownMenuItem>
        ) : null}
        {appointment.status === "pending" ? (
          <DropdownMenuItem
            className="cursor-pointer text-[var(--md-sys-color-error)]"
            onSelect={() => void onAction(appointment.appointment_id, "cancelled")}
            disabled={isBusy}
          >
            {isBusy ? "Updating..." : "Cancel"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
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

  function getStudentName(studentId: string) {
    return studentNameById[studentId];
  }

  async function handleAction(appointmentId: string, status: "approved" | "cancelled") {
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
                isBusy={isUpdating && pendingVariables?.appointmentId === appointment.appointment_id}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}