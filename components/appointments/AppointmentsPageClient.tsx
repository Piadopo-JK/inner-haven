"use client";

import { useEffect, useState } from "react";
import { AppointmentDTO } from "@/lib/booking/contracts";
import AppointmentCard from "./AppointmentCard";
import {
  getAppointmentsCached,
  isAppointmentsCacheFresh,
  subscribeAppointmentsChanged,
  subscribeAppointmentsRealtimeSync,
  subscribeVisibilityRefetch,
  subscribeNetworkRefetch,
} from "@/lib/cache/settings-client-cache";

type Tab = "pending" | "upcoming" | "completed";

interface AppointmentsPageClientProps {
  initialAppointments: AppointmentDTO[];
  role: "student" | "counselor";
  participantMap: Record<string, { name: string; avatar?: string }>;
}

export default function AppointmentsPageClient({ 
  initialAppointments, 
  role,
  participantMap 
}: AppointmentsPageClientProps) {
  const [appointments, setAppointments] = useState<AppointmentDTO[]>(initialAppointments);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const todayIso = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async (force = false) => {
      try {
        const data = await getAppointmentsCached(role, {
          force,
          seed: initialAppointments,
        });
        if (isMounted) {
          setAppointments(data);
        }
      } catch (err) {
        console.error("Failed to load appointments", err);
      }
    };

    const unsubscribeChanged = subscribeAppointmentsChanged(role, () => {
      void loadAppointments();
    });
    const unsubscribeRealtime = subscribeAppointmentsRealtimeSync(role);
    const unsubscribeVisibility = subscribeVisibilityRefetch(
      () => isAppointmentsCacheFresh(role),
      () => void loadAppointments(),
    );
    const unsubscribeNetwork = subscribeNetworkRefetch(
      () => isAppointmentsCacheFresh(role),
      () => void loadAppointments(),
    );

    void loadAppointments();

    return () => {
      isMounted = false;
      unsubscribeChanged();
      unsubscribeRealtime();
      unsubscribeVisibility();
      unsubscribeNetwork();
    };
  }, [initialAppointments, role]);

  const appointmentsByTab = appointments.reduce<Record<Tab, AppointmentDTO[]>>(
    (acc, appointment) => {
      if (appointment.status === "pending") {
        acc.pending.push(appointment);
      } else if (appointment.status === "approved" && appointment.appointment_date >= todayIso) {
        acc.upcoming.push(appointment);
      } else if (appointment.status === "completed") {
        acc.completed.push(appointment);
      }
      return acc;
    },
    { pending: [], upcoming: [], completed: [] },
  );

  const filteredAppointments = appointmentsByTab[activeTab];
  const activeCount = filteredAppointments.length;

  return (
    <div className="flex flex-col gap-10 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">My Appointments</h1>
        
        <div className="flex p-1.5 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl w-full md:w-fit">
          {(["pending", "upcoming", "completed"] as Tab[]).map((tab) => (
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
        <div className="flex items-center gap-3">
          {activeTab === "pending" && (
            <span className="w-3 h-3 rounded-full bg-[var(--md-sys-color-error)] animate-pulse" />
          )}
          <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments ({activeCount})
          </h2>
        </div>

        <div className="grid gap-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const participantId = role === "student" ? appointment.counselor_id : appointment.student_id;
              const participant = participantMap[participantId] || { name: "Unknown" };
              
              return (
                <AppointmentCard 
                  key={appointment.appointment_id} 
                  appointment={appointment} 
                  role={role}
                  participantName={participant.name}
                  participantAvatar={participant.avatar}
                />
              );
            })
          ) : (
            <div className="p-20 text-center rounded-[32px] border-2 border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
              <p className="text-lg font-medium text-[var(--md-sys-color-on-surface-variant)]">
                No {activeTab} appointments found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
