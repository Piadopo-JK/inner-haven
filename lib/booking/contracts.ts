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
  about?: string;
  avatar_url?: string;
};

export type StudentDirectoryItemDTO = {
  student_id: string;
  name: string;
  avatar_url?: string;
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
  reason_preview: string;
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

export type AvailabilityEmptyState =
  | "available"
  | "not_configured"
  | "fully_booked"
  | "past_time_only";

export type AvailabilityResponseDTO = {
  slots: AvailabilitySlotDTO[];
  empty_state: AvailabilityEmptyState;
  schedule_summary?: {
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    breaks: AvailabilityBreakDTO[];
    source: "rule" | "legacy_slot" | "none";
  };
};

export type AvailabilityWindowResponseDTO = {
  counselor_id: string;
  from: string;
  to: string;
  by_date: Record<string, AvailabilityResponseDTO>;
};

export type AvailabilityBreakDTO = {
  start_time: string;
  end_time: string;
};

export type CounselorScheduleRuleDTO = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  breaks: AvailabilityBreakDTO[];
};

export type CounselorScheduleRuleInputDTO = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active?: boolean;
  breaks?: AvailabilityBreakDTO[];
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


