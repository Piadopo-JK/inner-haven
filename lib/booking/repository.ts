import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilitySlotDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  NotificationDTO,
} from "@/lib/booking/contracts";

export interface BookingRepository {
  listCounselors(): Promise<CounselorDirectoryItemDTO[]>;
  getAvailability(counselorId: string, date: string): Promise<AvailabilitySlotDTO[]>;
  createAppointment(input: BookingRequestDTO): Promise<AppointmentDTO>;
  listAppointments(filter: {
    role: "student" | "counselor";
    student_id?: string;
    counselor_id?: string;
    status?: AppointmentStatus;
  }): Promise<AppointmentDTO[]>;
  updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentDTO | null>;
  listNotifications(role: "counselor", counselorId?: string): Promise<NotificationDTO[]>;
}
