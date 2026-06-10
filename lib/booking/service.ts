import {
  AppointmentDTO,
  AppointmentStatus,
  BookingRequestDTO,
  CounselorScheduleRuleInputDTO,
  SessionRole,
} from "@/lib/booking/contracts";
import { BookingRepository } from "@/lib/booking/repository";
import { SupabaseBookingRepository } from "@/lib/booking/supabase-repository";
import { createMeetSpace } from "@/lib/google-meet/client";

export type SessionUser = {
  userId: string;
  role: SessionRole;
  email: string | undefined;
};

export class BookingService {
  constructor(private repo: BookingRepository) {}

  listCounselors() {
    return this.repo.listCounselors();
  }

  listStudents() {
    return this.repo.listStudents();
  }

  getAvailability(counselorId: string, date: string) {
    return this.repo.getAvailability(counselorId, date);
  }

  getAvailabilityRange(counselorId: string, fromDate: string, toDate: string) {
    return this.repo.getAvailabilityRange(counselorId, fromDate, toDate);
  }

  getAvailableCounselors(date: string, time: string) {
    return this.repo.getAvailableCounselors(date, time);
  }

  async createAppointment(input: BookingRequestDTO) {
    return this.repo.createAppointment(input);
  }

  updateAppointment(id: string, input: BookingRequestDTO) {
    return this.repo.updateAppointment(id, input);
  }

  listAppointments(filter: {
    role: SessionRole;
    student_id?: string;
    counselor_id?: string;
    status?: AppointmentStatus;
  }) {
    return this.repo.listAppointments(filter);
  }

  getAppointmentById(appointmentId: string) {
    return this.repo.getAppointmentById(appointmentId);
  }

  async verifyAppointmentAccess(
    sessionUser: SessionUser,
    appointmentId: string,
  ): Promise<AppointmentDTO | null> {
    const appointment = await this.repo.getAppointmentById(appointmentId);
    if (!appointment) return null;

    if (sessionUser.role === "student") {
      const studentId = await this.repo.resolveStudentId(sessionUser.userId);
      if (!studentId || appointment.student_id !== studentId) return null;
    } else if (sessionUser.role === "counselor") {
      const counselorId = await this.repo.resolveCounselorId(sessionUser.userId);
      if (!counselorId || appointment.counselor_id !== counselorId) return null;
    }

    return appointment;
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    performedBy?: "student" | "counselor",
  ) {
    let meetingLink: string | undefined;

    if (status === "approved") {
      const appointment = await this.repo.getAppointmentById(id);
      if (appointment?.mode === "online") {
        const counselorToken = await this.repo.getCounselorGoogleToken(appointment.counselor_id);
        if (counselorToken) {
          try {
            meetingLink = await createMeetSpace(counselorToken);
          } catch (error) {
            const message = error instanceof Error ? error.message : "";
            const isReconnectableTokenError =
              /invalid_grant|invalid (refresh token|credentials)|token has been expired|token has been revoked|failed to obtain google access token/i.test(
                message,
              );

            if (isReconnectableTokenError) {
              throw new Error(
                "GOOGLE_RECONNECT_REQUIRED:Your Google connection expired. Reconnect Google to approve online appointments with Meet links.",
              );
            }

            throw new Error(
              "GOOGLE_MEET_CREATE_FAILED:Unable to create a Google Meet link right now. Please try again.",
            );
          }
          try {
            await this.repo.saveMeetLink(id, meetingLink);
          } catch (error) {
            const message = error instanceof Error ? error.message : "";
            throw new Error(
              `GOOGLE_MEET_CREATE_FAILED:Unable to save the meeting link. ${message}`,
            );
          }
        } else {
          throw new Error(
            "GOOGLE_RECONNECT_REQUIRED:Connect Google to approve online appointments with Meet links.",
          );
        }
      }
    }

    try {
      return this.repo.updateAppointmentStatus(id, status, meetingLink, performedBy);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new Error(
        `APPOINTMENT_STATUS_UPDATE_FAILED:Unable to update appointment status. ${message}`,
      );
    }
  }

  rescheduleAppointment(id: string, appointmentDate: string, appointmentTime: string) {
    return this.repo.rescheduleAppointment(id, appointmentDate, appointmentTime);
  }

  listNotifications(role: SessionRole, userId?: string) {
    return this.repo.listNotifications(role, userId);
  }

  markNotificationRead(notificationId: string) {
    return this.repo.markNotificationRead(notificationId);
  }

  markAllNotificationsRead(role: SessionRole, userId?: string) {
    return this.repo.markAllNotificationsRead(role, userId);
  }

  countUnreadNotifications(role: SessionRole, userId?: string) {
    return this.repo.countUnreadNotifications(role, userId);
  }

  countUnreadAnonymousMessages(role: SessionRole, userId?: string) {
    return this.repo.countUnreadAnonymousMessages(role, userId);
  }

  getCounselorGoogleToken(counselorId: string) {
    return this.repo.getCounselorGoogleToken(counselorId);
  }

  resolveCounselorId(id: string) {
    return this.repo.resolveCounselorId(id);
  }

  resolveStudentId(id: string) {
    return this.repo.resolveStudentId(id);
  }

  ensureStudentProfile(input: {
    authUserId: string;
    email?: string;
    name?: string | null;
    avatarUrl?: string | null;
  }) {
    return this.repo.ensureStudentProfile(input);
  }

  getCounselorSchedule(counselorId: string) {
    return this.repo.getCounselorSchedule(counselorId);
  }

  upsertCounselorSchedule(counselorId: string, rules: CounselorScheduleRuleInputDTO[]) {
    return this.repo.upsertCounselorSchedule(counselorId, rules);
  }

  getSessionNote(appointmentId: string) {
    return this.repo.getSessionNote(appointmentId);
  }

  listSessionNotesByAppointmentIds(ids: string[]) {
    return this.repo.listSessionNotesByAppointmentIds(ids);
  }

  upsertSessionNote(
    appointmentId: string,
    input: {
      note_content: string;
      recommendations: string[];
      follow_up: string;
    },
    counselorId: string,
  ) {
    return this.repo.upsertSessionNote(appointmentId, input, counselorId);
  }
}

function createBookingRepository(): BookingRepository {
  return new SupabaseBookingRepository();
}

export const bookingService = new BookingService(createBookingRepository());
