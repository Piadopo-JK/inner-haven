"use client";

import { useRouter } from "next/navigation";

import { updateAppointmentStatusAction } from "@/app/actions/appointments";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { AppointmentDTO } from "@/lib/booking/contracts";


//receives pre-fetched items from the server.

export default function PendingRequestsCard({ items }: { items: AppointmentDTO[] }) {
  const router = useRouter();

  async function handleAction(appointmentId: string, status: "approved" | "cancelled") {
    await updateAppointmentStatusAction(appointmentId, status);
    router.refresh();
  }

  return (
    <DashboardCard title="Pending Appointments">
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          No pending requests.
        </p>
      ) : null}
      {items.map((item) => (
        <div
          key={item.appointment_id}
          className="w-full rounded-lg p-3 text-sm"
          style={{
            border: "1px solid var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-low)",
          }}
        >
          <p style={{ color: "var(--md-sys-color-on-surface)", fontWeight: 500 }}>
            {item.appointment_date} · {item.appointment_time}
          </p>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            Reason: {item.reason || "N/A"}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              className="rounded-full"
              style={{
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
              }}
              onClick={() => handleAction(item.appointment_id, "approved")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              style={{
                border: "1px solid var(--md-sys-color-outline)",
                color: "var(--md-sys-color-error)",
              }}
              onClick={() => handleAction(item.appointment_id, "cancelled")}
            >
              Cancel
            </Button>
          </div>
        </div>
      ))}
    </DashboardCard>
  );
}
