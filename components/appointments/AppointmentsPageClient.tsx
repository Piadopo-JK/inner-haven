"use client";

import { useEffect, useMemo, useState } from "react";
import { AppointmentDTO } from "@/lib/booking/contracts";
import AppointmentCard from "./AppointmentCard";
import AppointmentFilters, {
  DEFAULT_FILTERS,
  type AppointmentFiltersState,
} from "./AppointmentFilters";
import {
  useAppointments,
  useAppointmentsRealtimeSync,
  useCancelCounselorAppointment,
  useCancelStudentAppointment,
  useRescheduleCounselorAppointment,
  useUpdateCounselorAppointmentStatus,
  type AppointmentTab,
  selectAppointmentsByTab,
  applyCompletedFilters,
} from "@/lib/query/hooks/useAppointments";

const EMPTY_APPOINTMENT_TABS: Record<AppointmentTab, AppointmentDTO[]> = {
  pending: [],
  upcoming: [],
  completed: [],
};

const FILTERS_STORAGE_KEY = "appointments-filters";

function loadFilters(): AppointmentFiltersState {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<AppointmentFiltersState>;
    return {
      sortOrder: parsed.sortOrder === "asc" || parsed.sortOrder === "desc" ? parsed.sortOrder : DEFAULT_FILTERS.sortOrder,
      dateFrom: typeof parsed.dateFrom === "string" ? parsed.dateFrom : DEFAULT_FILTERS.dateFrom,
      dateTo: typeof parsed.dateTo === "string" ? parsed.dateTo : DEFAULT_FILTERS.dateTo,
      statuses: Array.isArray(parsed.statuses) ? parsed.statuses : DEFAULT_FILTERS.statuses,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

interface AppointmentsPageClientProps {
  role: "student" | "counselor";
  participantMap: Record<string, { name: string; avatar?: string }>;
}

export default function AppointmentsPageClient({
  role,
  participantMap,
}: AppointmentsPageClientProps) {
  const [activeTab, setActiveTab] = useState<AppointmentTab>("upcoming");
  const [filters, setFilters] = useState<AppointmentFiltersState>(loadFilters);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);
  const todayIso = new Date().toISOString().split("T")[0];
  const selectByTab = useMemo(() => selectAppointmentsByTab(todayIso), [todayIso]);

  const { data: appointmentsByTab = EMPTY_APPOINTMENT_TABS } = useAppointments(role, undefined, {
    select: selectByTab,
  });
  useAppointmentsRealtimeSync(role);

  const { mutateAsync: cancelStudentAppointment } = useCancelStudentAppointment();
  const { mutateAsync: cancelCounselorAppointment } = useCancelCounselorAppointment();
  const { mutateAsync: updateCounselorStatus } = useUpdateCounselorAppointmentStatus();
  const { mutateAsync: rescheduleAppointment } = useRescheduleCounselorAppointment();

  async function handleCancelAppointment(appointment: AppointmentDTO) {
    try {
      if (role === "student") {
        await cancelStudentAppointment(appointment.appointment_id);
      } else {
        await cancelCounselorAppointment(appointment.appointment_id);
      }
    } catch (error) {
      console.error("Failed to cancel appointment", error);
    }
  }

  async function handleApproveAppointment(appointment: AppointmentDTO) {
    if (role !== "counselor") {
      return;
    }

    try {
      await updateCounselorStatus({
        appointmentId: appointment.appointment_id,
        status: "approved",
      });
    } catch (error) {
      console.error("Failed to approve appointment", error);
    }
  }

  async function handleCompleteAppointment(appointment: AppointmentDTO) {
    if (role !== "counselor") {
      return;
    }

    try {
      await updateCounselorStatus({
        appointmentId: appointment.appointment_id,
        status: "completed",
      });
    } catch (error) {
      console.error("Failed to complete appointment", error);
    }
  }

  async function handleRescheduleAppointment(appointmentId: string, date: string, time: string) {
    if (role !== "counselor") {
      return;
    }

    try {
      await rescheduleAppointment({
        appointmentId,
        appointmentDate: date,
        appointmentTime: time,
      });
    } catch (error) {
      console.error("Failed to reschedule appointment", error);
    }
  }

  const isCompletedTab = activeTab === "completed";
  const rawAppointments = appointmentsByTab[activeTab];
  const filteredAppointments = isCompletedTab
    ? applyCompletedFilters(rawAppointments, filters)
    : rawAppointments;
  const activeCount = rawAppointments.length;
  const filteredCount = filteredAppointments.length;

  return (
    <div className="flex flex-col gap-10 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">My Appointments</h1>

        <div className="flex p-1.5 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl w-full md:w-fit">
          {(["pending", "upcoming", "completed"] as AppointmentTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md"
                  : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {activeTab === "pending" && (
              <span className="w-3 h-3 rounded-full bg-[var(--md-sys-color-error)] animate-pulse" />
            )}
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments
              {isCompletedTab && filteredCount !== activeCount
                ? ` (${filteredCount} of ${activeCount})`
                : ` (${activeCount})`}
            </h2>
          </div>
          {isCompletedTab && (
            <AppointmentFilters filters={filters} onChange={setFilters} />
          )}
        </div>

        <div className="grid gap-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const participantId =
                role === "student" ? appointment.counselor_id : appointment.student_id;
              const participant = participantMap[participantId] || { name: "Unknown" };
              return (
                <AppointmentCard
                  key={appointment.appointment_id}
                  appointment={appointment}
                  role={role}
                  participantName={participant.name}
                  participantAvatar={participant.avatar}
                  onCancelAppointment={handleCancelAppointment}
                  onApproveAppointment={handleApproveAppointment}
                  onCompleteAppointment={handleCompleteAppointment}
                  onRescheduleAppointment={handleRescheduleAppointment}
                />
              );
            })
          ) : (
            <div className="p-20 text-center rounded-[32px] border-2 border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
              <p className="text-lg font-medium text-[var(--md-sys-color-on-surface-variant)]">
                {isCompletedTab && activeCount > 0
                  ? "No appointments match your filters."
                  : `No ${activeTab} appointments found.`}
              </p>
              {isCompletedTab && activeCount > 0 && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="mt-2 text-sm font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
