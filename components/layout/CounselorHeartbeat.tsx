"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const PRESENCE_TOPIC = "presence:counselors";

export default function CounselorHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let disposed = false;

    async function startPresence() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || disposed) {
        console.log("[presence:counselor] skipped start, missing session or disposed");
        return;
      }

      const { data: counselor } = await supabase
        .from("counselors")
        .select("counselor_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!counselor?.counselor_id || disposed) {
        console.log("[presence:counselor] skipped start, no counselor mapping");
        return;
      }

      channel = supabase.channel(PRESENCE_TOPIC, {
        config: {
          presence: {
            key: session.user.id,
          },
        },
      });

      channel.subscribe(async (status) => {
        console.log("[presence:counselor] channel status", status);
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel?.track({
          counselor_id: counselor.counselor_id,
          role: "counselor",
          connected_at: new Date().toISOString(),
        });

        console.log("[presence:counselor] tracked", counselor.counselor_id);
      });
    }

    void startPresence();

    const onBeforeUnload = () => {
      console.log("[presence:counselor] beforeunload untrack");
      void channel?.untrack();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      disposed = true;
      window.removeEventListener("beforeunload", onBeforeUnload);
      console.log("[presence:counselor] cleanup untrack + removeChannel");
      void channel?.untrack();
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return null;
}
