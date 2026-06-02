"use client";

import { CalendarClock, CheckCircle, ClipboardCheck, Video, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Md3Message } from "@/components/ui/md3-message";
import { SessionNoteDTO } from "@/lib/booking/contracts";
import { queryKeys } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/client";
import { useAppointmentDetails } from "@/lib/query/hooks/useAppointmentDetails";
import {
  useCancelCounselorAppointment,
  useCancelStudentAppointment,
  useRescheduleCounselorAppointment,
  useUpdateCounselorAppointmentStatus,
} from "@/lib/query/hooks/useAppointments";
import { useSessionNotes } from "@/lib/query/hooks/useSessionNotes";

export const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "var(--md-sys-color-secondary-container)", color: "var(--md-sys-color-on-secondary-container)", label: "Pending" },
  approved:  { bg: "var(--md-sys-color-tertiary-container)", color: "var(--md-sys-color-on-tertiary-container)", label: "Approved" },
  cancelled: { bg: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-on-error-container)", label: "Cancelled" },
  completed: { bg: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)", label: "Completed" },
  expired:   { bg: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)", label: "Expired" },
};

type MinimalAppointment = { appointment_id: string; status: string };

export function SessionStatusPill({
  appointmentId,
  initialAppointment,
}: {
  appointmentId: string;
  initialAppointment: Parameters<typeof useAppointmentDetails>[1];
}) {
  const { data: appointment = initialAppointment } = useAppointmentDetails(
    appointmentId,
    initialAppointment,
  );
  const statusStyle =
    STATUS_STYLES[(appointment as MinimalAppointment).status] ?? STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
      style={{ background: statusStyle.bg, color: statusStyle.color }}
    >
      ✓ {statusStyle.label}
    </span>
  );
}

type SessionDetailsActionsProps = {
  appointmentId: string;
  role: "student" | "counselor";
  initialAppointment: {
    appointment_id: string;
    student_id: string;
    counselor_id: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    reason_preview: string;
    mode: "in_person" | "online";
    status: "pending" | "approved" | "cancelled" | "completed" | "expired";
    created_at: string;
    updated_at: string;
    meeting_link?: string;
  };
  initialSessionNote?: SessionNoteDTO | null;
};

