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
import { createClient } from "@/lib/supabase/server";

const defaultSlots = ["09:00", "10:00", "14:00", "15:00"];

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

type CounselorRow = {
  counselor_id: string;
  name: string;
  email: string;
  specialization: string | null;
  office_room: string | null;
};

type AppointmentRow = {
  appointment_id: string;
  student_id: string;
  counselor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  mode: string;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type NotificationRow = {
  notification_id: string;
  recipient_id: string;
  recipient_role: SessionRole;
  type: NotificationDTO["type"];
  appointment_id: string;
  message: string;
  read: boolean | null;
  created_at?: string | null;
  sent_at?: string | null;
};

function mapCounselorRowToDTO(row: CounselorRow): CounselorDirectoryItemDTO {
  return {
    counselor_id: row.counselor_id,
    name: row.name,
    email: row.email,
    specialization: row.specialization ?? "",
    office_room: row.office_room ?? "",
  };
}

function mapAppointmentRowToDTO(row: AppointmentRow): AppointmentDTO {
  return {
    appointment_id: row.appointment_id,
    student_id: row.student_id,
    counselor_id: row.counselor_id,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time,
    reason: row.reason ?? "",
    mode: row.mode as AppointmentDTO["mode"],
    status: row.status as AppointmentDTO["status"],
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  };
}

function mapNotificationRowToDTO(row: NotificationRow): NotificationDTO {
  return {
    notification_id: row.notification_id,
    recipient_id: row.recipient_id,
    recipient_role: row.recipient_role,
    type: row.type,
    appointment_id: row.appointment_id,
    message: row.message,
    created_at: row.created_at ?? row.sent_at ?? new Date().toISOString(),
    read: row.read ?? false,
  };
}

export class SupabaseBookingRepository implements BookingRepository {
  private async resolveStudentId(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
    const { data: byPrimaryKey, error: byPrimaryKeyError } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", id)
      .maybeSingle();

    if (!byPrimaryKeyError && byPrimaryKey?.student_id) {
      return byPrimaryKey.student_id as string;
    }

    const { data: byAuth } = await supabase
      .from("students")
      .select("student_id")
      .eq("auth_user_id", id)
      .maybeSingle();

    return (byAuth?.student_id as string | undefined) ?? id;
  }

  private async resolveCounselorId(
    supabase: Awaited<ReturnType<typeof createClient>>,
    id: string,
  ) {
    const { data: byPrimaryKey, error: byPrimaryKeyError } = await supabase
      .from("counselors")
      .select("counselor_id")
      .eq("counselor_id", id)
      .maybeSingle();

    if (!byPrimaryKeyError && byPrimaryKey?.counselor_id) {
      return byPrimaryKey.counselor_id as string;
    }

    const { data: byAuth } = await supabase
      .from("counselors")
      .select("counselor_id")
      .eq("auth_user_id", id)
      .maybeSingle();

    return (byAuth?.counselor_id as string | undefined) ?? id;
  }

  async listCounselors(): Promise<CounselorDirectoryItemDTO[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("counselors")
      .select("counselor_id, name, email, specialization, office_room")
      .order("name", { ascending: true });

    if (error) throw error;

    return ((data ?? []) as CounselorRow[]).map(mapCounselorRowToDTO);
  }

  async getAvailability(
    counselorId: string,
    date: string,
  ): Promise<AvailabilitySlotDTO[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("counselor_id", counselorId)
      .eq("appointment_date", date)
      .in("status", ["pending", "approved"]);

    if (error) throw error;

    const taken = new Set(
      (data ?? []).map((item) => normalizeTime(item.appointment_time as string)),
    );

    return defaultSlots.map<AvailabilitySlotDTO>((time) => ({
      counselor_id: counselorId,
      appointment_date: date,
      appointment_time: time,
      available: !taken.has(time),
    }));
  }

  async getAvailableCounselors(
    date: string,
    time: string,
  ): Promise<CounselorDirectoryItemDTO[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("counselor_id, appointment_time")
      .eq("appointment_date", date)
      .in("status", ["pending", "approved"]);

    if (error) throw error;

    const takenCounselorIds = new Set(
      (data ?? [])
        .filter((row) => normalizeTime(row.appointment_time as string) === time)
        .map((row) => row.counselor_id as string),
    );
    const counselors = await this.listCounselors();

    return counselors.filter((counselor) => !takenCounselorIds.has(counselor.counselor_id));
  }

  async createAppointment(input: BookingRequestDTO): Promise<AppointmentDTO> {
    const supabase = await createClient();
    const [studentId, counselorId] = await Promise.all([
      this.resolveStudentId(supabase, input.student_id),
      this.resolveCounselorId(supabase, input.counselor_id),
    ]);

    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from("appointments")
      .select("appointment_id, appointment_time")
      .eq("counselor_id", counselorId)
      .eq("appointment_date", input.appointment_date)
      .in("status", ["pending", "approved"]);

    if (conflictError) throw conflictError;

    const hasConflict = (conflictingAppointments ?? []).some(
      (row) => normalizeTime(row.appointment_time as string) === input.appointment_time,
    );

    if (hasConflict) {
      throw new Error("That timeslot is already taken");
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        student_id: studentId,
        counselor_id: counselorId,
        appointment_date: input.appointment_date,
        appointment_time: input.appointment_time,
        reason: input.reason,
        mode: input.mode,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw error;

    const appointment = mapAppointmentRowToDTO(data as AppointmentRow);
    const now = new Date().toISOString();

    const { error: notificationsError } = await supabase.from("notifications").insert([
      {
        recipient_id: counselorId,
        recipient_role: "counselor",
        type: "booking_request",
        appointment_id: appointment.appointment_id,
        message: `New booking request for ${input.appointment_date} at ${input.appointment_time}`,
        sent_at: now,
        read: false,
      },
      {
        recipient_id: studentId,
        recipient_role: "student",
        type: "booking_pending",
        appointment_id: appointment.appointment_id,
        message: `Your booking for ${input.appointment_date} at ${input.appointment_time} has been submitted`,
        sent_at: now,
        read: false,
      },
    ]);

    if (notificationsError) {
      console.error("Failed to create booking notifications", notificationsError);
    }

    return appointment;
  }

  async listAppointments(filter: {
    role: SessionRole;
    student_id?: string;
    counselor_id?: string;
    status?: AppointmentStatus;
  }): Promise<AppointmentDTO[]> {
    const supabase = await createClient();
    const [resolvedStudentId, resolvedCounselorId] = await Promise.all([
      filter.student_id ? this.resolveStudentId(supabase, filter.student_id) : Promise.resolve(undefined),
      filter.counselor_id
        ? this.resolveCounselorId(supabase, filter.counselor_id)
        : Promise.resolve(undefined),
    ]);

    let query = supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (filter.role === "student" && resolvedStudentId) {
      query = query.eq("student_id", resolvedStudentId);
    }

    if (filter.role === "counselor" && resolvedCounselorId) {
      query = query.eq("counselor_id", resolvedCounselorId);
    }

    if (filter.status) {
      query = query.eq("status", filter.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as AppointmentRow[]).map(mapAppointmentRowToDTO);
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentDTO | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const appointment = mapAppointmentRowToDTO(data as AppointmentRow);
    const now = new Date().toISOString();

    if (status === "approved" || status === "cancelled") {
      const type = status === "approved" ? "booking_approved" : "booking_declined";
      const verb = status === "approved" ? "approved" : "declined";

      const { error: notificationsError } = await supabase.from("notifications").insert({
        recipient_id: appointment.student_id,
        recipient_role: "student",
        type,
        appointment_id: appointmentId,
        message: `Your booking for ${appointment.appointment_date} at ${appointment.appointment_time} has been ${verb}`,
        sent_at: now,
        read: false,
      });

      if (notificationsError) {
        console.error("Failed to create status update notification", notificationsError);
      }
    }

    return appointment;
  }

  async listNotifications(
    role: SessionRole,
    userId?: string,
  ): Promise<NotificationDTO[]> {
    const supabase = await createClient();
    const resolvedUserId =
      userId && role === "student"
        ? await this.resolveStudentId(supabase, userId)
        : userId && role === "counselor"
          ? await this.resolveCounselorId(supabase, userId)
          : userId;

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_role", role)
      .order("sent_at", { ascending: false });

    if (resolvedUserId) {
      query = query.eq("recipient_id", resolvedUserId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as NotificationRow[]).map(mapNotificationRowToDTO);
  }

  async markNotificationRead(
    notificationId: string,
  ): Promise<NotificationDTO | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("notification_id", notificationId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapNotificationRowToDTO(data as NotificationRow);
  }

  async countUnreadNotifications(
    role: SessionRole,
    userId?: string,
  ): Promise<number> {
    const supabase = await createClient();
    const resolvedUserId =
      userId && role === "student"
        ? await this.resolveStudentId(supabase, userId)
        : userId && role === "counselor"
          ? await this.resolveCounselorId(supabase, userId)
          : userId;

    let query = supabase
      .from("notifications")
      .select("notification_id", { count: "exact", head: true })
      .eq("recipient_role", role)
      .eq("read", false);

    if (resolvedUserId) {
      query = query.eq("recipient_id", resolvedUserId);
    }

    const { count, error } = await query;
    if (error) throw error;

    return count ?? 0;
  }
}
