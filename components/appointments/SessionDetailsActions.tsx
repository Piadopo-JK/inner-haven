"use client";

import { CalendarClock, CheckCircle, ClipboardCheck, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  completeAppointmentAction,
  cancelStudentAppointmentAction,
  rescheduleCounselorAppointmentAction,
  updateAppointmentStatusAction,
} from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { AppointmentDTO } from "@/lib/booking/contracts";

type SessionDetailsActionsProps = {
  appointment: AppointmentDTO;
  role: "student" | "counselor";
};

export default function SessionDetailsActions({ appointment, role }: SessionDetailsActionsProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(appointment.appointment_date);
  const [rescheduleTime, setRescheduleTime] = useState(appointment.appointment_time.slice(0, 5));

  const canCancel =
    appointment.status === "pending" || appointment.status === "approved";
  const isPending = appointment.status === "pending";
  const isApproved = appointment.status === "approved";
  const isCompleted = appointment.status === "completed";
  const todayIso = new Date().toISOString().split("T")[0];
  const canCompleteSession = role === "counselor" && ((isApproved && appointment.appointment_date < todayIso) || isCompleted);
  const canJoinOnline = isApproved && appointment.mode === "online" && !!appointment.meeting_link;
  const canStudentEdit = role === "student" && isPending;
  const studentEditHref = `/appointments/${appointment.appointment_id}/edit`;

  async function handleApprove() {
    setIsBusy(true);
    try {
      await updateAppointmentStatusAction(appointment.appointment_id, "approved");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCancel() {
    setIsBusy(true);
    try {
      if (role === "student") {
        await cancelStudentAppointmentAction(appointment.appointment_id);
      } else {
        await updateAppointmentStatusAction(appointment.appointment_id, "cancelled");
      }
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCompleteSession() {
    setIsBusy(true);
    try {
      await completeAppointmentAction(appointment.appointment_id);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRescheduleSubmit() {
    setIsBusy(true);
    try {
      await rescheduleCounselorAppointmentAction(
        appointment.appointment_id,
        rescheduleDate,
        rescheduleTime,
      );
      setIsRescheduleOpen(false);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className={`grid grid-cols-1 ${role === "counselor" ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 w-full`}>
        {role === "counselor" ? (
          <>
            {isPending ? (
              <Button
                onClick={handleApprove}
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <CheckCircle className="w-4 h-4" />
                {isBusy ? "Accepting..." : "Accept"}
              </Button>
            ) : (
              <Button
                onClick={() => setIsRescheduleOpen((prev) => !prev)}
                disabled
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold opacity-40 cursor-not-allowed"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <CalendarClock className="w-4 h-4" />
                Reschedule
              </Button>
            )}

            {isPending ? (
              <Button
                onClick={() => setIsRescheduleOpen((prev) => !prev)}
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <CalendarClock className="w-4 h-4" />
                Reschedule
              </Button>
            ) : isApproved ? (
              canJoinOnline ? (
                <Button
                  asChild
                  className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                  style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
                >
                  <a href={appointment.meeting_link} target="_blank" rel="noreferrer">
                    <Video className="w-4 h-4" />
                    Join Session Now
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold opacity-55 cursor-not-allowed"
                  style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
                >
                  <Video className="w-4 h-4" />
                  Join Session Now
                </Button>
              )
            ) : (
              <Button
                disabled
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold opacity-40 cursor-not-allowed"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <Video className="w-4 h-4" />
                Join Session Now
              </Button>
            )}

            {isPending ? (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}
              >
                <X className="w-4 h-4" />
                {isBusy ? "Cancelling..." : "Cancel"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleCompleteSession}
                disabled={!canCompleteSession || isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}
              >
                <ClipboardCheck className="w-4 h-4" />
                {isBusy ? "Closing Session..." : "Session Feedback"}
              </Button>
            )}
          </>
        ) : (
          <>
            {canStudentEdit ? (
              <Button
                asChild
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <Link href={studentEditHref}>
                  <CalendarClock className="w-4 h-4" />
                  Edit
                </Link>
              </Button>
            ) : isApproved ? (
              canJoinOnline ? (
                <Button
                  asChild
                  className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                  style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
                >
                  <a href={appointment.meeting_link} target="_blank" rel="noreferrer">
                    <Video className="w-4 h-4" />
                    Join Session Now
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold opacity-55 cursor-not-allowed"
                  style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
                >
                  <Video className="w-4 h-4" />
                  Join Session Now
                </Button>
              )
            ) : (
              <Button
                disabled
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold opacity-40 cursor-not-allowed"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <Video className="w-4 h-4" />
                Join Session Now
              </Button>
            )}

            {canCancel ? (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}
              >
                <X className="w-4 h-4" />
                {isBusy ? "Cancelling..." : "Cancel Session"}
              </Button>
            ) : (
              <div />
            )}
          </>
        )}
      </div>

      {role === "counselor" && isRescheduleOpen ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border p-3"
          style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
        >
          <input
            type="date"
            value={rescheduleDate}
            onChange={(event) => setRescheduleDate(event.target.value)}
            className="h-10 rounded-lg border px-3 text-sm"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface)",
              color: "var(--md-sys-color-on-surface)",
            }}
          />
          <input
            type="time"
            value={rescheduleTime}
            onChange={(event) => setRescheduleTime(event.target.value)}
            className="h-10 rounded-lg border px-3 text-sm"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface)",
              color: "var(--md-sys-color-on-surface)",
            }}
          />
          <Button
            onClick={handleRescheduleSubmit}
            disabled={isBusy || !rescheduleDate || !rescheduleTime}
            className="h-10 rounded-lg px-4"
            style={{
              background: "var(--md-sys-color-primary)",
              color: "var(--md-sys-color-on-primary)",
            }}
          >
            {isBusy ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
