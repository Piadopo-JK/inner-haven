"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { updateAppointmentStatusAction } from "@/app/actions/appointments";
import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentDTO, StudentDirectoryItemDTO } from "@/lib/booking/contracts";

function AppointmentActions({
  appointment,
  onAction,
}: {
  appointment: AppointmentDTO;
  onAction: (appointmentId: string, status: "approved" | "cancelled") => Promise<void>;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-[var(--md-sys-color-on-surface-variant)] rounded-full h-10 w-10">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/appointments/${appointment.appointment_id}`}>View Details</Link>
        </DropdownMenuItem>
        {appointment.status === "pending" ? (
          <DropdownMenuItem className="cursor-pointer" onSelect={() => void onAction(appointment.appointment_id, "approved")}>
            Accept
          </DropdownMenuItem>
        ) : null}
        {appointment.status === "pending" ? (
          <DropdownMenuItem
            className="cursor-pointer text-[var(--md-sys-color-error)]"
            onSelect={() => void onAction(appointment.appointment_id, "cancelled")}
          >
            Cancel
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CounselorAppointmentsCard({
  appointments,
  todayIso,
  students,
}: {
  appointments: AppointmentDTO[];
  todayIso: string;
  students: StudentDirectoryItemDTO[];
}) {
  const router = useRouter();

  function getStudentName(studentId: string) {
    return students.find((student) => student.student_id === studentId)?.name;
  }

  async function handleAction(appointmentId: string, status: "approved" | "cancelled") {
    await updateAppointmentStatusAction(appointmentId, status);
    router.refresh();
  }

  const approvedUpcoming = appointments
    .filter((appointment) => appointment.status === "approved" && appointment.appointment_date >= todayIso)
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  // Pending means waiting for approval, regardless of date.
  const pendingApproval = appointments
    .filter((appointment) => appointment.status === "pending")
    .sort((a, b) => {
      const aTime = new Date(`${a.appointment_date}T${a.appointment_time}`).getTime();
      const bTime = new Date(`${b.appointment_date}T${b.appointment_time}`).getTime();
      return aTime - bTime;
    });

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      <AppointmentsSections
        sections={[
          {
            title: "Upcoming Appointments",
            appointments: approvedUpcoming,
            emptyMessage: "No approved upcoming appointments.",
            getParticipantName: (appointment) => getStudentName(appointment.student_id),
            participantNameFallback: "Student",
            renderActions: (appointment) => (
              <AppointmentActions appointment={appointment} onAction={handleAction} />
            ),
          },
          {
            title: "Pending Appointments",
            appointments: pendingApproval,
            emptyMessage: "No pending appointments.",
            getParticipantName: (appointment) => getStudentName(appointment.student_id),
            participantNameFallback: "Student",
            renderActions: (appointment) => (
              <AppointmentActions appointment={appointment} onAction={handleAction} />
            ),
          },
        ]}
      />
    </Card>
  );
}