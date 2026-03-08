/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilitySlotDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  NotificationDTO,
} from "@/lib/booking/contracts";
import { BookingRepository } from "@/lib/booking/repository";

// implement each method when wiring to Supabase.
export class SupabaseBookingRepository implements BookingRepository {
  async listCounselors(): Promise<CounselorDirectoryItemDTO[]> {
    throw new Error("Not implemented: listCounselors");
  }

  async getAvailability(
    _counselorId: string,
    _date: string,
  ): Promise<AvailabilitySlotDTO[]> {
    throw new Error("Not implemented: getAvailability");
  }

  async createAppointment(_input: BookingRequestDTO): Promise<AppointmentDTO> {
    throw new Error("Not implemented: createAppointment");
  }

  async listAppointments(_filter: {
    role: "student" | "counselor";
    student_id?: string;
    counselor_id?: string;
    status?: AppointmentStatus;
  }): Promise<AppointmentDTO[]> {
    throw new Error("Not implemented: listAppointments");
  }

  async updateAppointmentStatus(
    _appointmentId: string,
    _status: AppointmentStatus,
  ): Promise<AppointmentDTO | null> {
    throw new Error("Not implemented: updateAppointmentStatus");
  }

  async listNotifications(
    _role: "counselor",
    _counselorId?: string,
  ): Promise<NotificationDTO[]> {
    throw new Error("Not implemented: listNotifications");
  }
}
