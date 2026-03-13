import { AppointmentStatus, BookingRequestDTO, SessionRole } from "@/lib/booking/contracts";
import { InMemoryBookingRepository } from "@/lib/booking/in-memory-repository";
import { BookingRepository } from "@/lib/booking/repository";

class BookingService {
  constructor(private repo: BookingRepository) {}

  listCounselors() {
    return this.repo.listCounselors();
  }

  getAvailability(counselorId: string, date: string) {
    return this.repo.getAvailability(counselorId, date);
  }

  createAppointment(input: BookingRequestDTO) {
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

  updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return this.repo.updateAppointmentStatus(id, status);
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

export const bookingService = new BookingService(new InMemoryBookingRepository());
