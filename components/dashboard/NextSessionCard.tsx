"use client";

import { Video, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TruncatedText } from "@/components/ui/truncated-text";
import { AppointmentDTO } from "@/lib/booking/contracts";
import { createClient } from "@/lib/supabase/client";

const PRESENCE_TOPIC = "presence:counselors";

type NextSessionCardProps = {
  appointment?: AppointmentDTO;
  participantName?: string;
  participantAvatar?: string;
  todayIso: string;
  showParticipantOnlineStatus?: boolean;
};

export default function NextSessionCard({
  appointment,
  participantName,
  participantAvatar,
  todayIso,
  showParticipantOnlineStatus = false,
}: NextSessionCardProps) {
  const [isCounselorOnline, setIsCounselorOnline] = useState(false);

  useEffect(() => {
    if (!appointment?.counselor_id || !showParticipantOnlineStatus) {
      setIsCounselorOnline(false);
      return;
    }

    const supabase = createClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const counselorId = appointment.counselor_id;

    const updateOnlineStatus = (state: Record<string, Array<{ counselor_id?: string }>> | undefined) => {
      if (!state) {
        setIsCounselorOnline(false);
        return;
      }

      const isOnline = Object.values(state).some((metas) =>
        metas?.some((meta) => meta?.counselor_id === counselorId),
      );
      setIsCounselorOnline(isOnline);
    };

    async function subscribePresence() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || disposed) return;

      channel = supabase.channel(PRESENCE_TOPIC);

      channel
        .on("presence", { event: "sync" }, () => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          updateOnlineStatus(state);
        })
        .on("presence", { event: "join" }, () => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          updateOnlineStatus(state);
        })
        .on("presence", { event: "leave" }, () => {
          if (disposed) return;
          const state = channel?.presenceState() as Record<string, Array<{ counselor_id?: string }>> | undefined;
          updateOnlineStatus(state);
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
  }, [appointment?.counselor_id, showParticipantOnlineStatus]);

  if (!appointment) {
    return (
      <div className="relative overflow-hidden bg-[var(--md-sys-color-primary)] rounded-[1.5rem] p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 text-white shadow-xl opacity-80">
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-medium mb-1">
            No Sessions Scheduled
          </h2>
          <p className="text-white opacity-80 text-base">
            Book an appointment to start your journey.
          </p>
        </div>
      </div>
    );
  }

  const isToday = appointment.appointment_date === todayIso;
  const dateStr = isToday ? "Today" : appointment.appointment_date;
  const detailsHref = `/appointments/${appointment.appointment_id}`;
  const canJoinOnline = appointment.mode === "online" && !!appointment.meeting_link;
  const profileName = participantName || "Participant";
  const initials = profileName
    .split(" ")
    .map((token) => token.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative overflow-hidden bg-[var(--md-sys-color-primary)] rounded-[1.5rem] p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 text-white shadow-xl">
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        {participantAvatar ? (
          <img
            src={participantAvatar}
            alt={profileName}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-xl md:text-2xl font-medium text-white/90">{initials || "P"}</span>
        )}
      </div>

      <div className="flex-1 text-center md:text-left">
        <div className="inline-block bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] text-[10px] font-medium tracking-widest px-3 py-1 rounded-full uppercase mb-1">
          Upcoming Next
        </div>
        <h2 className="text-2xl md:text-3xl font-medium mb-1">
          <TruncatedText
            text={appointment.reason_preview || appointment.reason || "Upcoming Session"}
            lines={1}
            className="text-white"
          />
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <p className="text-white opacity-80 text-base">
            {participantName || "Your Participant"} • {dateStr} at {appointment.appointment_time}
          </p>
          {showParticipantOnlineStatus && isCounselorOnline ? (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "var(--md-sys-color-tertiary-container)",
                color: "var(--md-sys-color-on-tertiary-container)",
                border: "1px solid var(--md-sys-color-tertiary)",
              }}
            >
              Online
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 mt-2 md:mt-0">
        {canJoinOnline ? (
          <Button
            asChild
            className="bg-[var(--md-sys-color-primary-container)] hover:bg-white text-[var(--md-sys-color-primary)] font-medium py-4 px-5 rounded-xl flex items-center gap-2 border-none transition-all"
          >
            <a href={appointment.meeting_link} target="_blank" rel="noreferrer">
              <Video className="w-4 h-4" />
              Join Session
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            disabled
            className="bg-white/10 text-white/70 font-medium py-4 px-5 rounded-xl flex items-center gap-2 border-none"
          >
            <Video className="w-4 h-4" />
            {appointment.mode === "in_person" ? "In-Person Session" : "Link Unavailable"}
          </Button>
        )}
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none"
        >
          <Link href={detailsHref} aria-label="Open session details">
            <MoreVertical className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
