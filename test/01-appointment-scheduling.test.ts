import { BookingService } from "@/lib/booking/service";
import type { BookingRepository } from "@/lib/booking/repository";
import type {
  AppointmentDTO,
  BookingRequestDTO,
  SessionRole,
} from "@/lib/booking/contracts";

function makeAppointment(overrides: Partial<AppointmentDTO> = {}): AppointmentDTO {
  return {
    appointment_id: "apt-1",
    student_id: "stu-1",
    counselor_id: "cou-1",
    appointment_date: "2026-06-01",
    appointment_time: "10:00:00",
    reason: "Test reason",
    reason_preview: "Test reason",
    mode: "online",
    status: "pending",
    created_at: "2026-05-27T00:00:00Z",
    updated_at: "2026-05-27T00:00:00Z",
    ...overrides,
  };
}

function mockRepo(overrides: Partial<BookingRepository> = {}): BookingRepository {
  return {
    listCounselors: jest.fn().mockResolvedValue([]),
    listStudents: jest.fn().mockResolvedValue([]),
    getAvailability: jest.fn().mockResolvedValue({
      slots: [],
      empty_state: "available" as const,
    }),
    getAvailabilityRange: jest.fn().mockResolvedValue({}),
    getAvailableCounselors: jest.fn().mockResolvedValue([]),
    createAppointment: jest.fn().mockResolvedValue(makeAppointment()),
    updateAppointment: jest.fn().mockResolvedValue(makeAppointment()),
    listAppointments: jest.fn().mockResolvedValue([]),
    getAppointmentById: jest.fn().mockResolvedValue(null),
    updateAppointmentStatus: jest.fn().mockResolvedValue(makeAppointment({ status: "approved" })),
    rescheduleAppointment: jest.fn().mockResolvedValue(makeAppointment()),
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
    upsertSessionNote: jest.fn().mockResolvedValue({}),
    saveMeetLink: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as BookingRepository;
}

const bookingInput: BookingRequestDTO = {
  student_id: "stu-1",
  counselor_id: "cou-1",
  appointment_date: "2026-06-01",
  appointment_time: "10:00",
  reason: "I need help",
  mode: "online",
};

describe("Feature 1: Online Appointment Scheduling", () => {
  describe("BookingService.createAppointment", () => {
    it("delegates to repository and returns the created appointment", async () => {
      const repo = mockRepo({
        createAppointment: jest.fn().mockResolvedValue(makeAppointment()),
      });
      const service = new BookingService(repo);

      const result = await service.createAppointment(bookingInput);

      expect(result.appointment_id).toBe("apt-1");
      expect(result.status).toBe("pending");
      expect(repo.createAppointment).toHaveBeenCalledWith(bookingInput);
    });

    it("passes through repository errors", async () => {
      const repo = mockRepo({
        createAppointment: jest.fn().mockRejectedValue(new Error("That timeslot is already taken")),
      });
      const service = new BookingService(repo);

      await expect(service.createAppointment(bookingInput)).rejects.toThrow(
        "That timeslot is already taken",
      );
    });
  });

  describe("BookingService.updateAppointment", () => {
    it("delegates update to the repository", async () => {
      const updated = makeAppointment({ reason: "Updated concern" });
      const repo = mockRepo({
        updateAppointment: jest.fn().mockResolvedValue(updated),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointment("apt-1", {
        ...bookingInput,
        reason: "Updated concern",
      });

      expect(result.reason).toBe("Updated concern");
      expect(repo.updateAppointment).toHaveBeenCalledWith("apt-1", expect.any(Object));
    });
  });

  describe("BookingService.listAppointments", () => {
    it("returns appointments filtered by student role", async () => {
      const appointments = [
        makeAppointment(),
        makeAppointment({ appointment_id: "apt-2", status: "approved" }),
      ];
      const repo = mockRepo({ listAppointments: jest.fn().mockResolvedValue(appointments) });
      const service = new BookingService(repo);

      const result = await service.listAppointments({ role: "student", student_id: "stu-1" });

      expect(result).toHaveLength(2);
      expect(repo.listAppointments).toHaveBeenCalledWith({ role: "student", student_id: "stu-1" });
    });

    it("returns empty array when no appointments exist", async () => {
      const repo = mockRepo({ listAppointments: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      const result = await service.listAppointments({ role: "counselor", counselor_id: "cou-1" });
      expect(result).toEqual([]);
    });
  });

  describe("BookingService.getAppointmentById", () => {
    it("returns null for non-existent appointment", async () => {
      const repo = mockRepo({ getAppointmentById: jest.fn().mockResolvedValue(null) });
      const service = new BookingService(repo);

      const result = await service.getAppointmentById("nonexistent");
      expect(result).toBeNull();
    });

    it("returns the appointment when found", async () => {
      const repo = mockRepo({ getAppointmentById: jest.fn().mockResolvedValue(makeAppointment()) });
      const service = new BookingService(repo);

      const result = await service.getAppointmentById("apt-1");
      expect(result?.appointment_id).toBe("apt-1");
    });
  });

  describe("BookingService.rescheduleAppointment", () => {
    it("delegates reschedule to repository", async () => {
      const rescheduled = makeAppointment({
        appointment_date: "2026-06-15",
        appointment_time: "14:00:00",
      });
      const repo = mockRepo({ rescheduleAppointment: jest.fn().mockResolvedValue(rescheduled) });
      const service = new BookingService(repo);

      const result = await service.rescheduleAppointment("apt-1", "2026-06-15", "14:00");
      expect(result.appointment_date).toBe("2026-06-15");
      expect(repo.rescheduleAppointment).toHaveBeenCalledWith("apt-1", "2026-06-15", "14:00");
    });
  });

  describe("Upsert appointment via listAppointments + updateAppointment", () => {
    it("updates an existing appointment in-place without duplicating", async () => {
      const existing = makeAppointment();
      const updated = makeAppointment({ reason: "Updated concern", reason_preview: "Updated concern" });

      const listSpy = jest.fn().mockResolvedValue([existing]);
      const updateSpy = jest.fn().mockResolvedValue(updated);
      const createSpy = jest.fn().mockResolvedValue(makeAppointment());

      const repo = mockRepo({
        listAppointments: listSpy,
        updateAppointment: updateSpy,
        createAppointment: createSpy,
      });
      const service = new BookingService(repo);

      // Step 1: list appointments to find existing one
      const appointments = await service.listAppointments({ role: "student", student_id: "stu-1" });
      expect(appointments).toHaveLength(1);
      expect(appointments[0].appointment_id).toBe("apt-1");

      // Step 2: verify the appointment exists, then update it (not create a new one)
      const existingApt = appointments.find((a) => a.appointment_id === "apt-1");
      expect(existingApt).toBeDefined();

      const updateInput: BookingRequestDTO = {
        student_id: "stu-1",
        counselor_id: "cou-1",
        appointment_date: "2026-06-01",
        appointment_time: "10:00",
        reason: "Updated concern",
        mode: "online",
      };
      const result = await service.updateAppointment("apt-1", updateInput);

      expect(updateSpy).toHaveBeenCalledWith("apt-1", updateInput);
      expect(createSpy).not.toHaveBeenCalled();
      expect(result.reason).toBe("Updated concern");
      expect(result.appointment_id).toBe("apt-1");
    });
  });

  describe("BookingService.listAppointments — status filtering", () => {
    it("filters by status when provided", async () => {
      const pending = makeAppointment({ status: "pending" });
      const approved = makeAppointment({ appointment_id: "apt-2", status: "approved" });
      const repo = mockRepo({ listAppointments: jest.fn().mockResolvedValue([pending, approved]) });
      const service = new BookingService(repo);

      const result = await service.listAppointments({
        role: "counselor",
        counselor_id: "cou-1",
        status: "pending",
      });

      expect(result).toHaveLength(2);
      expect(repo.listAppointments).toHaveBeenCalledWith({
        role: "counselor",
        counselor_id: "cou-1",
        status: "pending",
      });
    });

    it("filters by counselor role with counselor_id", async () => {
      const repo = mockRepo({ listAppointments: jest.fn().mockResolvedValue([makeAppointment()]) });
      const service = new BookingService(repo);

      await service.listAppointments({ role: "counselor", counselor_id: "cou-1" });
      expect(repo.listAppointments).toHaveBeenCalledWith({
        role: "counselor",
        counselor_id: "cou-1",
      });
    });
  });

  describe("BookingService.updateAppointment — null return", () => {
    it("returns null when appointment does not exist", async () => {
      const repo = mockRepo({
        updateAppointment: jest.fn().mockResolvedValue(null),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointment("nonexistent", bookingInput);
      expect(result).toBeNull();
    });
  });

  describe("BookingService.rescheduleAppointment — null return", () => {
    it("returns null when appointment does not exist", async () => {
      const repo = mockRepo({
        rescheduleAppointment: jest.fn().mockResolvedValue(null),
      });
      const service = new BookingService(repo);

      const result = await service.rescheduleAppointment("nonexistent", "2026-06-15", "14:00");
      expect(result).toBeNull();
    });
  });

  describe("BookingService — listAppointments status exhaustiveness", () => {
    it("passes cancelled status filter", async () => {
      const repo = mockRepo({ listAppointments: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      await service.listAppointments({ role: "student", student_id: "stu-1", status: "cancelled" });
      expect(repo.listAppointments).toHaveBeenCalledWith({
        role: "student",
        student_id: "stu-1",
        status: "cancelled",
      });
    });

    it("passes expired status filter", async () => {
      const repo = mockRepo({ listAppointments: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      await service.listAppointments({ role: "student", student_id: "stu-1", status: "expired" });
      expect(repo.listAppointments).toHaveBeenCalledWith({
        role: "student",
        student_id: "stu-1",
        status: "expired",
      });
    });
  });

  describe("Cache tag generators", () => {
    it("appointmentsListTag produces correct format", () => {
      const { appointmentsListTag } = require("@/lib/cache/appointments-cache");
      expect(appointmentsListTag("student" as SessionRole, "user-1")).toBe(
        "appointments:list:student:user-1",
      );
    });

    it("appointmentTag includes appointment ID", () => {
      const { appointmentTag } = require("@/lib/cache/appointments-cache");
      expect(appointmentTag("apt-42")).toBe("appointment:apt-42");
    });
  });
});
