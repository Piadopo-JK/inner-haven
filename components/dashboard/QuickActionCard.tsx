import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";

export default function QuickActionCard() {
  return (
    <DashboardCard title="Quick Action Card">
      <Button variant="secondary">Book</Button>
      <Button variant="outline">Message</Button>
    </DashboardCard>
  );
}
