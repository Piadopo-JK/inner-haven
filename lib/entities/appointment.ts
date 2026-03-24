import { AppointmentStatus, SessionMode } from "@/lib/booking/contracts";

export type AppointmentProps = {
  appointment_id: string;
  student_id: string;
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  mode: SessionMode;
  reason?: string;
  status: AppointmentStatus;
  created_at?: string;
  updated_at?: string;
};

export class Appointment {
  appointment_id: string;
  student_id: string;
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  mode: SessionMode;
  reason?: string;
  status: AppointmentStatus;
  created_at?: string;
  updated_at?: string;

  constructor(props: AppointmentProps) {
    this.appointment_id = props.appointment_id;
    this.student_id = props.student_id;
    this.counselor_id = props.counselor_id;
    this.appointment_date = props.appointment_date;
    this.appointment_time = props.appointment_time;
    this.mode = props.mode;
    this.reason = props.reason;
    this.status = props.status;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;
  }
}
