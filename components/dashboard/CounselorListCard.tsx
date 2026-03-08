import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";

export default function CounselorListCard({
  counselors,
}: {
  counselors: CounselorDirectoryItemDTO[];
}) {
  return (
    <DashboardCard title="Counselor List">
      <ul className="grid w-full gap-2 text-sm">
        {counselors.length === 0 ? (
          <li style={{ color: "var(--md-sys-color-on-surface-variant)" }}>No counselors found.</li>
        ) : null}
        {counselors.map((counselor) => (
          <li
            key={counselor.counselor_id}
            className="rounded-lg px-3 py-2"
            style={{
              border: "1px solid var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container-low)",
            }}
          >
            <p
              className="font-medium"
              style={{ color: "var(--md-sys-color-on-surface)" }}
            >
              {counselor.name}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
              {counselor.specialization}
            </p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

