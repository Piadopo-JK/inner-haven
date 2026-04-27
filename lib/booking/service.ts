import {
  AppointmentStatus,
  BookingRequestDTO,
  CounselorScheduleRuleInputDTO,
  SessionRole,
} from "@/lib/booking/contracts";
import { BookingRepository } from "@/lib/booking/repository";
import { SupabaseBookingRepository } from "@/lib/booking/supabase-repository";
import { createMeetSpace } from "@/lib/google-meet/client";

class BookingService {
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

  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    let meetingLink: string | undefined;

    if (status === "approved") {
      const appointment = await this.repo.getAppointmentById(id);
      if (appointment?.mode === "online") {
        const counselorToken = await this.repo.getCounselorGoogleToken(appointment.counselor_id);
        if (counselorToken) {
          meetingLink = await createMeetSpace(counselorToken);
          await this.repo.saveMeetLink(id, meetingLink);
        } else {
          console.warn(
            `[booking] Counselor ${appointment.counselor_id} has no Google token. Meet link skipped.`,
          );
        }
      }
    }

    return this.repo.updateAppointmentStatus(id, status, meetingLink);
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

  countUnreadNotifications(role: SessionRole, userId?: string) {
    return this.repo.countUnreadNotifications(role, userId);
  }

  getCounselorGoogleToken(counselorId: string) {
    return this.repo.getCounselorGoogleToken(counselorId);
  }

  resolveCounselorId(id: string) {
    return this.repo.resolveCounselorId(id);
  }

  getCounselorSchedule(counselorId: string) {
    return this.repo.getCounselorSchedule(counselorId);
  }

  upsertCounselorSchedule(counselorId: string, rules: CounselorScheduleRuleInputDTO[]) {
    return this.repo.upsertCounselorSchedule(counselorId, rules);
  }
}

function createBookingRepository(): BookingRepository {
  console.info("[booking] Using SupabaseBookingRepository");
  return new SupabaseBookingRepository();
}

export const bookingService = new BookingService(createBookingRepository());
