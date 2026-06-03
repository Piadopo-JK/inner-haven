"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SessionRole } from "@/lib/booking/contracts";

const PRESENCE_TOPIC = "presence:counselors";

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

export type StudentStatsRowProps = {
  role: SessionRole;
  userId: string;
  resolvedUserId: string;
  upcoming: number;
  messages: number;
  counselors: number;
  completed: number;
};

export default function StudentStatsRow({
  role,
  userId,
  resolvedUserId,
  upcoming,
  messages,
  counselors,
  completed,
}: StudentStatsRowProps) {
  const [onlineCounselors, setOnlineCounselors] = useState(counselors);
  const [liveMessages, setLiveMessages] = useState(messages);

  useEffect(() => {
    setOnlineCounselors(counselors);
  }, [counselors]);

  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function syncOnlineCounselors() {
      if (disposed) {
        return;
      }
      const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
      setOnlineCounselors(state ? Object.keys(state).length : 0);
    }

    function subscribePresence() {
      channel = supabase.channel(PRESENCE_TOPIC);

      channel
        .on("presence", { event: "sync" }, syncOnlineCounselors)
        .on("presence", { event: "join" }, syncOnlineCounselors)
        .on("presence", { event: "leave" }, syncOnlineCounselors)
        .subscribe();
    }

    subscribePresence();

    return () => {
      disposed = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  // Realtime anonymous message notification count
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`anon-notifications-rt-${resolvedUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${resolvedUserId}` },
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
        { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${resolvedUserId}` },
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
  }, [resolvedUserId]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-1">
      <StatCard label="Upcoming" value={upcoming} sublabel="Scheduled" />
      <StatCard label="Messages" value={liveMessages} sublabel="Unread" />
      <StatCard label="Counselors" value={onlineCounselors} sublabel="Online" />
      <StatCard label="Completed" value={completed} sublabel="Milestones" />
    </div>
  );
}
