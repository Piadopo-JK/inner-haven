"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SessionRole } from "@/lib/booking/contracts";
import { createClient } from "@/lib/supabase/client";
import {
  clearAllClientCaches,
  setCacheSessionKey,
  getProfileSettingsCached,
  getAppointmentsCached,
  getCounselorScheduleCached,
  subscribeAppointmentsRealtimeSync,
} from "@/lib/cache/settings-client-cache";

export default function GlobalCacheWarmerClient({ role, userId }: { role: SessionRole; userId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // bind in-memory caches to the current authenticated identity.
    setCacheSessionKey(userId);
  }, [userId]);

  useEffect(() => {
    // if auth identity changes in-tab, hard reset to prevent stale cache exposure to outher accounts.
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }

      const nextUserId = session?.user?.id ?? null;
      if (nextUserId === userId) {
        return;
      }

      clearAllClientCaches();
      window.location.reload();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    // subscribe to booking realtime invalidation events
    const unsubAppointments = subscribeAppointmentsRealtimeSync(role);

    return () => {
      unsubAppointments();
    };
  }, [role]);

  useEffect(() => {
    // fetch cache if not in flight or fresh
    // kick immediately so the next navigation can hit warm data,
    // then run a secondary idle warm pass.
    const runWarmer = () => {
      void getProfileSettingsCached();
      void getAppointmentsCached(role);
      
      if (role === "counselor") {
        void getCounselorScheduleCached();
      }
    };

    runWarmer();

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => runWarmer(), { timeout: 500 });
      return () => window.cancelIdleCallback(idleId);
    } else {
      const timeoutId = setTimeout(runWarmer, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [role, pathname]);

  return null;
}
