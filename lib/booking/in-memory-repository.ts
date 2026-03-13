import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilitySlotDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  NotificationDTO,
  SessionRole,
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

    // Notify counselor: new booking request
    this.notifications.push({
      notification_id: crypto.randomUUID(),
      recipient_id: input.counselor_id,
      recipient_role: "counselor",
      type: "booking_request",
      appointment_id: appointment.appointment_id,
      message: `New booking request for ${input.appointment_date} at ${input.appointment_time}`,
      created_at: now,
      read: false,
    });

    // Notify student: booking submitted
    this.notifications.push({
      notification_id: crypto.randomUUID(),
      recipient_id: input.student_id,
      recipient_role: "student",
      type: "booking_pending",
      appointment_id: appointment.appointment_id,
      message: `Your booking for ${input.appointment_date} at ${input.appointment_time} has been submitted`,
      created_at: now,
      read: false,
    });

    return appointment;
  }

  async listAppointments(filter: {
    role: SessionRole;
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

    const appointment = this.appointments[index];
    const now = new Date().toISOString();

    // Notify student about status change
    if (status === "approved") {
      this.notifications.push({
        notification_id: crypto.randomUUID(),
        recipient_id: appointment.student_id,
        recipient_role: "student",
        type: "booking_approved",
        appointment_id: appointmentId,
        message: `Your booking for ${appointment.appointment_date} at ${appointment.appointment_time} has been approved`,
        created_at: now,
        read: false,
      });
    } else if (status === "cancelled") {
      this.notifications.push({
        notification_id: crypto.randomUUID(),
        recipient_id: appointment.student_id,
        recipient_role: "student",
        type: "booking_declined",
        appointment_id: appointmentId,
        message: `Your booking for ${appointment.appointment_date} at ${appointment.appointment_time} has been declined`,
        created_at: now,
        read: false,
      });
    }

    return appointment;
  }

  async listNotifications(role: SessionRole, userId?: string) {
    return this.notifications
      .filter(
        (n) =>
          n.recipient_role === role &&
          (userId ? n.recipient_id === userId : true),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async markNotificationRead(notificationId: string) {
    const index = this.notifications.findIndex(
      (n) => n.notification_id === notificationId,
    );
    if (index === -1) return null;

    this.notifications[index] = { ...this.notifications[index], read: true };
    return this.notifications[index];
  }

  async countUnreadNotifications(role: SessionRole, userId?: string) {
    return this.notifications.filter(
      (n) =>
        n.recipient_role === role &&
        !n.read &&
        (userId ? n.recipient_id === userId : true),
    ).length;
  }
}
