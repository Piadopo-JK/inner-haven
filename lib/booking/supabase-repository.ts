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
import { encrypt, decrypt } from "@/lib/crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

function mapAppointmentRowToDTO(row: AppointmentRow, meetingLink?: string): AppointmentDTO {
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
    meeting_link: meetingLink,
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
  /**
   * ID resolution uses the service client so that RLS policies on the
   * students/counselors tables never silently block a lookup and cause the
   * resolver to fall back to the raw auth UUID (which would then fail to
   * match stored primary-key references throughout the DB).
   */
  private async resolveStudentId(id: string) {
    const supabase = createServiceClient();

    const { data: byPrimaryKey } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", id)
      .maybeSingle();

    if (byPrimaryKey?.student_id) {
      return byPrimaryKey.student_id as string;
    }

    const { data: byAuth } = await supabase
      .from("students")
      .select("student_id")
      .eq("auth_user_id", id)
      .maybeSingle();

    if (!byAuth?.student_id) {
      console.warn(`[booking] Could not resolve student ID for: ${id}`);
      return null;
    }

    return byAuth.student_id as string;
  }

  private async resolveCounselorId(id: string) {
    const supabase = createServiceClient();

    const { data: byPrimaryKey } = await supabase
      .from("counselors")
      .select("counselor_id")
      .eq("counselor_id", id)
      .maybeSingle();

    if (byPrimaryKey?.counselor_id) {
      return byPrimaryKey.counselor_id as string;
    }

    const { data: byAuth } = await supabase
      .from("counselors")
      .select("counselor_id")
      .eq("auth_user_id", id)
      .maybeSingle();

    if (!byAuth?.counselor_id) {
      console.warn(`[booking] Could not resolve counselor ID for: ${id}`);
      return null;
    }

    return byAuth.counselor_id as string;
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
      .eq("status", "approved");

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
      .eq("status", "approved");

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
      this.resolveStudentId(input.student_id),
      this.resolveCounselorId(input.counselor_id),
    ]);

    if (!studentId) throw new Error(`Could not resolve student: ${input.student_id}`);
    if (!counselorId) throw new Error(`Could not resolve counselor: ${input.counselor_id}`);
    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from("appointments")
      .select("appointment_id, appointment_time")
      .eq("counselor_id", counselorId)
      .eq("appointment_date", input.appointment_date)
      .eq("status", "approved");

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
      filter.student_id ? this.resolveStudentId(filter.student_id) : Promise.resolve(undefined),
      filter.counselor_id
        ? this.resolveCounselorId(filter.counselor_id)
        : Promise.resolve(undefined),
    ]);

    // If resolution failed for the requested identity, there are no appointments to return.
    if (filter.role === "student" && filter.student_id && !resolvedStudentId) return [];
    if (filter.role === "counselor" && filter.counselor_id && !resolvedCounselorId) return [];
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

    const rows = (data ?? []) as AppointmentRow[];
    if (rows.length === 0) return [];

    const appointmentIds = rows.map((r) => r.appointment_id);
    const { data: meetLinkRows, error: meetLinkError } = await supabase
      .from("meet_links")
      .select("appointment_id, link_url")
      .in("appointment_id", appointmentIds);

    if (meetLinkError) console.error("Failed to fetch meet links", meetLinkError);
    const meetLinkMap = new Map<string, string>(
      ((meetLinkRows ?? []) as { appointment_id: string; link_url: string }[]).map(
        (r) => [r.appointment_id, r.link_url],
      ),
    );

    return rows.map((row) => mapAppointmentRowToDTO(row, meetLinkMap.get(row.appointment_id)));
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentDTO | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapAppointmentRowToDTO(data as AppointmentRow);
  }

  async saveMeetLink(
    appointmentId: string,
    linkUrl: string,
    availableDate: string,
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("meet_links").insert({
      appointment_id: appointmentId,
      link_url: linkUrl,
      available_date: availableDate,
      generated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async getCounselorGoogleToken(counselorId: string): Promise<string | null> {
    const resolvedId = await this.resolveCounselorId(counselorId);
    if (!resolvedId) return null;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("counselors")
      .select("google_refresh_token")
      .eq("counselor_id", resolvedId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch counselor Google token", error);
      return null;
    }

    const stored = data?.google_refresh_token as string | null | undefined;
    if (!stored) return null;

    try {
      return decrypt(stored);
    } catch {
      console.error("Failed to decrypt counselor Google token");
      return null;
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    meetingLink?: string,
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

      let message = `Your booking for ${appointment.appointment_date} at ${appointment.appointment_time} has been ${verb}`;
      if (status === "approved" && meetingLink) {
        message += `. Join your online session: ${meetingLink}`;
      }

      const { error: notificationsError } = await supabase.from("notifications").insert({
        recipient_id: appointment.student_id,
        recipient_role: "student",
        type,
        appointment_id: appointmentId,
        message,
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
    if (!userId) return [];

    const supabase = await createClient();
    const resolvedUserId =
      role === "student"
        ? await this.resolveStudentId(userId)
        : await this.resolveCounselorId(userId);

    if (!resolvedUserId) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_role", role)
      .eq("recipient_id", resolvedUserId)
      .order("sent_at", { ascending: false });

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
    if (!userId) return 0;

    const supabase = await createClient();
    const resolvedUserId =
      role === "student"
        ? await this.resolveStudentId(userId)
        : await this.resolveCounselorId(userId);

    if (!resolvedUserId) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("notification_id", { count: "exact", head: true })
      .eq("recipient_role", role)
      .eq("recipient_id", resolvedUserId)
      .eq("read", false);

    if (error) throw error;

    return count ?? 0;
  }
}
