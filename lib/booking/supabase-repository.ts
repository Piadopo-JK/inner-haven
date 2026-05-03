import {
  AppointmentDTO,
  AppointmentStatus,
  AvailabilityBreakDTO,
  AvailabilityEmptyState,
  AvailabilityResponseDTO,
  AvailabilitySlotDTO,
  BookingRequestDTO,
  CounselorDirectoryItemDTO,
  CounselorScheduleRuleDTO,
  CounselorScheduleRuleInputDTO,
  StudentDirectoryItemDTO,
  NotificationDTO,
  SessionNoteDTO,
  SessionRole,
} from "@/lib/booking/contracts";
import { BookingRepository } from "@/lib/booking/repository";
import { encrypt, decrypt } from "@/lib/crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function getUtcDayOfWeek(date: string) {
  const { year, month, day } = parseDateParts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function timeToMinutes(value: string) {
  const [hours, minutes] = normalizeTime(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeBreaks(raw: unknown): AvailabilityBreakDTO[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const maybeStart = (item as { start_time?: unknown }).start_time;
      const maybeEnd = (item as { end_time?: unknown }).end_time;

      if (typeof maybeStart !== "string" || typeof maybeEnd !== "string") {
        return null;
      }

      return {
        start_time: normalizeTime(maybeStart),
        end_time: normalizeTime(maybeEnd),
      };
    })
    .filter((item): item is AvailabilityBreakDTO => {
      if (!item) return false;
      return timeToMinutes(item.start_time) < timeToMinutes(item.end_time);
    });
}

function isOverlappingBreak(slotStart: number, slotEnd: number, breaks: AvailabilityBreakDTO[]) {
  return breaks.some((breakRange) => {
    const breakStart = timeToMinutes(breakRange.start_time);
    const breakEnd = timeToMinutes(breakRange.end_time);
    return slotStart < breakEnd && breakStart < slotEnd;
  });
}

function generateSlotsFromRule(rule: ScheduleRuleRow) {
  const start = timeToMinutes(rule.start_time);
  const end = timeToMinutes(rule.end_time);
  const duration = Math.max(15, Math.min(180, rule.slot_duration_minutes ?? 60));
  const breaks = normalizeBreaks(rule.breaks);

  const slots: string[] = [];
  let cursor = start;

  while (cursor + duration <= end) {
    const slotEnd = cursor + duration;
    if (!isOverlappingBreak(cursor, slotEnd, breaks)) {
      slots.push(minutesToTime(cursor));
    }
    cursor += duration;
  }

  return slots;
}

type CounselorRow = {
  counselor_id: string;
  name: string;
  email: string;
  specialization: string | null;
  office_room: string | null;
  about: string | null;
  avatar_url: string | null;
};

type StudentRow = {
  student_id: string;
  name: string;
  avatar_url: string | null;
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
  meeting_link?: string | null;
};

type NotificationRow = {
  notification_id: string;
  recipient_id: string;
  recipient_role: SessionRole;
  type: NotificationDTO["type"];
  appointment_id: string | null;
  anonymous_thread_id?: string | null;
  message: string;
  read: boolean | null;
  created_at?: string | null;
  sent_at?: string | null;
};

type ScheduleRuleRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  breaks: unknown;
};

type SessionNoteRow = {
  note_id: string;
  appointment_id: string;
  note_content: string | null;
  recommendations: string[] | null;
  follow_up: string | null;
  created_at: string;
  updated_at: string | null;
  counselor_id: string | null;
};

function mapCounselorRowToDTO(row: CounselorRow): CounselorDirectoryItemDTO {
  return {
    counselor_id: row.counselor_id,
    name: row.name,
    email: row.email,
    specialization: row.specialization ?? "",
    office_room: row.office_room ?? "",
    about: row.about ?? "",
    avatar_url: row.avatar_url ?? undefined,
  };
}

function mapStudentRowToDTO(row: StudentRow): StudentDirectoryItemDTO {
  return {
    student_id: row.student_id,
    name: row.name,
    avatar_url: row.avatar_url ?? undefined,
  };
}

