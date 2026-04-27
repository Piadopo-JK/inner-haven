"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cancelStudentAppointmentAction } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import { AppointmentDTO, CounselorDirectoryItemDTO } from "@/lib/booking/contracts";

function AppointmentActions({ appointment }: { appointment: AppointmentDTO }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  const canCancel = appointment.status === "pending" || appointment.status === "approved";
  const detailsHref = `/appointments/${appointment.appointment_id}`;

  async function handleCancel() {
    setIsBusy(true);
    try {
      await cancelStudentAppointmentAction(appointment.appointment_id);
      router.refresh();
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
          className="text-[var(--md-sys-color-on-surface-variant)] rounded-full h-10 w-10"
          disabled={isBusy}
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={detailsHref}>View Details</Link>
        </DropdownMenuItem>
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
  appointments,
  todayIso,
  counselors,
}: {
  appointments: AppointmentDTO[];
  todayIso: string;
  counselors: CounselorDirectoryItemDTO[];
}) {
  const approvedUpcoming = appointments
    .filter((a) => a.status === "approved" && a.appointment_date >= todayIso)
    .sort((a, b) =>
      `${a.appointment_date}T${a.appointment_time}`.localeCompare(
        `${b.appointment_date}T${b.appointment_time}`,
      ),
    );

  const pendingUpcoming = appointments
    .filter((a) => a.status === "pending" && a.appointment_date >= todayIso)
    .sort((a, b) =>
      `${a.appointment_date}T${a.appointment_time}`.localeCompare(
        `${b.appointment_date}T${b.appointment_time}`,
      ),
    )
    .slice(0, 3);

  function getCounselorName(counselorId: string) {
    return counselors.find((c) => c.counselor_id === counselorId)?.name;
  }

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      <AppointmentsSections
        sections={[
          {
            title: "Upcoming Appointments",
            appointments: approvedUpcoming,
            emptyMessage: "No approved upcoming appointments.",
            getParticipantName: (a) => getCounselorName(a.counselor_id),
            participantNameFallback: "Counselor",
            renderActions: (a) => <AppointmentActions appointment={a} />,
          },
          {
            title: "Pending Appointments",
            appointments: pendingUpcoming,
            emptyMessage: "No pending appointments.",
            getParticipantName: (a) => getCounselorName(a.counselor_id),
            participantNameFallback: "Counselor",
          },
        ]}
      />
    </Card>
  );
}
