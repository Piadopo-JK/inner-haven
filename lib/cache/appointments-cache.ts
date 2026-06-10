import { cache } from "react";
import { unstable_cache } from "next/cache";

import { AppointmentDTO, CounselorDirectoryItemDTO, SessionNoteDTO, SessionRole, StudentDirectoryItemDTO } from "@/lib/booking/contracts";
import { bookingService, SessionUser } from "@/lib/booking/service";

export function appointmentsListTag(role: SessionRole, authUserId: string) {
  return `appointments:list:${role}:${authUserId}`;
}

export function appointmentTag(appointmentId: string) {
  return `appointment:${appointmentId}`;
}

export function sessionNotesTag(appointmentId: string) {
  return `session-notes:${appointmentId}`;
}

export const getAppointmentsByUserCached = cache(
  async (role: SessionRole, authUserId: string): Promise<AppointmentDTO[]> => {
    return bookingService.listAppointments(
      role === "counselor"
        ? { role, counselor_id: authUserId }
        : { role, student_id: authUserId },
    );
  },
);

export const getAppointmentByIdCached = cache(
  async (
    sessionUser: SessionUser,
    appointmentId: string,
  ): Promise<AppointmentDTO | null> => {
    return bookingService.verifyAppointmentAccess(sessionUser, appointmentId);
  },
);

export const getSessionNoteCached = cache(
  async (
    sessionUser: SessionUser,
    appointmentId: string,
  ): Promise<SessionNoteDTO | null> => {
    const hasAccess = await bookingService.verifyAppointmentAccess(sessionUser, appointmentId);
    if (!hasAccess) return null;

    const note = await bookingService.getSessionNote(appointmentId);
    return note ?? null;
  },
);

const DIRECTORY_REVALIDATE_S = 300;

const getCachedCounselors = unstable_cache(
  async (): Promise<CounselorDirectoryItemDTO[]> => {
    return bookingService.listCounselors();
  },
  ["counselor-directory"],
  { revalidate: DIRECTORY_REVALIDATE_S, tags: ["counselor-directory"] },
);

export function getCounselorsCached() {
  return getCachedCounselors();
}

const getCachedStudents = unstable_cache(
  async (): Promise<StudentDirectoryItemDTO[]> => {
    return bookingService.listStudents();
  },
  ["student-directory"],
  { revalidate: DIRECTORY_REVALIDATE_S, tags: ["student-directory"] },
);

export function getStudentsCached() {
  return getCachedStudents();
}
