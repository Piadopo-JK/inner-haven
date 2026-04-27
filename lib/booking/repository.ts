import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilityResponseDTO,
  AvailabilitySlotDTO,
  CounselorScheduleRuleDTO,
  CounselorScheduleRuleInputDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  StudentDirectoryItemDTO,
  NotificationDTO,
  SessionRole,
} from "@/lib/booking/contracts";

export interface BookingRepository {
  listCounselors(): Promise<CounselorDirectoryItemDTO[]>;
  listStudents(): Promise<StudentDirectoryItemDTO[]>;
  getAvailability(counselorId: string, date: string): Promise<AvailabilityResponseDTO>;
  getAvailabilityRange(counselorId: string, fromDate: string, toDate: string): Promise<Record<string, AvailabilityResponseDTO>>;
  getAvailableCounselors(date: string, time: string): Promise<CounselorDirectoryItemDTO[]>;
  createAppointment(input: BookingRequestDTO): Promise<AppointmentDTO>;
  updateAppointment(
    appointmentId: string,
    input: BookingRequestDTO,
  ): Promise<AppointmentDTO | null>;
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
  rescheduleAppointment(
    appointmentId: string,
    appointmentDate: string,
    appointmentTime: string,
  ): Promise<AppointmentDTO | null>;
  saveMeetLink(
    appointmentId: string,
    linkUrl: string,
  ): Promise<void>;
  getCounselorGoogleToken(counselorId: string): Promise<string | null>;
  listNotifications(role: SessionRole, userId?: string): Promise<NotificationDTO[]>;
  markNotificationRead(notificationId: string): Promise<NotificationDTO | null>;
  countUnreadNotifications(role: SessionRole, userId?: string): Promise<number>;
  resolveCounselorId(id: string): Promise<string | null>;
  getCounselorSchedule(counselorId: string): Promise<CounselorScheduleRuleDTO[]>;
  upsertCounselorSchedule(
    counselorId: string,
    rules: CounselorScheduleRuleInputDTO[],
  ): Promise<void>;
}
