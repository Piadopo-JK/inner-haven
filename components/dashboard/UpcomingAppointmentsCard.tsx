"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AppointmentsSections from "@/components/dashboard/AppointmentsSections";
import { AppointmentDTO } from "@/lib/booking/contracts";

export default function UpcomingAppointmentsCard({ appointments }: { appointments: AppointmentDTO[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const approvedUpcoming = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(`${appointment.appointment_date}T00:00:00`);
      return appointment.status === 'approved' && appointmentDate >= today;
    })
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const pendingUpcoming = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(`${appointment.appointment_date}T00:00:00`);
      return appointment.status === 'pending' && appointmentDate >= today;
    })
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 3);

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