export default function SessionDetailsActions({
  appointmentId,
  role,
  initialAppointment,
  initialSessionNote,
}: SessionDetailsActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: appointment = initialAppointment } = useAppointmentDetails(
    appointmentId,
    initialAppointment,
  );
  const { data: sessionNote = initialSessionNote } = useSessionNotes(
    appointmentId,
    initialSessionNote,
  );
  const { mutateAsync: cancelStudentAppointment, isPending: isStudentCancelling } = useCancelStudentAppointment();
  const { mutateAsync: cancelCounselorAppointment, isPending: isCounselorCancelling } = useCancelCounselorAppointment();
  const { mutateAsync: updateAppointmentStatus, isPending: isUpdatingStatus } = useUpdateCounselorAppointmentStatus();
  const { mutateAsync: rescheduleAppointment, isPending: isRescheduling } = useRescheduleCounselorAppointment();
  const notesHref = `/appointments/${appointment.appointment_id}/notes`;
  const [activeAction, setActiveAction] = useState<"approve" | "cancel" | "reschedule" | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(appointment.appointment_date);
  const [rescheduleTime, setRescheduleTime] = useState(appointment.appointment_time.slice(0, 5));
  const [error, setError] = useState("");
  const [showReconnectGoogle, setShowReconnectGoogle] = useState(false);

  useEffect(() => {
    setRescheduleDate(appointment.appointment_date);
    setRescheduleTime(appointment.appointment_time.slice(0, 5));
  }, [appointment.appointment_date, appointment.appointment_time]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointment-details-${appointmentId}-${crypto.randomUUID().slice(0, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const rowId = ((payload.new ?? payload.old) as Record<string, unknown>).appointment_id as string | undefined;
          if (rowId !== appointmentId) return;

          void queryClient.invalidateQueries({
            queryKey: queryKeys.appointmentDetails(appointmentId),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appointmentId, queryClient]);

  const isBusy = isStudentCancelling || isCounselorCancelling || isUpdatingStatus || isRescheduling;

  const canCancel =
    appointment.status === "pending" || appointment.status === "approved";
  const isPending = appointment.status === "pending";
  const isApproved = appointment.status === "approved";
  const canOpenSessionFeedback =
    role === "counselor" &&
    (appointment.status === "approved" || appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "expired");
  const canViewSessionNotes =
    role === "student" &&
    Boolean(sessionNote) &&
    (appointment.status === "approved" || appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "expired");
  const canJoinOnline = appointment.mode === "online";
  const canStudentEdit = role === "student" && isPending;
  const studentEditHref = `/appointments/${appointment.appointment_id}/edit`;

  function handleMutationError(err: unknown) {
    const mutationError = err as Error & { reconnectGoogle?: boolean };
    setError(mutationError.message ?? "Unable to update this appointment right now.");
    setShowReconnectGoogle(Boolean(mutationError.reconnectGoogle));
  }

  async function handleApprove() {
    setActiveAction("approve");
    setError("");
    setShowReconnectGoogle(false);
    try {
      await updateAppointmentStatus({ appointmentId: appointment.appointment_id, status: "approved" });
      router.refresh();
    } catch (err) {
      handleMutationError(err);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCancel() {
    setActiveAction("cancel");
    setError("");
    setShowReconnectGoogle(false);
    try {
      if (role === "student") {
        await cancelStudentAppointment(appointment.appointment_id);
      } else {
        await cancelCounselorAppointment(appointment.appointment_id);
      }
      if (role === "student") {
        router.push("/appointments");
        return;
      }
      router.refresh();
    } catch (err) {
      handleMutationError(err);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRescheduleSubmit() {
    setActiveAction("reschedule");
    setError("");
    setShowReconnectGoogle(false);
    try {
      await rescheduleAppointment({
        appointmentId: appointment.appointment_id,
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
      });
      setIsRescheduleOpen(false);
      router.refresh();
    } catch (err) {
      handleMutationError(err);
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {error ? (
        <div className="rounded-xl border border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/35 px-3 py-2">
          <Md3Message tone="error">{error}</Md3Message>
          {showReconnectGoogle ? (
            <a
              href="/api/auth/google/initiate"
              className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
              }}
            >
              Reconnect Google
            </a>
          ) : null}
        </div>
      ) : null}

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
                {activeAction === "approve" ? "Accepting..." : "Accept"}
              </Button>
            ) : (
              <Button
                disabled
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold opacity-40 cursor-not-allowed"
                style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              >
                <CheckCircle className="w-4 h-4" />
                {isApproved ? "Accepted" : "Status Finalized"}
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
            ) : canJoinOnline ? (
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
            ) : null}

            {canCancel ? (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}
              >
                <X className="w-4 h-4" />
                {activeAction === "cancel" ? "Cancelling..." : "Cancel"}
              </Button>
            ) : null}

            {canOpenSessionFeedback && !isPending ? (
              <Button
                asChild
                variant="outline"
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-outline-variant)", color: "var(--md-sys-color-primary)" }}
              >
                <Link href={notesHref}>
                  <ClipboardCheck className="w-4 h-4" />
                  Session Feedback
                </Link>
              </Button>
            ) : null}
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
            ) : canJoinOnline ? (
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
            ) : null}

            {canCancel ? (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isBusy}
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}
              >
                <X className="w-4 h-4" />
                {activeAction === "cancel" ? "Cancelling..." : "Cancel Session"}
              </Button>
            ) : canViewSessionNotes ? (
              <Button
                asChild
                variant="outline"
                className="h-14 w-full flex items-center justify-center gap-2 rounded-xl px-5 font-semibold"
                style={{ background: "var(--md-sys-color-surface)", borderColor: "var(--md-sys-color-outline-variant)", color: "var(--md-sys-color-primary)" }}
              >
                <Link href={notesHref}>
                  <ClipboardCheck className="w-4 h-4" />
                  View Session Notes
                </Link>
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
            {activeAction === "reschedule" ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
