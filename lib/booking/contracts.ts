export type SessionMode = "in_person" | "online";
export type AppointmentStatus = "pending" | "approved" | "cancelled" | "completed";
export type SessionRole = "student" | "counselor";

export type NotificationType =
  | "booking_pending"
  | "booking_approved"
  | "booking_declined"
  | "booking_rescheduled"
  | "booking_request"
  | "session_notes"
  | "session_reminder_1h"
  | "session_reminder_1d";

export type CounselorDirectoryItemDTO = {
  counselor_id: string;
  name: string;
  email: string;
  specialization: string;
  office_room: string;
};

export type BookingRequestDTO = {
  student_id: string;
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  mode: SessionMode;
};

export type AppointmentDTO = {
  appointment_id: string;
  student_id: string;
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  mode: SessionMode;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  meeting_link?: string;
};

export type AvailabilitySlotDTO = {
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  available: boolean;
};

export type NotificationDTO = {
  notification_id: string;
  recipient_id: string;
  recipient_role: SessionRole;
  type: NotificationType;
  appointment_id: string;
  message: string;
  created_at: string;
  read: boolean;
};
