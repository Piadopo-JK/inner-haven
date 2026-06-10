import { BookingService } from "@/lib/booking/service";
import type { BookingRepository } from "@/lib/booking/repository";
import type {
  CounselorDirectoryItemDTO,
  CounselorScheduleRuleDTO,
  AvailabilityResponseDTO,
  SessionRole,
} from "@/lib/booking/contracts";
import {
  normalizeTime,
  parseDateParts,
  getUtcDayOfWeek,
  timeToMinutes,
  minutesToTime,
  normalizeBreaks,
  isOverlappingBreak,
  generateSlotsFromRule,
} from "@/lib/booking/supabase-repository";

function makeRepo(overrides: Partial<BookingRepository> = {}): BookingRepository {
  return {
    listCounselors: jest.fn().mockResolvedValue([]),
    listStudents: jest.fn().mockResolvedValue([]),
    getAvailability: jest.fn().mockResolvedValue({ slots: [], empty_state: "available" }),
    getAvailabilityRange: jest.fn().mockResolvedValue({}),
    getAvailableCounselors: jest.fn().mockResolvedValue([]),
    createAppointment: jest.fn().mockResolvedValue({}),
    updateAppointment: jest.fn().mockResolvedValue({}),
    listAppointments: jest.fn().mockResolvedValue([]),
    getAppointmentById: jest.fn().mockResolvedValue(null),
    updateAppointmentStatus: jest.fn().mockResolvedValue(null),
    rescheduleAppointment: jest.fn().mockResolvedValue(null),
    saveMeetLink: jest.fn().mockResolvedValue(undefined),
    getCounselorGoogleToken: jest.fn().mockResolvedValue(null),
    listNotifications: jest.fn().mockResolvedValue([]),
    markNotificationRead: jest.fn().mockResolvedValue(null),
    markAllNotificationsRead: jest.fn().mockResolvedValue(0),
    countUnreadNotifications: jest.fn().mockResolvedValue(0),
    resolveCounselorId: jest.fn().mockResolvedValue("cou-1"),
    resolveStudentId: jest.fn().mockResolvedValue("stu-1"),
    getCounselorSchedule: jest.fn().mockResolvedValue([]),
    upsertCounselorSchedule: jest.fn().mockResolvedValue(undefined),
    getSessionNote: jest.fn().mockResolvedValue(null),
    listSessionNotesByAppointmentIds: jest.fn().mockResolvedValue(new Map()),
    upsertSessionNote: jest.fn().mockResolvedValue({} as any),
    ...overrides,
  } as unknown as BookingRepository;
}

