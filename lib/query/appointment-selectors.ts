import type { AppointmentDTO } from "@/lib/booking/contracts";
import { isConfirmed } from "@/lib/booking/contracts";
import type {
  AppointmentFiltersState,
} from "@/components/appointments/AppointmentFilters";

export type AppointmentTab = "pending" | "upcoming" | "completed";

export type StudentDashboardAppointments = {
  approvedUpcoming: AppointmentDTO[];
  pendingUpcoming: AppointmentDTO[];
};

export type StudentDashboardOverview = StudentDashboardAppointments & {
  upcomingCount: number;
  completedCount: number;
  nextSession?: AppointmentDTO;
};

export type CounselorDashboardAppointments = {
  approvedUpcoming: AppointmentDTO[];
  pendingApproval: AppointmentDTO[];
  pendingCount: number;
  todayPending: number;
  todayScheduled: number;
  completedCount: number;
  upcomingApprovedCount: number;
  nextSession?: AppointmentDTO;
};

export function compareAppointmentDateTime(
  left: AppointmentDTO,
  right: AppointmentDTO,
) {
  return `${left.appointment_date}T${left.appointment_time}`.localeCompare(
    `${right.appointment_date}T${right.appointment_time}`,
  );
}

function sortAppointments(appointments: AppointmentDTO[]) {
  return [...appointments].sort(compareAppointmentDateTime);
}

export function selectAppointmentsByTab(todayIso: string) {
  return (appointments: AppointmentDTO[]) =>
    appointments.reduce<Record<AppointmentTab, AppointmentDTO[]>>(
      (acc, appointment) => {
        if (appointment.status === "pending") {
          acc.pending.push(appointment);
        } else if (
          isConfirmed(appointment.status) &&
          appointment.appointment_date >= todayIso
        ) {
          acc.upcoming.push(appointment);
        } else if (
          appointment.status === "completed" ||
          appointment.status === "cancelled" ||
          appointment.status === "expired"
        ) {
          acc.completed.push(appointment);
        }
        return acc;
      },
      { pending: [], upcoming: [], completed: [] },
    );
}

export function selectStudentDashboardAppointments(todayIso: string) {
  return (appointments: AppointmentDTO[]): StudentDashboardAppointments => ({
    approvedUpcoming: sortAppointments(
      appointments.filter(
        (appointment) =>
          isConfirmed(appointment.status) &&
          appointment.appointment_date >= todayIso,
      ),
    ),
    pendingUpcoming: sortAppointments(
      appointments.filter(
        (appointment) =>
          appointment.status === "pending" &&
          appointment.appointment_date >= todayIso,
      ),
    ).slice(0, 3),
  });
}

export function selectStudentDashboardOverview(todayIso: string) {
  return (appointments: AppointmentDTO[]): StudentDashboardOverview => {
    const approvedUpcoming = sortAppointments(
      appointments.filter(
        (appointment) =>
          isConfirmed(appointment.status) &&
          appointment.appointment_date >= todayIso,
      ),
    );

    const pendingUpcoming = sortAppointments(
      appointments.filter(
        (appointment) =>
          appointment.status === "pending" &&
          appointment.appointment_date >= todayIso,
      ),
    );

    return {
      approvedUpcoming,
      pendingUpcoming: pendingUpcoming.slice(0, 3),
      upcomingCount: approvedUpcoming.length + pendingUpcoming.length,
      completedCount: appointments.filter(
        (appointment) => appointment.status === "completed",
      ).length,
      nextSession: approvedUpcoming[0],
    };
  };
}

export function selectCounselorDashboardAppointments(todayIso: string) {
  return (appointments: AppointmentDTO[]): CounselorDashboardAppointments => {
    const approvedUpcoming = sortAppointments(
      appointments.filter(
        (appointment) =>
          isConfirmed(appointment.status) &&
          appointment.appointment_date >= todayIso,
      ),
    );

    const pendingApproval = sortAppointments(
      appointments.filter((appointment) => appointment.status === "pending"),
    );

    return {
      approvedUpcoming,
      pendingApproval,
      pendingCount: pendingApproval.length,
      todayPending: appointments.filter(
        (appointment) =>
          appointment.status === "pending" &&
          appointment.appointment_date === todayIso,
      ).length,
      todayScheduled: appointments.filter(
        (appointment) =>
          isConfirmed(appointment.status) &&
          appointment.appointment_date === todayIso,
      ).length,
      completedCount: appointments.filter(
        (appointment) => appointment.status === "completed",
      ).length,
      upcomingApprovedCount: approvedUpcoming.length,
      nextSession: approvedUpcoming[0],
    };
  };
}

export function applyCompletedFilters(
  appointments: AppointmentDTO[],
  filters: AppointmentFiltersState,
): AppointmentDTO[] {
  let filtered = appointments.filter((a) =>
    filters.statuses.includes(a.status),
  );

  if (filters.dateFrom) {
    filtered = filtered.filter(
      (a) => a.appointment_date >= filters.dateFrom,
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(
      (a) => a.appointment_date <= filters.dateTo,
    );
  }

  const sorted = [...filtered].sort((left, right) => {
    const cmp = (left.updated_at ?? left.created_at).localeCompare(
      right.updated_at ?? right.created_at,
    );
    return filters.sortOrder === "desc" ? -cmp : cmp;
  });

  return sorted;
}