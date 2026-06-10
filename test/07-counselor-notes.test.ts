import { BookingService } from "@/lib/booking/service";
import type { BookingRepository } from "@/lib/booking/repository";
import type { SessionNoteDTO } from "@/lib/booking/contracts";

function makeNote(overrides: Partial<SessionNoteDTO> = {}): SessionNoteDTO {
  return {
    note_id: "note-1",
    appointment_id: "apt-1",
    note_content: "Student showed progress",
    recommendations: ["Continue journaling", "Practice mindfulness"],
    follow_up: "Schedule follow-up next week",
    created_at: "2026-05-27T10:00:00Z",
    updated_at: "2026-05-27T10:00:00Z",
    counselor_id: "cou-1",
    ...overrides,
  };
}

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
    listNotifications: jest.fn().mockResolvedValue([]),
    markNotificationRead: jest.fn().mockResolvedValue(null),
    markAllNotificationsRead: jest.fn().mockResolvedValue(0),
    countUnreadNotifications: jest.fn().mockResolvedValue(0),
    getCounselorGoogleToken: jest.fn().mockResolvedValue(null),
    resolveCounselorId: jest.fn().mockResolvedValue("cou-1"),
    resolveStudentId: jest.fn().mockResolvedValue("stu-1"),
    getCounselorSchedule: jest.fn().mockResolvedValue([]),
    upsertCounselorSchedule: jest.fn().mockResolvedValue(undefined),
    getSessionNote: jest.fn().mockResolvedValue(null),
    listSessionNotesByAppointmentIds: jest.fn().mockResolvedValue(new Map()),
    upsertSessionNote: jest.fn().mockResolvedValue(makeNote()),
    saveMeetLink: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as BookingRepository;
}

describe("Feature 7: Counselor Notes / Feedback System", () => {
  describe("BookingService.getSessionNote", () => {
    it("returns note when it exists", async () => {
      const note = makeNote();
      const repo = makeRepo({ getSessionNote: jest.fn().mockResolvedValue(note) });
      const service = new BookingService(repo);

      const result = await service.getSessionNote("apt-1");
      expect(result).not.toBeNull();
      expect(result?.note_id).toBe("note-1");
      expect(result?.note_content).toBe("Student showed progress");
    });

    it("returns null when no note exists", async () => {
      const repo = makeRepo({ getSessionNote: jest.fn().mockResolvedValue(null) });
      const service = new BookingService(repo);

      const result = await service.getSessionNote("apt-1");
      expect(result).toBeNull();
    });
  });

  describe("BookingService.listSessionNotesByAppointmentIds", () => {
    it("returns notes mapped by appointment ID", async () => {
      const note1 = makeNote({ appointment_id: "apt-1" });
      const note2 = makeNote({ note_id: "note-2", appointment_id: "apt-2", note_content: "Second note" });
      const noteMap = new Map([
        ["apt-1", note1],
        ["apt-2", note2],
      ]);
      const repo = makeRepo({ listSessionNotesByAppointmentIds: jest.fn().mockResolvedValue(noteMap) });
      const service = new BookingService(repo);

      const result = await service.listSessionNotesByAppointmentIds(["apt-1", "apt-2"]);
      expect(result.size).toBe(2);
      expect(result.get("apt-1")?.note_content).toBe("Student showed progress");
      expect(result.get("apt-2")?.note_content).toBe("Second note");
    });

    it("returns empty map for empty ID list", async () => {
      const repo = makeRepo({ listSessionNotesByAppointmentIds: jest.fn().mockResolvedValue(new Map()) });
      const service = new BookingService(repo);

      const result = await service.listSessionNotesByAppointmentIds([]);
      expect(result.size).toBe(0);
    });

    it("returns partial results when some appointments have no notes", async () => {
      const noteMap = new Map([["apt-1", makeNote()]]);
      const repo = makeRepo({ listSessionNotesByAppointmentIds: jest.fn().mockResolvedValue(noteMap) });
      const service = new BookingService(repo);

      const result = await service.listSessionNotesByAppointmentIds(["apt-1", "apt-no-note"]);
      expect(result.size).toBe(1);
      expect(result.has("apt-1")).toBe(true);
      expect(result.has("apt-no-note")).toBe(false);
    });

    it("handles duplicate appointment IDs", async () => {
      const noteMap = new Map([["apt-1", makeNote()]]);
      const repo = makeRepo({ listSessionNotesByAppointmentIds: jest.fn().mockResolvedValue(noteMap) });
      const service = new BookingService(repo);

      const result = await service.listSessionNotesByAppointmentIds(["apt-1", "apt-1"]);
      expect(repo.listSessionNotesByAppointmentIds).toHaveBeenCalledWith(["apt-1", "apt-1"]);
    });
  });

  describe("BookingService.upsertSessionNote", () => {
    it("creates a new note", async () => {
      const note = makeNote();
      const repo = makeRepo({ upsertSessionNote: jest.fn().mockResolvedValue(note) });
      const service = new BookingService(repo);

      const result = await service.upsertSessionNote(
        "apt-1",
        {
          note_content: "Student showed progress",
          recommendations: ["Continue journaling"],
          follow_up: "Schedule follow-up",
        },
        "cou-1",
      );

      expect(result).toEqual(note);
      expect(repo.upsertSessionNote).toHaveBeenCalledWith(
        "apt-1",
        {
          note_content: "Student showed progress",
          recommendations: ["Continue journaling"],
          follow_up: "Schedule follow-up",
        },
        "cou-1",
      );
    });

    it("updates an existing note", async () => {
      const updatedNote = makeNote({
        note_content: "Updated content",
        updated_at: "2026-05-28T10:00:00Z",
      });
      const repo = makeRepo({ upsertSessionNote: jest.fn().mockResolvedValue(updatedNote) });
      const service = new BookingService(repo);

      const result = await service.upsertSessionNote(
        "apt-1",
        {
          note_content: "Updated content",
          recommendations: [],
          follow_up: "",
        },
        "cou-1",
      );

      expect(result.note_content).toBe("Updated content");
    });

    it("handles empty recommendations and follow_up", async () => {
      const note = makeNote({
        recommendations: [],
        follow_up: "",
      });
      const repo = makeRepo({ upsertSessionNote: jest.fn().mockResolvedValue(note) });
      const service = new BookingService(repo);

      const result = await service.upsertSessionNote(
        "apt-1",
        { note_content: "Minimal note", recommendations: [], follow_up: "" },
        "cou-1",
      );

      expect(result.recommendations).toEqual([]);
      expect(result.follow_up).toBe("");
    });
  });

  describe("SessionNoteDTO structure", () => {
    it("note has required fields", () => {
      const note = makeNote();
      expect(note).toHaveProperty("note_id");
      expect(note).toHaveProperty("appointment_id");
      expect(note).toHaveProperty("note_content");
      expect(note).toHaveProperty("recommendations");
      expect(note).toHaveProperty("follow_up");
      expect(note).toHaveProperty("created_at");
    });

    it("recommendations is an array of strings", () => {
      const note = makeNote();
      expect(Array.isArray(note.recommendations)).toBe(true);
      for (const rec of note.recommendations) {
        expect(typeof rec).toBe("string");
      }
    });
  });

  describe("Cache tags for notes", () => {
    it("sessionNotesTag generates correct format", () => {
      const { sessionNotesTag } = require("@/lib/cache/appointments-cache");
      expect(sessionNotesTag("apt-42")).toBe("session-notes:apt-42");
    });
  });
});
