import { AppointmentStatus, BookingRequestDTO, SessionRole } from "@/lib/booking/contracts";
import { InMemoryBookingRepository } from "@/lib/booking/in-memory-repository";
import { BookingRepository } from "@/lib/booking/repository";
import { SupabaseBookingRepository } from "@/lib/booking/supabase-repository";

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

function createBookingRepository(): BookingRepository {
  const mode = process.env.BOOKING_REPOSITORY?.toLowerCase();

  if (mode === "memory") {
    console.info("[booking] Using InMemoryBookingRepository");
    return new InMemoryBookingRepository();
  }

  console.info("[booking] Using SupabaseBookingRepository");
  return new SupabaseBookingRepository();
}

export const bookingService = new BookingService(createBookingRepository());
