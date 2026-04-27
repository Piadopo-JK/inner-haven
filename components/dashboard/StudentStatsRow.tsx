"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [onlineCounselors, setOnlineCounselors] = useState(counselors);
  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribePresence() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || disposed) {
        console.log("[presence:student] skipped subscribe, missing session or disposed");
        return;
      }

      channel = supabase.channel(PRESENCE_TOPIC);

      channel
        .on("presence", { event: "sync" }, () => {
          if (disposed) {
            return;
          }
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          const nextCount = state ? Object.keys(state).length : 0;
          console.log("[presence:student] sync", { onlineCounselors: nextCount, state });
          setOnlineCounselors(nextCount);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, unknown> | undefined;
          const nextCount = state ? Object.keys(state).length : 0;
          console.log("[presence:student] join", { newPresences, onlineCounselors: nextCount });
          setOnlineCounselors(nextCount);
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, unknown> | undefined;
          const nextCount = state ? Object.keys(state).length : 0;
          console.log("[presence:student] leave", { leftPresences, onlineCounselors: nextCount });
          setOnlineCounselors(nextCount);
        })
        .subscribe((status) => {
          console.log("[presence:student] channel status", status);
        });
    }

    void subscribePresence();

    return () => {
      disposed = true;
      console.log("[presence:student] cleanup removeChannel");
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-1">
      <StatCard label="Upcoming" value={upcoming} sublabel="Scheduled" />
      <StatCard label="Messages" value={messages} sublabel="Unread" />
      <StatCard label="Counselors" value={onlineCounselors} sublabel="Online" />
      <StatCard label="Completed" value={completed} sublabel="Milestones" />
    </div>
  );
}
