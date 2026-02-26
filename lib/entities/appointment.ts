export enum SessionType {
  IN_PERSON = "in_person",
  ONLINE = "online",
}

export enum AppointmentStatus {
  PENDING = "pending",
  APPROVED = "approved",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export class Appointment {
  appointment_id: string;
  student_id: string;
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  mode: SessionType;
  reason: string;
  status: AppointmentStatus;
  created_at: string;

  constructor(init?: Partial<Appointment>) {
    this.appointment_id = init?.appointment_id ?? "";
    this.student_id = init?.student_id ?? "";
    this.counselor_id = init?.counselor_id ?? "";
    this.appointment_date = init?.appointment_date ?? "";
    this.appointment_time = init?.appointment_time ?? "";
    this.mode = init?.mode ?? SessionType.IN_PERSON;
    this.reason = init?.reason ?? "";
    this.status = init?.status ?? AppointmentStatus.PENDING;
    this.created_at = init?.created_at ?? "";
  }
}