const REASON_PREVIEW_MAX = 80;

function toReasonPreview(reason: string) {
  const normalized = reason.replace(/\s+/g, " ").trim();
  if (normalized.length <= REASON_PREVIEW_MAX) {
    return normalized;
  }
  return `${normalized.slice(0, REASON_PREVIEW_MAX).trimEnd()}...`;
}

function mapAppointmentRowToDTO(row: AppointmentRow, meetingLink?: string): AppointmentDTO {
  const reason = row.reason ?? "";
  const resolvedMeetingLink = meetingLink ?? row.meeting_link ?? undefined;
  return {
    appointment_id: row.appointment_id,
    student_id: row.student_id,
    counselor_id: row.counselor_id,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time,
    reason,
    reason_preview: toReasonPreview(reason),
    mode: row.mode as AppointmentDTO["mode"],
    status: row.status as AppointmentDTO["status"],
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    meeting_link: resolvedMeetingLink,
  };
}

function getAppointmentDateTimeMs(row: Pick<AppointmentRow, "appointment_date" | "appointment_time">) {
  return new Date(`${row.appointment_date}T${normalizeTime(row.appointment_time)}:00`).getTime();
}

function mapNotificationRowToDTO(row: NotificationRow): NotificationDTO {
  return {
    notification_id: row.notification_id,
    recipient_id: row.recipient_id,
    recipient_role: row.recipient_role,
    type: row.type,
    appointment_id: row.appointment_id,
    anonymous_thread_id: row.anonymous_thread_id ?? null,
    message: row.message,
    created_at: row.created_at ?? row.sent_at ?? new Date().toISOString(),
    read: row.read ?? false,
  };
}

function mapScheduleRuleToDTO(row: ScheduleRuleRow): CounselorScheduleRuleDTO {
  return {
    day_of_week: row.day_of_week,
    start_time: normalizeTime(row.start_time),
    end_time: normalizeTime(row.end_time),
    slot_duration_minutes: row.slot_duration_minutes ?? 60,
    is_active: row.is_active ?? true,
    breaks: normalizeBreaks(row.breaks),
  };
}

function mapSessionNoteRowToDTO(row: SessionNoteRow): SessionNoteDTO {
  return {
    note_id: row.note_id,
    appointment_id: row.appointment_id,
    note_content: row.note_content ?? "",
    recommendations: Array.isArray(row.recommendations)
      ? row.recommendations.map((item) => String(item).trim()).filter(Boolean)
      : [],
    follow_up: row.follow_up ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    counselor_id: row.counselor_id ?? null,
  };
}

function isMissingColumnError(error: unknown, table: string, column: string) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42703" &&
    typeof candidate.message === "string" &&
    candidate.message.includes(`${table}.${column}`)
  );
}

