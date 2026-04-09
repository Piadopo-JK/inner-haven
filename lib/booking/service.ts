import { AppointmentStatus, BookingRequestDTO, SessionRole } from "@/lib/booking/contracts";
import { BookingRepository } from "@/lib/booking/repository";
import { SupabaseBookingRepository } from "@/lib/booking/supabase-repository";
import { createMeetSpace } from "@/lib/google-meet/client";

class BookingService {
  constructor(private repo: BookingRepository) {}

  listCounselors() {
    return this.repo.listCounselors();
  }

  getAvailability(counselorId: string, date: string) {
    return this.repo.getAvailability(counselorId, date);
  }

  getAvailableCounselors(date: string, time: string) {
    return this.repo.getAvailableCounselors(date, time);
  }

  async createAppointment(input: BookingRequestDTO) {
    return this.repo.createAppointment(input);
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
          await this.repo.saveMeetLink(id, meetingLink, appointment.appointment_date);
        } else {
          console.warn(
            `[booking] Counselor ${appointment.counselor_id} has no Google token. Meet link skipped.`,
          );
        }
      }
    }

    return this.repo.updateAppointmentStatus(id, status, meetingLink);
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
}

function createBookingRepository(): BookingRepository {
  console.info("[booking] Using SupabaseBookingRepository");
  return new SupabaseBookingRepository();
}

export const bookingService = new BookingService(createBookingRepository());
