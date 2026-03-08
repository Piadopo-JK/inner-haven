import { AppointmentStatus, BookingRequestDTO } from "@/lib/booking/contracts";
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
    role: "student" | "counselor";
    student_id?: string;
    counselor_id?: string;
    status?: import("@/lib/booking/contracts").AppointmentStatus;
  }) {
    return this.repo.listAppointments(filter);
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return this.repo.updateAppointmentStatus(id, status);
  }

  listNotifications(role: "counselor", counselorId?: string) {
    return this.repo.listNotifications(role, counselorId);
  }
}

export const bookingService = new BookingService(new InMemoryBookingRepository());
