import { AppointmentDTO, isConfirmed } from "@/lib/booking/contracts";
import { TruncatedText } from "@/components/ui/truncated-text";

const statusColors: Record<AppointmentDTO["status"], string> = {
  pending:
    "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]",
  approved:
    "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]",
  cancelled:
    "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]",
  completed:
    "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
  expired:
    "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]",
  rescheduled:
    "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]",
};

function formatDisplayTime(rawTime: string) {
  const [rawHour = "0", rawMinute = "00"] = rawTime.split(":");
  const hour24 = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return rawTime;
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

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
              {item.appointment_date} at {formatDisplayTime(item.appointment_time)}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Mode: {item.mode}
            {item.reason ? (
              <>
                {" "}&middot; Reason: <TruncatedText text={item.reason_preview || item.reason} lines={1} className="text-[var(--md-sys-color-on-surface)]" />
              </>
            ) : null}
          </p>
          {item.mode === "online" &&
            isConfirmed(item.status) &&
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

