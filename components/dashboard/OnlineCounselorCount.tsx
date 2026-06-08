"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PRESENCE_TOPIC = "presence:counselors";

export default function OnlineCounselorCount({ fallback }: { fallback: number }) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function syncOnlineCounselors() {
      if (disposed) return;
      const state = channel?.presenceState() as
        | Record<string, Array<{ counselor_id?: string }>>
        | undefined;
      setCount(state ? Object.keys(state).length : 0);
    }

    channel = supabase.channel(PRESENCE_TOPIC);

    channel
      .on("presence", { event: "sync" }, syncOnlineCounselors)
      .on("presence", { event: "join" }, syncOnlineCounselors)
      .on("presence", { event: "leave" }, syncOnlineCounselors)
      .subscribe();

    return () => {
      disposed = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return <span>{count}</span>;
}