describe("Feature 3: Counselor Directory and Availability Calendar", () => {
  describe("Pure time functions (actual source)", () => {
    it("normalizeTime trims seconds off a time string", () => {
      expect(normalizeTime("10:30:00")).toBe("10:30");
      expect(normalizeTime("09:00")).toBe("09:00");
      expect(normalizeTime("23:59:59")).toBe("23:59");
    });

    it("parseDateParts splits ISO date into numbers", () => {
      const { year, month, day } = parseDateParts("2026-06-15");
      expect(year).toBe(2026);
      expect(month).toBe(6);
      expect(day).toBe(15);
    });

    it("getUtcDayOfWeek returns correct day-of-week", () => {
      expect(getUtcDayOfWeek("2026-06-01")).toBe(1);  // Monday
      expect(getUtcDayOfWeek("2026-06-07")).toBe(0);  // Sunday
      expect(getUtcDayOfWeek("2026-06-03")).toBe(3);  // Wednesday
    });

    it("timeToMinutes converts HH:MM to minutes since midnight", () => {
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("09:00")).toBe(540);
      expect(timeToMinutes("12:30")).toBe(750);
      expect(timeToMinutes("23:59")).toBe(1439);
    });

    it("minutesToTime is the inverse of timeToMinutes", () => {
      expect(minutesToTime(0)).toBe("00:00");
      expect(minutesToTime(540)).toBe("09:00");
      expect(minutesToTime(750)).toBe("12:30");
      expect(minutesToTime(1439)).toBe("23:59");
    });
  });

  describe("normalizeBreaks", () => {
    it("returns empty for non-array input", () => {
      expect(normalizeBreaks(null)).toEqual([]);
      expect(normalizeBreaks(undefined)).toEqual([]);
      expect(normalizeBreaks("not-array")).toEqual([]);
    });

    it("extracts valid breaks and normalizes times", () => {
      const raw = [{ start_time: "12:00:00", end_time: "13:00:00" }];
      const result = normalizeBreaks(raw);
      expect(result).toEqual([{ start_time: "12:00", end_time: "13:00" }]);
    });

    it("filters out entries with start >= end", () => {
      const raw = [{ start_time: "14:00", end_time: "14:00" }];
      expect(normalizeBreaks(raw)).toEqual([]);
    });

    it("filters out entries with missing fields", () => {
      const raw = [{ start_time: "12:00" }, { end_time: "13:00" }, 42, null];
      expect(normalizeBreaks(raw)).toEqual([]);
    });
  });

  describe("isOverlappingBreak", () => {
    const breaks = [{ start_time: "12:00", end_time: "13:00" }];

    it("returns true when slot overlaps break start", () => {
      expect(isOverlappingBreak(11 * 60 + 30, 12 * 60 + 30, breaks)).toBe(true);
    });

    it("returns true when slot overlaps break end", () => {
      expect(isOverlappingBreak(12 * 60 + 30, 13 * 60 + 30, breaks)).toBe(true);
    });

    it("returns true when slot is entirely inside break", () => {
      expect(isOverlappingBreak(12 * 60 + 15, 12 * 60 + 45, breaks)).toBe(true);
    });

    it("returns false when slot ends exactly at break start", () => {
      expect(isOverlappingBreak(11 * 60, 12 * 60, breaks)).toBe(false);
    });

    it("returns false when slot starts exactly at break end", () => {
      expect(isOverlappingBreak(13 * 60, 14 * 60, breaks)).toBe(false);
    });

    it("returns false when slot is entirely before break", () => {
      expect(isOverlappingBreak(9 * 60, 10 * 60, breaks)).toBe(false);
    });
  });

  describe("generateSlotsFromRule", () => {
    it("generates 60-min slots across the full range", () => {
      const slots = generateSlotsFromRule({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "12:00",
        slot_duration_minutes: 60,
        is_active: true,
        breaks: [],
      });
      expect(slots).toEqual(["09:00", "10:00", "11:00"]);
    });

    it("generates 30-min slots", () => {
      const slots = generateSlotsFromRule({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:30",
        slot_duration_minutes: 30,
        is_active: true,
        breaks: [],
      });
      expect(slots).toEqual(["09:00", "09:30", "10:00"]);
    });

    it("skips slots that overlap breaks", () => {
      const slots = generateSlotsFromRule({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "13:00",
        slot_duration_minutes: 60,
        is_active: true,
        breaks: [{ start_time: "10:00", end_time: "11:00" }],
      });
      expect(slots).toEqual(["09:00", "11:00", "12:00"]);
    });

    it("clamps duration to 15-180 min range", () => {
      const slots5min = generateSlotsFromRule({
        day_of_week: 1, start_time: "09:00", end_time: "09:20",
        slot_duration_minutes: 5, is_active: true, breaks: [],
      });
      // 5 is clamped to 15, so only one 15-min slot fits in 20 min
      expect(slots5min).toEqual(["09:00"]);

      const slots300min = generateSlotsFromRule({
        day_of_week: 1, start_time: "09:00", end_time: "12:00",
        slot_duration_minutes: 300, is_active: true, breaks: [],
      });
      // 300 is clamped to 180, so 180 min doesn't fit in 3hr (180 min) — 9:00+180=12:00 which equals end, so it fits
      expect(slots300min).toEqual(["09:00"]);
    });

    it("returns empty when duration exceeds range", () => {
      const slots = generateSlotsFromRule({
        day_of_week: 1, start_time: "09:00", end_time: "09:30",
        slot_duration_minutes: 60, is_active: true, breaks: [],
      });
      expect(slots).toEqual([]);
    });
  });

  describe("BookingService — counselor operations", () => {
    it("listCounselors delegates to repository", async () => {
      const counselors: CounselorDirectoryItemDTO[] = [
        { counselor_id: "c-1", name: "Alice", email: "a@test.com", specialization: "Mental Health", office_room: "101", about: "Expert" },
      ];
      const repo = makeRepo({ listCounselors: jest.fn().mockResolvedValue(counselors) });
      const service = new BookingService(repo);

      const result = await service.listCounselors();
      expect(result).toEqual(counselors);
      expect(repo.listCounselors).toHaveBeenCalledTimes(1);
    });

    it("getAvailability returns correct shape", async () => {
      const availability: AvailabilityResponseDTO = {
        slots: [
          { counselor_id: "cou-1", appointment_date: "2026-06-01", appointment_time: "09:00", available: true },
        ],
        empty_state: "available",
        schedule_summary: {
          start_time: "09:00", end_time: "17:00", slot_duration_minutes: 60,
          breaks: [], source: "rule",
        },
      };
      const repo = makeRepo({ getAvailability: jest.fn().mockResolvedValue(availability) });
      const service = new BookingService(repo);

      const result = await service.getAvailability("cou-1", "2026-06-01");
      expect(result.slots).toHaveLength(1);
      expect(result.slots[0].available).toBe(true);
      expect(result.schedule_summary?.source).toBe("rule");
    });

    it("getAvailabilityRange returns Record<string, AvailabilityResponseDTO>", async () => {
      const byDate: Record<string, AvailabilityResponseDTO> = {
        "2026-06-01": { slots: [], empty_state: "available" },
        "2026-06-02": { slots: [], empty_state: "fully_booked" },
      };
      const repo = makeRepo({ getAvailabilityRange: jest.fn().mockResolvedValue(byDate) });
      const service = new BookingService(repo);

      const result = await service.getAvailabilityRange("cou-1", "2026-06-01", "2026-06-07");
      expect(Object.keys(result)).toHaveLength(2);
      expect(result["2026-06-02"].empty_state).toBe("fully_booked");
    });

    it("getCounselorSchedule returns rules with breaks array", async () => {
      const rules: CounselorScheduleRuleDTO[] = [
        {
          day_of_week: 1, start_time: "09:00", end_time: "17:00",
          slot_duration_minutes: 60, is_active: true,
          breaks: [{ start_time: "12:00", end_time: "13:00" }],
        },
      ];
      const repo = makeRepo({ getCounselorSchedule: jest.fn().mockResolvedValue(rules) });
      const service = new BookingService(repo);

      const result = await service.getCounselorSchedule("cou-1");
      expect(result[0].breaks).toEqual([{ start_time: "12:00", end_time: "13:00" }]);
    });
  });

  describe("BookingService.getAvailableCounselors", () => {
    it("delegates to repository with date and time", async () => {
      const counselors: CounselorDirectoryItemDTO[] = [
        { counselor_id: "c-1", name: "Alice", email: "a@test.com", specialization: "MH", office_room: "101", about: "" },
      ];
      const repo = makeRepo({ getAvailableCounselors: jest.fn().mockResolvedValue(counselors) });
      const service = new BookingService(repo);

      const result = await service.getAvailableCounselors("2026-06-01", "10:00");
      expect(result).toEqual(counselors);
      expect(repo.getAvailableCounselors).toHaveBeenCalledWith("2026-06-01", "10:00");
    });

    it("returns empty array when none available", async () => {
      const repo = makeRepo({ getAvailableCounselors: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      const result = await service.getAvailableCounselors("2026-06-01", "03:00");
      expect(result).toEqual([]);
    });
  });

  describe("BookingService.listStudents", () => {
    it("delegates to repository", async () => {
      const repo = makeRepo({ listStudents: jest.fn().mockResolvedValue([{ student_id: "s-1", name: "Bob" }]) });
      const service = new BookingService(repo);

      const result = await service.listStudents();
      expect(result).toEqual([{ student_id: "s-1", name: "Bob" }]);
      expect(repo.listStudents).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no students", async () => {
      const repo = makeRepo({ listStudents: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      const result = await service.listStudents();
      expect(result).toEqual([]);
    });
  });

  describe("BookingService.resolveCounselorId / resolveStudentId", () => {
    it("resolveCounselorId delegates to repository", async () => {
      const repo = makeRepo({ resolveCounselorId: jest.fn().mockResolvedValue("cou-resolved") });
      const service = new BookingService(repo);

      const result = await service.resolveCounselorId("auth-user-1");
      expect(result).toBe("cou-resolved");
      expect(repo.resolveCounselorId).toHaveBeenCalledWith("auth-user-1");
    });

    it("resolveCounselorId returns null when not found", async () => {
      const repo = makeRepo({ resolveCounselorId: jest.fn().mockResolvedValue(null) });
      const service = new BookingService(repo);

      const result = await service.resolveCounselorId("unknown");
      expect(result).toBeNull();
    });

    it("resolveStudentId delegates to repository", async () => {
      const repo = makeRepo({ resolveStudentId: jest.fn().mockResolvedValue("stu-resolved") });
      const service = new BookingService(repo);

      const result = await service.resolveStudentId("auth-user-2");
      expect(result).toBe("stu-resolved");
      expect(repo.resolveStudentId).toHaveBeenCalledWith("auth-user-2");
    });

    it("resolveStudentId returns null when not found", async () => {
      const repo = makeRepo({ resolveStudentId: jest.fn().mockResolvedValue(null) });
      const service = new BookingService(repo);

      const result = await service.resolveStudentId("unknown");
      expect(result).toBeNull();
    });
  });

  describe("BookingService.upsertCounselorSchedule", () => {
    it("delegates schedule upsert to repository", async () => {
      const repo = makeRepo({ upsertCounselorSchedule: jest.fn().mockResolvedValue(undefined) });
      const service = new BookingService(repo);

      const rules = [{ day_of_week: 1, start_time: "09:00", end_time: "17:00", slot_duration_minutes: 60 }];
      await service.upsertCounselorSchedule("cou-1", rules);
      expect(repo.upsertCounselorSchedule).toHaveBeenCalledWith("cou-1", rules);
    });
  });

  describe("BookingService.getAvailability — empty states", () => {
    it("returns not_configured when no schedule set", async () => {
      const availability: AvailabilityResponseDTO = {
        slots: [],
        empty_state: "not_configured",
      };
      const repo = makeRepo({ getAvailability: jest.fn().mockResolvedValue(availability) });
      const service = new BookingService(repo);

      const result = await service.getAvailability("cou-1", "2026-06-01");
      expect(result.empty_state).toBe("not_configured");
      expect(result.slots).toEqual([]);
    });

    it("returns past_time_only for today with all past slots", async () => {
      const availability: AvailabilityResponseDTO = {
        slots: [],
        empty_state: "past_time_only",
      };
      const repo = makeRepo({ getAvailability: jest.fn().mockResolvedValue(availability) });
      const service = new BookingService(repo);

      const result = await service.getAvailability("cou-1", "2026-05-27");
      expect(result.empty_state).toBe("past_time_only");
    });

    it("returns legacy_slot source in schedule_summary", async () => {
      const availability: AvailabilityResponseDTO = {
        slots: [
          { counselor_id: "cou-1", appointment_date: "2026-06-01", appointment_time: "09:00", available: true },
        ],
        empty_state: "available",
        schedule_summary: {
          start_time: "09:00", end_time: "09:00", slot_duration_minutes: 60,
          breaks: [], source: "legacy_slot",
        },
      };
      const repo = makeRepo({ getAvailability: jest.fn().mockResolvedValue(availability) });
      const service = new BookingService(repo);

      const result = await service.getAvailability("cou-1", "2026-06-01");
      expect(result.schedule_summary?.source).toBe("legacy_slot");
    });
  });
});
