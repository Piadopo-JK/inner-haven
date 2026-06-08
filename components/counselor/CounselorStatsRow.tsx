"use client";

import { useEffect, useState } from "react";
import { useRealtimeChannel } from "@/lib/query/hooks/useRealtimeChannel";

type StatCardProps = {
  label: string;
  value: string | number;
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

export type CounselorStatsRowProps = {
  pending: number;
  upcomingApproved: number;
  completed: number;
  messages: number;
  resolvedCounselorId: string;
};

export default function CounselorStatsRow({
  pending,
  upcomingApproved,
  completed,
  messages,
  resolvedCounselorId,
}: CounselorStatsRowProps) {
  const [liveMessages, setLiveMessages] = useState(messages);

  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  useRealtimeChannel({
    channelPrefix: `counselor-notifications-${resolvedCounselorId}`,
    tables: ["notifications"],
    filters: { notifications: `recipient_id=eq.${resolvedCounselorId}` },
    onEvent: (payload) => {
      const row = payload.new as Record<string, unknown>;
      if (row?.type !== "session_notes" || row?.anonymous_thread_id == null) return;

      if (payload.eventType === "INSERT") {
        setLiveMessages((prev) => prev + 1);
      } else if (payload.eventType === "UPDATE") {
        setLiveMessages((prev) => Math.max(0, prev - 1));
      }
    },
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-1">
      <StatCard label="Pending" value={pending} sublabel="Awaiting Approval" />
      <StatCard label="Upcoming" value={upcomingApproved} sublabel="Approved" />
      <StatCard label="Messages" value={liveMessages} sublabel="Unread" />
      <StatCard label="Completed" value={completed} sublabel="Sessions" />
    </div>
  );
}
