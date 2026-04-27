import { ArrowLeft, Calendar, Clock, Video } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import SessionDetailsActions from "@/components/appointments/SessionDetailsActions";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

type AppointmentDetailsPageProps = {
  params: Promise<{ appointmentId: string }>;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "var(--md-sys-color-secondary-container)", color: "var(--md-sys-color-on-secondary-container)", label: "Pending" },
  approved:  { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  completed: { bg: "#dbeafe", color: "#1e40af", label: "Completed" },
};

export default async function AppointmentDetailsPage({ params }: AppointmentDetailsPageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/auth/login");

  const { appointmentId } = await params;

  const [ownAppointments, counselors, students] = await Promise.all([
    bookingService.listAppointments(
      sessionUser.role === "counselor"
        ? { role: "counselor", counselor_id: sessionUser.userId }
        : { role: "student", student_id: sessionUser.userId },
    ),
    sessionUser.role === "student" ? bookingService.listCounselors() : Promise.resolve([]),
    sessionUser.role === "counselor" ? bookingService.listStudents() : Promise.resolve([]),
  ]);

  const appointment = ownAppointments.find((a) => a.appointment_id === appointmentId);
  if (!appointment) redirect("/appointments");

  const counselorSchedule = await bookingService.getCounselorSchedule(appointment.counselor_id);
  const dayOfWeek = new Date(`${appointment.appointment_date}T00:00:00Z`).getUTCDay();
  const scheduleRule = counselorSchedule.find((r) => r.day_of_week === dayOfWeek && r.is_active);
  const slotMinutes = scheduleRule?.slot_duration_minutes ?? 60;
  const startTime = appointment.appointment_time.slice(0, 5);
  const [sh, sm] = startTime.split(":").map(Number);
  const endTotal = sh * 60 + sm + slotMinutes;
  const endTime = `${String(Math.floor(endTotal / 60) % 24).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
  const timeRange = `${startTime} – ${endTime}`;

  let participantName = "Participant";
  let participantAvatar: string | undefined;
  let participantRole: string | undefined;
  let participantAbout: string | undefined;

  if (sessionUser.role === "student") {
    const counselor = (counselors as Awaited<ReturnType<typeof bookingService.listCounselors>>)
      .find((c) => c.counselor_id === appointment.counselor_id);
    participantName  = counselor?.name ?? "Counselor";
    participantAvatar = counselor?.avatar_url;
    participantRole  = counselor?.specialization || "Wellness Counselor";
    participantAbout = counselor?.about;
  } else {
    const student = (students as Awaited<ReturnType<typeof bookingService.listStudents>>)
      .find((s) => s.student_id === appointment.student_id);
    participantName  = student?.name ?? "Student";
    participantAvatar = student?.avatar_url;
  }

  const initials = participantName
    .split(" ")
    .map((t) => t[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusStyle = STATUS_STYLES[appointment.status] ?? STATUS_STYLES.pending;

  const dateDisplay = new Date(`${appointment.appointment_date}T00:00:00Z`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ background: "var(--md-sys-color-background)" }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
          style={{ color: "var(--md-sys-color-primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--md-sys-color-on-surface)" }}
          >
            Session Details
          </h1>
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            ✓ {statusStyle.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl border p-6 flex flex-col items-center text-center gap-4"
              style={{
                background: "var(--md-sys-color-surface)",
                borderColor: "var(--md-sys-color-outline-variant)",
              }}
            >
              <div
                className="w-28 h-28 rounded-full p-1 mt-2 shrink-0"
                style={{ background: "var(--md-sys-color-primary)" }}
              >
                <div className="w-full h-full rounded-full p-[3px] bg-white">
                  <div
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{ background: "var(--md-sys-color-surface-container-high)" }}
                  >
                    {participantAvatar ? (
                      <img
                        src={participantAvatar}
                        alt={participantName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-3xl font-bold"
                        style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                      >
                        {initials || "?"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h2
                  className="text-xl font-bold leading-tight"
                  style={{ color: "var(--md-sys-color-on-surface)" }}
                >
                  {participantName}
                </h2>
                {participantRole ? (
                  <p
                    className="text-sm font-semibold mt-0.5"
                    style={{ color: "var(--md-sys-color-primary)" }}
                  >
                    {participantRole}
                  </p>
                ) : null}
              </div>

              {participantAbout ? (
                <div className="text-left px-1">
                  <p
                    className="text-sm italic leading-relaxed"
                    style={{ color: "var(--md-sys-color-on-surface-variant)", opacity: 0.92 }}
                  >
                    &ldquo;{participantAbout}&rdquo;
                  </p>
                </div>
              ) : null}
            </div>

          </div>

          <div>
            <div
              className="rounded-2xl border p-6"
              style={{
                background: "var(--md-sys-color-surface)",
                borderColor: "var(--md-sys-color-outline-variant)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-7"
                style={{ color: "var(--md-sys-color-on-surface)" }}
              >
                Meeting Logistics
              </h3>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--md-sys-color-on-surface-variant)", opacity: 0.7 }}
                  >
                    Date
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar
                      className="w-4 h-4 shrink-0"
                      style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--md-sys-color-on-surface)" }}
                    >
                      {dateDisplay}
                    </span>
                  </div>
                </div>

                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--md-sys-color-on-surface-variant)", opacity: 0.7 }}
                  >
                    Time
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock
                      className="w-4 h-4 shrink-0"
                      style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--md-sys-color-on-surface)" }}
                    >
                      {timeRange}
                    </span>
                  </div>
                </div>
              </div>

              {appointment.mode === "online" && appointment.meeting_link ? (
                <div className="mb-8">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--md-sys-color-on-surface-variant)", opacity: 0.7 }}
                  >
                    Google Meet
                  </p>
                  <a
                    href={appointment.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-medium break-all"
                    style={{ color: "var(--md-sys-color-primary)" }}
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    {appointment.meeting_link}
                  </a>
                </div>
              ) : null}

              <div
                className="h-px mb-8"
                style={{ background: "var(--md-sys-color-outline-variant)", opacity: 0.35 }}
              />

              <SessionDetailsActions appointment={appointment} role={sessionUser.role} />
              {appointment.reason ? (
                <>
                  <div
                    className="h-px my-8"
                    style={{ background: "var(--md-sys-color-outline-variant)", opacity: 0.35 }}
                  />
                <h3
                  className="text-lg font-semibold mb-5"
                  style={{ color: "var(--md-sys-color-on-surface)" }}
                >
                  {sessionUser.role === "counselor" ? "Student's Concern" : "Your Submitted Concern"}
                </h3>
                <p
                  className="text-base italic leading-relaxed"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                >
                  {appointment.reason}
                </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
