import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilitySlotDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  NotificationDTO,
} from "@/lib/booking/contracts";
import { BookingRepository } from "@/lib/booking/repository";

const defaultSlots = ["09:00", "10:00", "14:00", "15:00"];

export class InMemoryBookingRepository implements BookingRepository {
  private counselors: CounselorDirectoryItemDTO[] = [
    {
      counselor_id: "cslr-001",
      name: "Mr. Juan Dela Cruz",
      email: "juan.cruz@school.edu",
      specialization: "Career Counseling",
      office_room: "Guidance 99",
    },
    {
      counselor_id: "cslr-002",
      name: "Ms. Hanna",
      email: "hanna@school.edu",
      specialization: "Student Wellbeing",
      office_room: "Guidance 114",
    },
  ];

  private appointments: AppointmentDTO[] = [];
  private notifications: NotificationDTO[] = [];

  async listCounselors() {
    return this.counselors;
  }

  async getAvailability(counselorId: string, date: string) {
    const taken = new Set(
      this.appointments
        .filter(
          (item) =>
            item.counselor_id === counselorId &&
            item.appointment_date === date &&
            ["pending", "approved"].includes(item.status),
        )
        .map((item) => item.appointment_time),
    );

    return defaultSlots.map<AvailabilitySlotDTO>((time) => ({
      counselor_id: counselorId,
      appointment_date: date,
      appointment_time: time,
      available: !taken.has(time),
    }));
  }

  async createAppointment(input: BookingRequestDTO) {
    const now = new Date().toISOString();
    const appointment: AppointmentDTO = {
      appointment_id: crypto.randomUUID(),
      student_id: input.student_id,
      counselor_id: input.counselor_id,
      appointment_date: input.appointment_date,
      appointment_time: input.appointment_time,
      reason: input.reason,
      mode: input.mode,
      status: "pending",
      created_at: now,
      updated_at: now,
    };

    this.appointments.push(appointment);
    this.notifications.push({
      notification_id: crypto.randomUUID(),
      counselor_id: input.counselor_id,
      appointment_id: appointment.appointment_id,
      message: `New pending appointment request for ${input.appointment_date} ${input.appointment_time}`,
      created_at: now,
      read: false,
    });

    return appointment;
  }

  async listAppointments(filter: {
    role: "student" | "counselor";
    student_id?: string;
    counselor_id?: string;
    status?: AppointmentStatus;
  }) {
    let results =
      filter.role === "student"
        ? this.appointments.filter((item) => item.student_id === filter.student_id)
        : this.appointments.filter((item) => item.counselor_id === filter.counselor_id);

    if (filter.status) {
      results = results.filter((item) => item.status === filter.status);
    }

    return results;
  }

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    const index = this.appointments.findIndex((item) => item.appointment_id === appointmentId);
    if (index === -1) return null;

    this.appointments[index] = {
      ...this.appointments[index],
      status,
      updated_at: new Date().toISOString(),
    };

    return this.appointments[index];
  }

  async listNotifications(role: "counselor", counselorId?: string) {
    if (role !== "counselor") return [];

    return this.notifications.filter((item) =>
      counselorId ? item.counselor_id === counselorId : true,
    );
  }
}
