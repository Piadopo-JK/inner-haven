"use client";

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel: string;
};

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div
      className="rounded-3xl p-8 flex flex-col gap-2 transition-shadow hover:shadow-md"
      style={{
        background: "var(--md-sys-color-surface)",
        border: "1px solid var(--md-sys-color-outline-variant)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
    >
      <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] tracking-wide">
        {label}
      </p>
      <div className="flex flex-col">
        <span className="text-5xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
          {value}
        </span>
        <span className="text-sm font-bold text-[var(--md-sys-color-primary)]">{sublabel}</span>
      </div>
    </div>
  );
}

export type CounselorStatsRowProps = {
  pending: number;
  upcomingApproved: number;
  completed: number;
  messages: number;
};

export default function CounselorStatsRow({
  pending,
  upcomingApproved,
  completed,
  messages,
}: CounselorStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
      <StatCard label="Pending" value={pending} sublabel="Awaiting Approval" />
      <StatCard label="Upcoming" value={upcomingApproved} sublabel="Approved" />
      <StatCard label="Messages" value={messages} sublabel="Unread" />
      <StatCard label="Completed" value={completed} sublabel="Sessions" />
    </div>
  );
}
