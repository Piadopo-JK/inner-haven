import { AppointmentDTO } from "@/lib/booking/contracts";

const statusColors: Record<AppointmentDTO["status"], string> = {
  pending:
    "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]",
  approved:
    "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]",
  cancelled:
    "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]",
  completed:
    "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
};

export default function AppointmentsList({
  appointments,
}: {
  appointments: AppointmentDTO[];
}) {
  if (appointments.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        No appointments yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {appointments.map((item) => (
        <li
          key={item.appointment_id}
          className="rounded-lg border p-3 text-sm border-[var(--md-sys-color-outline-variant)]"
          style={{ background: "var(--md-sys-color-surface-container-low)" }}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium text-[var(--md-sys-color-on-surface)]">
              {item.appointment_date} at {item.appointment_time}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Mode: {item.mode}
            {item.reason ? <> &middot; Reason: {item.reason}</> : null}
          </p>
          {item.mode === "online" &&
            item.status === "approved" &&
            item.meeting_link ? (
            <a
              href={item.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
              }}
            >
              Join Meeting
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

