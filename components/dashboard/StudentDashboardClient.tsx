"use client";

import { useMemo, useState } from "react";

import StudentWelcomeHeader from "@/components/dashboard/StudentWelcomeHeader";
import StudentAppointmentsCard from "@/components/dashboard/StudentAppointmentsCard";
import {
  StudentDashboardNextSessionSection,
  StudentDashboardSidebarSection,
  StudentDashboardStatsSection,
} from "@/components/dashboard/DashboardQuerySections";
import {
  DashboardAppointmentsPanelSkeleton,
  DashboardHeroCardSkeleton,
  DashboardSidebarSkeleton,
  DashboardStatsRowSkeleton,
} from "@/components/dashboard/DashboardRouteSkeletons";
import BookingFAB from "@/components/dashboard/BookingFAB";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/lib/query/hooks/useUnreadCount";
import { useCounselors, EMPTY_COUNSELORS } from "@/lib/query/hooks/useCounselors";
import { useAppointments } from "@/lib/query/hooks/useAppointments";

type BookingConfirmation = {
  date?: string;
  time?: string;
  mode?: string;
  counselor?: string;
} | null;

type StudentDashboardClientProps = {
  studentId: string;
  userName: string;
  bookingConfirmation?: BookingConfirmation;
};

function formatTime12h(rawTime: string) {
  const [rawHour = "0", rawMinute = "00"] = rawTime.split(":");
  const hour24 = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return rawTime;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function BookingConfirmationModal({ confirmation, onClose }: { confirmation: NonNullable<BookingConfirmation>; onClose: () => void }) {
  const hasDetails = confirmation.date && confirmation.time;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div
          className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-high)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--md-sys-color-primary-container)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-on-primary-container)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>
            Booking submitted successfully!
          </p>
          {hasDetails ? (
            <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              {confirmation.counselor ? `with ${confirmation.counselor} on ` : ""}
              {confirmation.date} at {formatTime12h(confirmation.time!)}
              {confirmation.mode === "online" ? " · Online" : " · In-Person"}
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              The counselor will review your request shortly.
            </p>
          )}
          <Button
            onClick={onClose}
            className="mt-5 w-full rounded-xl"
            style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
          >
            OK
          </Button>
        </div>
      </div>
    </>
  );
}

export default function StudentDashboardClient({
  studentId,
  userName,
  bookingConfirmation,
}: StudentDashboardClientProps) {
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { isLoading: appointmentsLoading } = useAppointments("student");
  const { data: unreadData, isLoading: unreadLoading } = useUnreadCount("student");
  const { data: counselors = EMPTY_COUNSELORS, isLoading: counselorsLoading } = useCounselors();

  const statsLoading = appointmentsLoading || unreadLoading;
  const sessionLoading = appointmentsLoading || counselorsLoading;

  const [showConfirmation, setShowConfirmation] = useState(!!bookingConfirmation);

  return (
    <main className="mx-auto w-full max-w-7xl flex flex-col gap-4 p-3 md:p-4">
      {showConfirmation && bookingConfirmation && (
        <BookingConfirmationModal
          confirmation={bookingConfirmation}
          onClose={() => setShowConfirmation(false)}
        />
      )}

      <StudentWelcomeHeader name={userName} />

      {statsLoading ? (
        <DashboardStatsRowSkeleton compact />
      ) : (
        <StudentDashboardStatsSection
          userId={studentId}
          todayIso={todayIso}
          unreadMessages={unreadData?.count ?? 0}
        />
      )}

      {sessionLoading ? (
        <DashboardHeroCardSkeleton />
      ) : (
        <StudentDashboardNextSessionSection
          todayIso={todayIso}
          counselors={counselors}
        />
      )}

      <section className="grid gap-6 md:grid-cols-[1fr_350px]">
        {sessionLoading ? (
          <DashboardAppointmentsPanelSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            <StudentAppointmentsCard
              todayIso={todayIso}
              counselors={counselors}
            />
          </div>
        )}

        {sessionLoading ? (
          <DashboardSidebarSkeleton showList />
        ) : (
          <StudentDashboardSidebarSection counselors={counselors} />
        )}
      </section>

      <BookingFAB />
    </main>
  );
}
