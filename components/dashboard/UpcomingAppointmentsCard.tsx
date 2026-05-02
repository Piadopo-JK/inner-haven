"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import { AppointmentDTO } from "@/lib/booking/contracts";
import { selectStudentDashboardAppointments } from "@/lib/query/appointment-selectors";

export default function UpcomingAppointmentsCard({ appointments }: { appointments: AppointmentDTO[] }) {
  const todayIso = new Date().toISOString().split("T")[0];
  const { approvedUpcoming, pendingUpcoming } = selectStudentDashboardAppointments(todayIso)(appointments);

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      <AppointmentsSections
        sections={[
          {
            title: "Upcoming Appointments",
            appointments: approvedUpcoming,
            emptyMessage: "No approved upcoming appointments.",
            headerAction: (
              <Button asChild variant="link" className="text-[var(--md-sys-color-primary)] font-medium p-0">
                <Link href="/appointments">View Calendar</Link>
              </Button>
            ),
          },
          {
            title: "Pending Appointments",
            appointments: pendingUpcoming,
            emptyMessage: "No pending appointments.",
          },
        ]}
      />
    </Card>
  );
}
