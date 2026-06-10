"use client";

import dynamic from "next/dynamic";
import { SessionRole } from "@/lib/booking/contracts";

const OnlineCounselorCount = dynamic(
  () => import("./OnlineCounselorCount"),
  { ssr: false },
);

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  sublabel: string;
};

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1.5 transition-shadow hover:shadow-md"
      style={{
        background: "var(--md-sys-color-surface)",
        border: "1px solid var(--md-sys-color-outline-variant)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
    >
      <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] tracking-wide">
        {label}
      </p>
      <div className="flex flex-col">
        <span className="text-4xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
          {value}
        </span>
        <span className="text-xs font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wide">
          {sublabel}
        </span>
      </div>
    </div>
  );
}

export type StudentStatsRowProps = {
  role: SessionRole;
  userId: string;
  upcoming: number;
  messages: number;
  counselors: number;
  counselorIds?: string[];
  completed: number;
};

export default function StudentStatsRow({
  upcoming,
  messages,
  counselors,
  completed,
}: StudentStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-1">
      <StatCard label="Upcoming" value={upcoming} sublabel="Scheduled" />
      <StatCard label="Messages" value={messages} sublabel="Unread" />
      <StatCard
        label="Counselors"
        value={<OnlineCounselorCount fallback={counselors} />}
        sublabel="Online"
      />
      <StatCard label="Completed" value={completed} sublabel="Milestones" />
    </div>
  );
}
