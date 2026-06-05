"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type RealtimeTable = "appointments" | "notifications" | "anonymous_messages" | "anonymous_threads" | "session_notes";

type RealtimeChannelConfig = {
  channelPrefix: string;
  tables: RealtimeTable[];
  filters?: Partial<Record<RealtimeTable, string>>;
  onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
};

export function useRealtimeChannel({
  channelPrefix,
  tables,
  filters,
  onEvent,
  onError,
  maxRetries = 5,
}: RealtimeChannelConfig) {
  const [retryKey, setRetryKey] = useState(0);
  const retryState = useRef({ count: 0, lastAttempt: 0 });
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  useEffect(() => {
    const instanceId = crypto.randomUUID().slice(0, 8);
    const supabase = createClient();

    let channel = supabase.channel(`${channelPrefix}-${instanceId}`);

    for (const table of tables) {
      const filter = filters?.[table];
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => onEventRef.current(payload),
      );
    }

    channel.subscribe((status: string, err?: Error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        const message = err?.message ?? "Unknown realtime error";
        console.error(`[realtime] ${channelPrefix}: ${status} — ${message}`, err ?? "(no error object)");
        onErrorRef.current?.(err ?? new Error(message));

        const now = Date.now();
        const { count, lastAttempt } = retryState.current;
        if (now - lastAttempt > 30_000 || count < maxRetries) {
          retryState.current = { count: count + 1, lastAttempt: now };
          const delay = Math.min(1000 * Math.pow(2, count), 30_000);
          const timer = setTimeout(() => setRetryKey((k) => k + 1), delay);
          return () => clearTimeout(timer);
        }
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelPrefix, ...tables, maxRetries, retryKey]);
}
