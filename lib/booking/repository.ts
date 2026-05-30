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
  SessionNoteDTO,
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
  markAllNotificationsRead(role: SessionRole, userId?: string): Promise<number>;
  countUnreadNotifications(role: SessionRole, userId?: string): Promise<number>;
  resolveStudentId(id: string): Promise<string | null>;
  resolveCounselorId(id: string): Promise<string | null>;
  ensureStudentProfile(input: {
    authUserId: string;
    email?: string;
    name?: string | null;
    avatarUrl?: string | null;
  }): Promise<{ created: boolean; studentId: string | null }>;
  getCounselorSchedule(counselorId: string): Promise<CounselorScheduleRuleDTO[]>;
  upsertCounselorSchedule(
    counselorId: string,
    rules: CounselorScheduleRuleInputDTO[],
  ): Promise<void>;
  getSessionNote(appointmentId: string): Promise<SessionNoteDTO | null>;
  listSessionNotesByAppointmentIds(appointmentIds: string[]): Promise<Map<string, SessionNoteDTO>>;
  upsertSessionNote(
    appointmentId: string,
    input: {
      note_content: string;
      recommendations: string[];
      follow_up: string;
    },
    counselorId: string,
  ): Promise<SessionNoteDTO>;
}
