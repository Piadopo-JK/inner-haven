"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  // Realtime anonymous message notification count
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`anon-notifications-rt-${resolvedCounselorId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${resolvedCounselorId}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (
            row?.type === "session_notes" &&
            row?.anonymous_thread_id != null
          ) {
            setLiveMessages((prev) => prev + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${resolvedCounselorId}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (
            row?.type === "session_notes" &&
            row?.anonymous_thread_id != null
          ) {
            setLiveMessages((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [resolvedCounselorId]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-1">
      <StatCard label="Pending" value={pending} sublabel="Awaiting Approval" />
      <StatCard label="Upcoming" value={upcomingApproved} sublabel="Approved" />
      <StatCard label="Messages" value={liveMessages} sublabel="Unread" />
      <StatCard label="Completed" value={completed} sublabel="Sessions" />
    </div>
  );
}
