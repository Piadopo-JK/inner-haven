import { ArrowLeft } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import SessionNotesEditor from "@/components/appointments/SessionNotesEditor";
import { getCounselorsCached, getStudentsCached } from "@/lib/cache/appointments-cache";
import { bookingService } from "@/lib/booking/service";
import { makeQueryClient } from "@/lib/query/client";
import {
  appointmentDetailsQueryOptions,
  sessionNotesQueryOptions,
} from "@/lib/query/queries";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { requireStudentProfile } from "@/lib/supabase/require-student-profile";

export const dynamic = "force-dynamic";

const pageSurfaceStyle = {
  background: "var(--md-sys-color-surface)",
} as const;

const sidePanelStyle = {
  background: "var(--md-sys-color-surface-container-low)",
} as const;

const elevatedCardStyle = {
  background: "var(--md-sys-color-surface)",
  borderColor: "var(--md-sys-color-outline-variant)",
  boxShadow: "var(--md-sys-elevation-level1)",
} as const;

export default async function AppointmentNotesPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.role === "student") {
    await requireStudentProfile(sessionUser.userId);
  }

  const { appointmentId } = await params;

  const viewerEntityId = sessionUser.role === "student"
    ? await bookingService.resolveStudentId(sessionUser.userId)
    : await bookingService.resolveCounselorId(sessionUser.userId);

  const [appointment, counselors, students, sessionNote] = await Promise.all([
    bookingService.getAppointmentById(appointmentId),
    sessionUser.role === "student" ? getCounselorsCached() : Promise.resolve([]),
    sessionUser.role === "counselor" ? getStudentsCached() : Promise.resolve([]),
    bookingService.getSessionNote(appointmentId),
  ]);

  if (
    !appointment ||
    !viewerEntityId ||
    (sessionUser.role === "student" && appointment.student_id !== viewerEntityId) ||
    (sessionUser.role === "counselor" && appointment.counselor_id !== viewerEntityId)
  ) {
    redirect("/appointments");
  }

  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    appointmentDetailsQueryOptions(appointmentId).queryKey,
    appointment,
  );
  queryClient.setQueryData(
    sessionNotesQueryOptions(appointmentId).queryKey,
    { note: sessionNote },
  );

  let participantName = "Participant";
  let participantAvatar: string | undefined;
  let participantRole: string | undefined;

  if (sessionUser.role === "student") {
    const counselor = (counselors as Awaited<ReturnType<typeof bookingService.listCounselors>>).find(
      (item) => item.counselor_id === appointment.counselor_id,
    );
    participantName = counselor?.name ?? "Counselor";
    participantAvatar = counselor?.avatar_url;
    participantRole = "Counselor";
  } else {
    const student = (students as Awaited<ReturnType<typeof bookingService.listStudents>>).find(
      (item) => item.student_id === appointment.student_id,
    );
    participantName = student?.name ?? "Student";
    participantAvatar = student?.avatar_url;
    participantRole = "Student";
  }

  const initials = participantName
    .split(" ")
    .map((token) => token[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="min-h-screen bg-[var(--md-sys-color-background)] px-4 py-8 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
        <Link
          href={`/appointments/${appointmentId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--md-sys-color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Session Details
        </Link>

        <section className="overflow-hidden rounded-[28px] border border-[var(--md-sys-color-outline-variant)]">
          <div className="flex min-h-[620px] flex-col lg:flex-row" style={pageSurfaceStyle}>
            <aside
              className="w-full p-6 md:p-8 lg:w-[30%] lg:min-w-[300px]"
              style={sidePanelStyle}
            >
              <div
                className="rounded-[20px] border p-5"
                style={elevatedCardStyle}
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-[var(--md-sys-color-primary)] p-[2px]">
                    <div className="h-full w-full rounded-full bg-[var(--md-sys-color-surface)] p-[2px]">
                      <div className="relative h-full w-full overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container-high)]">
                        {participantAvatar ? (
                          <Image src={participantAvatar} alt={participantName} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--md-sys-color-on-surface-variant)]">
                            {initials || "?"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[var(--md-sys-color-on-surface)]">{participantName}</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{participantRole}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span>Session Date</span>
                  <span className="text-right font-medium text-[var(--md-sys-color-on-surface)]">
                    {appointment.appointment_date}
                  </span>
                  <span>Status</span>
                  <span className="text-right font-medium text-[var(--md-sys-color-on-surface)] capitalize">
                    {appointment.status}
                  </span>
                </div>
              </div>

              <div className="mt-7 flex min-h-0 flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    Notes Visibility
                  </h3>
                </div>
                <p className="rounded-xl bg-[var(--md-sys-color-surface)] px-3 py-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {sessionUser.role === "student"
                    ? "Your counselor can share notes for this session. Once saved, you can view them here."
                    : "Notes saved here are visible to the student for this session."}
                </p>
              </div>
            </aside>

            <div className="flex-1 p-6 md:p-10" style={pageSurfaceStyle}>
              <h2 className="mb-10 text-3xl font-bold text-[var(--md-sys-color-on-surface)]">
                Session Notes
              </h2>
              {sessionUser.role === "student" && !sessionNote ? (
                <div className="rounded-2xl border bg-[var(--md-sys-color-error-container)] px-5 py-4 text-sm text-[var(--md-sys-color-on-error-container)]" style={{ borderColor: "color-mix(in srgb, var(--md-sys-color-error) 20%, transparent)" }}>
                  No session notes are available for this appointment yet. Your counselor can share notes after saving them.
                </div>
              ) : (
                <SessionNotesEditor
                  appointmentId={appointmentId}
                  role={sessionUser.role}
                  initialNote={sessionNote}
                />
              )}
            </div>
          </div>
        </section>
        </div>
      </main>
    </HydrationBoundary>
  );
}