export class SupabaseBookingRepository implements BookingRepository {
  /**
   * ID resolution uses the service client so that RLS policies on the
   * students/counselors tables never silently block a lookup and cause the
   * resolver to fall back to the raw auth UUID (which would then fail to
   * match stored primary-key references throughout the DB).
   */
  async resolveStudentId(id: string) {
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

  async resolveCounselorId(id: string) {
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
    // Directory reads should not depend on per-user RLS visibility.
    // Product decision: counselor email is intentionally visible to authenticated users.
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("counselors")
      .select("counselor_id, name, email, specialization, office_room, about, avatar_url")
      .order("name", { ascending: true });

    if (error) {
      if (!isMissingColumnError(error, "counselors", "avatar_url")) {
        throw error;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("counselors")
        .select("counselor_id, name, email, specialization, office_room, about")
        .order("name", { ascending: true });

      if (fallbackError) throw fallbackError;

      return ((fallbackData ?? []) as Array<Omit<CounselorRow, "avatar_url">>).map((row) =>
        mapCounselorRowToDTO({ ...row, avatar_url: null }),
      );
    }

    return ((data ?? []) as CounselorRow[]).map(mapCounselorRowToDTO);
  }

  async listStudents(): Promise<StudentDirectoryItemDTO[]> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("students")
      .select("student_id, name, avatar_url")
      .order("name", { ascending: true });

    if (error) {
      if (!isMissingColumnError(error, "students", "avatar_url")) {
        throw error;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("students")
        .select("student_id, name")
        .order("name", { ascending: true });

      if (fallbackError) throw fallbackError;

      return ((fallbackData ?? []) as Array<Omit<StudentRow, "avatar_url">>).map((row) =>
        mapStudentRowToDTO({ ...row, avatar_url: null }),
      );
    }

    return ((data ?? []) as StudentRow[]).map(mapStudentRowToDTO);
  }

  async getAvailability(
    counselorId: string,
    date: string,
  ): Promise<AvailabilityResponseDTO> {
    const supabase = await createClient();
    const dayOfWeek = getUtcDayOfWeek(date);

    // Prefer rule-based schedule rows (start/end/duration), fallback to legacy slot rows.
    const { data: ruleRows, error: ruleError } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active, breaks")
      .eq("counselor_id", counselorId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .not("start_time", "is", null)
      .not("end_time", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ruleError) throw ruleError;

    let candidateTimes: string[] = [];
    let scheduleSummary: AvailabilityResponseDTO["schedule_summary"];

    if (ruleRows && ruleRows.length > 0) {
      const activeRule = ruleRows[0] as ScheduleRuleRow;
      candidateTimes = generateSlotsFromRule(activeRule);
      scheduleSummary = {
        start_time: normalizeTime(activeRule.start_time),
        end_time: normalizeTime(activeRule.end_time),
        slot_duration_minutes: activeRule.slot_duration_minutes ?? 60,
        breaks: normalizeBreaks(activeRule.breaks),
        source: "rule",
      };
    } else {
      const { data: definedSlots, error: slotsError } = await supabase
        .from("availability")
        .select("slot_time")
        .eq("counselor_id", counselorId)
        .eq("day_of_week", dayOfWeek)
        .not("slot_time", "is", null);

      if (slotsError) throw slotsError;

      candidateTimes = (definedSlots ?? []).map((row) => normalizeTime(row.slot_time as string));
      if (candidateTimes.length > 0) {
        const sorted = [...candidateTimes].sort();
        scheduleSummary = {
          start_time: sorted[0],
          end_time: sorted[sorted.length - 1],
          slot_duration_minutes: 60,
          breaks: [],
          source: "legacy_slot",
        };
      }
    }

    // 2. Fetch already approved appointments for this counselor on this date
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("counselor_id", counselorId)
      .eq("appointment_date", date)
      .in("status", ["approved", "pending"]);

    if (apptError) throw apptError;

    const taken = new Set(
      (appointments ?? []).map((item) => normalizeTime(item.appointment_time as string)),
    );

    const now = new Date();
    const todayIso = now.toISOString().split("T")[0];
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const availableSlots = candidateTimes.map((time) => {
      const isPastToday = date === todayIso && timeToMinutes(time) <= currentMinutes;
      return {
        counselor_id: counselorId,
        appointment_date: date,
        appointment_time: time,
        available: !taken.has(time) && !isPastToday,
      };
    });

    const emptyState: AvailabilityEmptyState = (() => {
      if (availableSlots.some((slot) => slot.available)) {
        return "available";
      }

      if (candidateTimes.length === 0) {
        return "not_configured";
      }

      const hasTaken = candidateTimes.some((time) => taken.has(time));
      const hasPastOnly =
        date === todayIso &&
        candidateTimes.every((time) => timeToMinutes(time) <= currentMinutes);

      if (hasPastOnly && !hasTaken) {
        return "past_time_only";
      }

      return "fully_booked";
    })();

    return {
      slots: availableSlots,
      empty_state: emptyState,
      schedule_summary: scheduleSummary ?? {
        start_time: "",
        end_time: "",
        slot_duration_minutes: 60,
        breaks: [],
        source: "none",
      },
    };
  }

  async getAvailabilityRange(
    counselorId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Record<string, AvailabilityResponseDTO>> {
    const supabase = await createClient();

    // 1. Fetch ALL schedule rules for counselor
    const { data: ruleRows, error: ruleError } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active, breaks")
      .eq("counselor_id", counselorId)
      .eq("is_active", true)
      .not("start_time", "is", null)
      .not("end_time", "is", null);

    if (ruleError) throw ruleError;

    const rulesByDay = new Map<number, ScheduleRuleRow>();
    if (ruleRows) {
      for (const row of ruleRows) {
        rulesByDay.set(row.day_of_week, row as ScheduleRuleRow);
      }
    }

    // Fallback: fetch legacy slots if no rules
    let legacySlotsByDay: Map<number, string[]> | null = null;
    if (rulesByDay.size === 0) {
      const { data: definedSlots, error: slotsError } = await supabase
        .from("availability")
        .select("day_of_week, slot_time")
        .eq("counselor_id", counselorId)
        .not("slot_time", "is", null);

      if (slotsError) throw slotsError;
      
      legacySlotsByDay = new Map();
      if (definedSlots) {
        for (const row of definedSlots) {
          const day = row.day_of_week as number;
          const slots = legacySlotsByDay.get(day) || [];
          slots.push(normalizeTime(row.slot_time as string));
          legacySlotsByDay.set(day, slots);
        }
      }
    }

    // 2. Fetch ALL appointments within range
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("appointment_date, appointment_time")
      .eq("counselor_id", counselorId)
      .gte("appointment_date", fromDate)
      .lte("appointment_date", toDate)
      .in("status", ["approved", "pending"]);

    if (apptError) throw apptError;

    const takenByDate = new Map<string, Set<string>>();
    if (appointments) {
      for (const row of appointments) {
        const date = row.appointment_date as string;
        const time = normalizeTime(row.appointment_time as string);
        if (!takenByDate.has(date)) takenByDate.set(date, new Set());
        takenByDate.get(date)!.add(time);
      }
    }

    // 3. Generate response for each date in range
    const result: Record<string, AvailabilityResponseDTO> = {};
    const start = new Date(fromDate);
    // Use UTC date math to avoid daylight saving issues during range iteration
    const end = new Date(toDate);
    const span = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

    const now = new Date();
    const todayIso = now.toISOString().split("T")[0];
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    for (let i = 0; i < span; i++) {
      // Use UTC addition to match fromDate/toDate string parses
      const day = new Date(start.getTime() + i * 86_400_000);
      const year = day.getUTCFullYear();
      const month = String(day.getUTCMonth() + 1).padStart(2, '0');
      const dateNum = String(day.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateNum}`;
      const dayOfWeek = day.getUTCDay();

      let candidateTimes: string[] = [];
      let scheduleSummary: AvailabilityResponseDTO["schedule_summary"];

      const rule = rulesByDay.get(dayOfWeek);
      if (rule) {
        candidateTimes = generateSlotsFromRule(rule);
        scheduleSummary = {
          start_time: normalizeTime(rule.start_time),
          end_time: normalizeTime(rule.end_time),
          slot_duration_minutes: rule.slot_duration_minutes ?? 60,
          breaks: normalizeBreaks(rule.breaks),
          source: "rule",
        };
      } else if (legacySlotsByDay?.has(dayOfWeek)) {
        candidateTimes = legacySlotsByDay.get(dayOfWeek)!;
        const sorted = [...candidateTimes].sort();
        scheduleSummary = {
          start_time: sorted[0],
          end_time: sorted[sorted.length - 1],
          slot_duration_minutes: 60,
          breaks: [],
          source: "legacy_slot",
        };
      }

      const taken = takenByDate.get(dateStr) || new Set();
      
      const availableSlots = candidateTimes.map((time) => {
        const isPastToday = dateStr === todayIso && timeToMinutes(time) <= currentMinutes;
        return {
          counselor_id: counselorId,
          appointment_date: dateStr,
          appointment_time: time,
          available: !taken.has(time) && !isPastToday,
        };
      });

      const emptyState: AvailabilityEmptyState = (() => {
        if (availableSlots.some((slot) => slot.available)) return "available";
        if (candidateTimes.length === 0) return "not_configured";
        const hasTaken = candidateTimes.some((time) => taken.has(time));
        const hasPastOnly = dateStr === todayIso && candidateTimes.every((time) => timeToMinutes(time) <= currentMinutes);
        if (hasPastOnly && !hasTaken) return "past_time_only";
        return "fully_booked";
      })();

      result[dateStr] = {
        slots: availableSlots,
        empty_state: emptyState,
        schedule_summary: scheduleSummary ?? {
          start_time: "",
          end_time: "",
          slot_duration_minutes: 60,
          breaks: [],
          source: "none",
        },
      };
    }

    return result;
  }

  async getCounselorSchedule(counselorId: string): Promise<CounselorScheduleRuleDTO[]> {
    const supabase = createServiceClient();
    const resolvedId = await this.resolveCounselorId(counselorId);

    if (!resolvedId) {
      return [];
    }

    const { data, error } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active, breaks")
      .eq("counselor_id", resolvedId)
      .not("start_time", "is", null)
      .not("end_time", "is", null)
      .order("day_of_week", { ascending: true });

    if (error) throw error;

    return ((data ?? []) as ScheduleRuleRow[]).map(mapScheduleRuleToDTO);
  }

  async upsertCounselorSchedule(
    counselorId: string,
    rules: CounselorScheduleRuleInputDTO[],
  ): Promise<void> {
    const supabase = createServiceClient();
    const resolvedId = await this.resolveCounselorId(counselorId);

    if (!resolvedId) {
      throw new Error("Counselor not found");
    }

    const validRules = rules
      .filter((rule) => rule.is_active !== false)
      .map((rule) => ({
        counselor_id: resolvedId,
        day_of_week: rule.day_of_week,
        start_time: normalizeTime(rule.start_time),
        end_time: normalizeTime(rule.end_time),
        slot_duration_minutes: Math.max(15, Math.min(180, rule.slot_duration_minutes ?? 60)),
        is_active: true,
        breaks: normalizeBreaks(rule.breaks ?? []),
      }));

    const { error: deleteError } = await supabase
      .from("availability")
      .delete()
      .eq("counselor_id", resolvedId)
      .not("start_time", "is", null);

    if (deleteError) throw deleteError;

    if (validRules.length === 0) {
      return;
    }

    const { error: insertError } = await supabase
      .from("availability")
      .insert(validRules);

    if (insertError) throw insertError;
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
    const supabase = createServiceClient();
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

  async updateAppointment(
    appointmentId: string,
    input: BookingRequestDTO,
  ): Promise<AppointmentDTO | null> {
    const supabase = await createClient();
    const [studentId, counselorId, current] = await Promise.all([
      this.resolveStudentId(input.student_id),
      this.resolveCounselorId(input.counselor_id),
      this.getAppointmentById(appointmentId),
    ]);

    if (!current) return null;
    if (!studentId) throw new Error(`Could not resolve student: ${input.student_id}`);
    if (!counselorId) throw new Error(`Could not resolve counselor: ${input.counselor_id}`);

    const normalizedTime = normalizeTime(input.appointment_time);
    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from("appointments")
      .select("appointment_id, appointment_time")
      .eq("counselor_id", counselorId)
      .eq("appointment_date", input.appointment_date)
      .eq("status", "approved");

    if (conflictError) throw conflictError;

    const hasConflict = (conflictingAppointments ?? []).some((row) => {
      const rowId = row.appointment_id as string;
      return rowId !== appointmentId && normalizeTime(row.appointment_time as string) === normalizedTime;
    });

    if (hasConflict) {
      throw new Error("That timeslot is already taken");
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        student_id: studentId,
        counselor_id: counselorId,
        appointment_date: input.appointment_date,
        appointment_time: normalizedTime,
        reason: input.reason,
        mode: input.mode,
        updated_at: new Date().toISOString(),
      })
      .eq("appointment_id", appointmentId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const now = new Date().toISOString();
    const { error: notificationsError } = await supabase.from("notifications").insert({
      recipient_id: counselorId,
      recipient_role: "counselor",
      type: "booking_rescheduled",
      appointment_id: appointmentId,
      message: `Booking updated to ${input.appointment_date} at ${normalizedTime}`,
      sent_at: now,
      read: false,
    });

    if (notificationsError) {
      console.error("Failed to create reschedule notification", notificationsError);
    }

    return mapAppointmentRowToDTO(data as AppointmentRow);
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

    const nowMs = Date.now();
    const pendingToExpireIds: string[] = [];
    const approvedToCompleteIds: string[] = [];

    for (const row of rows) {
      const appointmentMs = getAppointmentDateTimeMs(row);
      if (Number.isNaN(appointmentMs) || appointmentMs >= nowMs) {
        continue;
      }

      if (row.status === "pending") {
        pendingToExpireIds.push(row.appointment_id);
      } else if (row.status === "approved") {
        approvedToCompleteIds.push(row.appointment_id);
      }
    }

    if (pendingToExpireIds.length > 0 || approvedToCompleteIds.length > 0) {
      const admin = createServiceClient();
      try {
        if (pendingToExpireIds.length > 0) {
          await admin
            .from("appointments")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .in("appointment_id", pendingToExpireIds);
        }
        if (approvedToCompleteIds.length > 0) {
          await admin
            .from("appointments")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .in("appointment_id", approvedToCompleteIds);
        }
      } catch (transitionError) {
        console.error("Failed to persist automatic appointment status transitions", transitionError);
      }
    }

    const normalizedRows = rows.map((row) => {
      const appointmentMs = getAppointmentDateTimeMs(row);
      if (!Number.isNaN(appointmentMs) && appointmentMs < nowMs) {
        if (row.status === "pending") {
          return { ...row, status: "expired" } as AppointmentRow;
        }
        if (row.status === "approved") {
          return { ...row, status: "completed" } as AppointmentRow;
        }
      }
      return row;
    });

    return normalizedRows.map((row) => mapAppointmentRowToDTO(row, (row as any).meeting_link));
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

  async rescheduleAppointment(
    appointmentId: string,
    appointmentDate: string,
    appointmentTime: string,
  ): Promise<AppointmentDTO | null> {
    const supabase = await createClient();
    const current = await this.getAppointmentById(appointmentId);

    if (!current) {
      return null;
    }

    const normalizedTime = normalizeTime(appointmentTime);
    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from("appointments")
      .select("appointment_id, appointment_time")
      .eq("counselor_id", current.counselor_id)
      .eq("appointment_date", appointmentDate)
      .eq("status", "approved");

    if (conflictError) throw conflictError;

    const hasConflict = (conflictingAppointments ?? []).some((row) => {
      const rowId = row.appointment_id as string;
      return rowId !== appointmentId && normalizeTime(row.appointment_time as string) === normalizedTime;
    });

    if (hasConflict) {
      throw new Error("That timeslot is already taken");
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        appointment_time: normalizedTime,
        updated_at: new Date().toISOString(),
      })
      .eq("appointment_id", appointmentId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapAppointmentRowToDTO(data as AppointmentRow);
  }

  async saveMeetLink(
    appointmentId: string,
    linkUrl: string,
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ meeting_link: linkUrl })
      .eq("appointment_id", appointmentId);

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

    const rows = ((data ?? []) as NotificationRow[]).map(mapNotificationRowToDTO);

    const deduped = new Map<string, NotificationDTO>();
    for (const notification of rows) {
      const key =
        notification.type === "session_notes" && notification.anonymous_thread_id
          ? `thread:${notification.recipient_role}:${notification.recipient_id}:${notification.anonymous_thread_id}`
          : `notification:${notification.notification_id}`;

      if (!deduped.has(key)) {
        deduped.set(key, notification);
      }
    }

    return Array.from(deduped.values());
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

  async markAllNotificationsRead(
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

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_role", role)
      .eq("recipient_id", resolvedUserId)
      .eq("read", false)
      .select("notification_id");

    if (error) throw error;
    return (data ?? []).length;
  }

  async countUnreadNotifications(
    role: SessionRole,
    userId?: string,
  ): Promise<number> {
    const notifications = await this.listNotifications(role, userId);
    return notifications.filter((notification) => !notification.read).length;
  }

  async getSessionNote(appointmentId: string): Promise<SessionNoteDTO | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_notes")
      .select("note_id, appointment_id, note_content, recommendations, follow_up, created_at, updated_at, counselor_id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapSessionNoteRowToDTO(data as SessionNoteRow);
  }

  async listSessionNotesByAppointmentIds(
    appointmentIds: string[],
  ): Promise<Map<string, SessionNoteDTO>> {
    if (appointmentIds.length === 0) return new Map();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_notes")
      .select(
        "note_id, appointment_id, note_content, recommendations, follow_up, created_at, updated_at, counselor_id",
      )
      .in("appointment_id", appointmentIds);

    if (error) throw error;

    const map = new Map<string, SessionNoteDTO>();
    for (const row of (data ?? []) as SessionNoteRow[]) {
      map.set(row.appointment_id, mapSessionNoteRowToDTO(row));
    }

    return map;
  }

  async upsertSessionNote(
    appointmentId: string,
    input: {
      note_content: string;
      recommendations: string[];
      follow_up: string;
    },
    counselorId: string,
  ): Promise<SessionNoteDTO> {
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("session_notes")
      .select("note_id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const payload = {
      appointment_id: appointmentId,
      note_content: input.note_content.trim(),
      recommendations: input.recommendations,
      follow_up: input.follow_up.trim(),
      counselor_id: counselorId,
      updated_at: nowIso,
    };

    const selectCols =
      "note_id, appointment_id, note_content, recommendations, follow_up, created_at, updated_at, counselor_id";

    let data: SessionNoteRow | null = null;

    const { data: updatedRows, error: updateError } = await supabase
      .from("session_notes")
      .update({
        note_content: payload.note_content,
        recommendations: payload.recommendations,
        follow_up: payload.follow_up,
        counselor_id: payload.counselor_id,
        updated_at: payload.updated_at,
      })
      .eq("appointment_id", appointmentId)
      .select(selectCols)
      .limit(1);

    if (updateError) {
      throw updateError;
    }

    if (updatedRows && updatedRows.length > 0) {
      data = updatedRows[0] as SessionNoteRow;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("session_notes")
        .insert(payload)
        .select(selectCols)
        .single();

      if (insertError) {
        const isDuplicate =
          typeof (insertError as { code?: string }).code === "string" &&
          (insertError as { code?: string }).code === "23505";

        if (!isDuplicate) {
          throw insertError;
        }

        const { data: recoveredRows, error: recoverError } = await supabase
          .from("session_notes")
          .update({
            note_content: payload.note_content,
            recommendations: payload.recommendations,
            follow_up: payload.follow_up,
            counselor_id: payload.counselor_id,
            updated_at: payload.updated_at,
          })
          .eq("appointment_id", appointmentId)
          .select(selectCols)
          .limit(1);

        if (recoverError) {
          throw recoverError;
        }

        data = (recoveredRows?.[0] as SessionNoteRow | undefined) ?? null;
      } else {
        data = inserted as SessionNoteRow;
      }
    }

    if (!data) {
      throw new Error("Unable to upsert session note.");
    }

    if (!existing?.note_id) {
      const { data: appointment } = await supabase
        .from("appointments")
        .select("student_id")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (appointment?.student_id) {
        const { error: notificationsError } = await supabase.from("notifications").insert({
          recipient_id: appointment.student_id,
          recipient_role: "student",
          type: "session_notes",
          appointment_id: appointmentId,
          message: "Your counselor shared session notes for a recent appointment.",
          sent_at: nowIso,
          read: false,
        });

        if (notificationsError) {
          console.error("Failed to create session note notification", notificationsError);
        }
      }
    }

    return mapSessionNoteRowToDTO(data);
  }

}
