import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { placeholderCounselors } from "@/lib/placeholders/booking";

export default function CounselorListCard() {
  return (
    <DashboardCard title="Counselor List">
      <ul className="grid w-full gap-2 text-sm">
        {placeholderCounselors.map((counselor) => (
          <li key={counselor.counselor_id} className="rounded-md border px-3 py-2">
            <p className="font-medium">{counselor.name}</p>
            <p className="text-xs text-muted-foreground">{counselor.specialization}</p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
