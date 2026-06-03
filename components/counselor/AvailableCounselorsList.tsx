"use client";

import * as React from "react";
import { Search } from "lucide-react";

import CounselorCard from "@/components/counselor/CounselorCard";
import { Input } from "@/components/ui/input";
import { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";
import { createClient } from "@/lib/supabase/client";

const PRESENCE_TOPIC = "presence:counselors";

type AvailableCounselorsListProps = {
  counselors: CounselorDirectoryItemDTO[];
  canBook?: boolean;
  canMessage?: boolean;
};

export default function AvailableCounselorsList({
  counselors,
  canBook = true,
  canMessage = false,
}: AvailableCounselorsListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [onlineCounselorIds, setOnlineCounselorIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const updateFromState = (state: Record<string, Array<{ counselor_id?: string }>> | undefined) => {
      const nextIds = new Set<string>();
      if (state) {
        Object.values(state).forEach((metas) => {
          metas?.forEach((meta) => {
            if (meta?.counselor_id) {
              nextIds.add(meta.counselor_id);
            }
          });
        });
      }
      setOnlineCounselorIds(nextIds);
    };

    async function subscribePresence() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || disposed) {
        return;
      }

      channel = supabase.channel(PRESENCE_TOPIC);

      channel
        .on("presence", { event: "sync" }, () => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          updateFromState(state);
        })
        .on("presence", { event: "join" }, () => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          updateFromState(state);
        })
        .on("presence", { event: "leave" }, () => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          updateFromState(state);
        })
        .subscribe();
    }

    void subscribePresence();

    return () => {
      disposed = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const filteredCounselors = React.useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return counselors;
    return counselors.filter(
      (counselor) =>
        counselor.name.toLowerCase().includes(keyword) ||
        counselor.email.toLowerCase().includes(keyword) ||
        counselor.specialization.toLowerCase().includes(keyword),
    );
  }, [counselors, searchTerm]);

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 shadow-sm"
        style={{
          background: "var(--md-sys-color-surface-container-lowest)",
          border: "1px solid var(--md-sys-color-outline-variant)",
        }}
      >
        <Search
          className="h-4 w-4 shrink-0"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, specialization, or email…"
          className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {counselors.length === 0 && (
        <p
          className="text-sm"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          No counselors are available right now.
        </p>
      )}
      {counselors.length > 0 && filteredCounselors.length === 0 && (
        <p
          className="text-sm"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          No counselors match your search.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCounselors.map((counselor, i) => (
          <CounselorCard
            key={counselor.counselor_id}
            counselor={counselor}
            canBook={canBook}
            canMessage={canMessage}
            colorIndex={i}
            isOnline={onlineCounselorIds.has(counselor.counselor_id)}
            priority={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

