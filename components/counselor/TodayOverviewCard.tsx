import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatPillProps = {
  label: string;
  value: number;
  bg: string;
  fg: string;
};

function StatPill({ label, value, bg, fg }: StatPillProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-4 py-3"
      style={{ background: bg, color: fg }}
    >
      <span className="text-3xl font-bold leading-none">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
}

export default function TodayOverviewCard({
  pending,
  scheduled,
}: {
  pending: number;
  scheduled: number;
}) {
  return (
    <Card className="md3-card w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">
          Today&apos;s Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <StatPill
            label="Pending"
            value={pending}
            bg="var(--md-sys-color-tertiary-container)"
            fg="var(--md-sys-color-on-tertiary-container)"
          />
          <StatPill
            label="Scheduled"
            value={scheduled}
            bg="var(--md-sys-color-primary-container)"
            fg="var(--md-sys-color-on-primary-container)"
          />
        </div>
      </CardContent>
    </Card>
  );
}

