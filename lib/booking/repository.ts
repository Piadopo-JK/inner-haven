import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilitySlotDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  NotificationDTO,
  SessionRole,
} from "@/lib/booking/contracts";

export interface BookingRepository {
  listCounselors(): Promise<CounselorDirectoryItemDTO[]>;
  getAvailability(counselorId: string, date: string): Promise<AvailabilitySlotDTO[]>;
  getAvailableCounselors(date: string, time: string): Promise<CounselorDirectoryItemDTO[]>;
  createAppointment(input: BookingRequestDTO): Promise<AppointmentDTO>;
  listAppointments(filter: {
    role: SessionRole;
    student_id?: string;
    counselor_id?: string;
    status?: AppointmentStatus;
  }): Promise<AppointmentDTO[]>;
  getAppointmentById(appointmentId: string): Promise<AppointmentDTO | null>;
  updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    meetingLink?: string,
  ): Promise<AppointmentDTO | null>;
  saveMeetLink(
    appointmentId: string,
    linkUrl: string,
    availableDate: string,
  ): Promise<void>;
  getCounselorGoogleToken(counselorId: string): Promise<string | null>;
  listNotifications(role: SessionRole, userId?: string): Promise<NotificationDTO[]>;
  markNotificationRead(notificationId: string): Promise<NotificationDTO | null>;
  countUnreadNotifications(role: SessionRole, userId?: string): Promise<number>;
}
