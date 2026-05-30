import { BookingService } from "@/lib/booking/service";
import type { BookingRepository } from "@/lib/booking/repository";
import type { AppointmentDTO } from "@/lib/booking/contracts";
import { createMeetSpace } from "@/lib/google-meet/client";

jest.mock("@/lib/google-meet/client", () => ({
  createMeetSpace: jest.fn().mockResolvedValue("https://meet.google.com/mock-link"),
}));

const mockCreateMeetSpace = createMeetSpace as jest.MockedFunction<typeof createMeetSpace>;

function makeAppointment(overrides: Partial<AppointmentDTO> = {}): AppointmentDTO {
  return {
    appointment_id: "apt-1",
    student_id: "stu-1",
    counselor_id: "cou-1",
    appointment_date: "2026-06-01",
    appointment_time: "10:00:00",
    reason: "Help",
    reason_preview: "Help",
    mode: "online",
    status: "pending",
    created_at: "2026-05-27T00:00:00Z",
    updated_at: "2026-05-27T00:00:00Z",
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
    updateAppointmentStatus: jest.fn().mockResolvedValue(makeAppointment({ status: "approved" })),
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
    upsertSessionNote: jest.fn().mockResolvedValue({}),
    saveMeetLink: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as BookingRepository;
}

describe("Feature 4: Google Meet / Online Counseling", () => {
  describe("BookingService.updateAppointmentStatus — online approval flow", () => {
    it("creates Meet link when approving online appointment with token", async () => {
      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue("valid-refresh-token"),
        saveMeetLink: jest.fn().mockResolvedValue(undefined),
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "approved", meeting_link: "https://meet.google.com/mock-link" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("apt-1", "approved");

      expect(result.status).toBe("approved");
      expect(repo.getCounselorGoogleToken).toHaveBeenCalledWith("cou-1");
      expect(repo.saveMeetLink).toHaveBeenCalledWith("apt-1", "https://meet.google.com/mock-link");
    });

    it("throws GOOGLE_RECONNECT_REQUIRED when no Google token for online appointment", async () => {
      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue(null),
      });
      const service = new BookingService(repo);

      await expect(service.updateAppointmentStatus("apt-1", "approved")).rejects.toThrow(
        "GOOGLE_RECONNECT_REQUIRED",
      );
    });

    it("approves in-person appointment without Google token", async () => {
      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "in_person" })),
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ mode: "in_person", status: "approved" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("apt-1", "approved");
      expect(result.status).toBe("approved");
      expect(repo.getCounselorGoogleToken).not.toHaveBeenCalled();
    });

    it("cancels appointment without Google Meet interaction", async () => {
      const repo = makeRepo({
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "cancelled" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("apt-1", "cancelled");
      expect(result.status).toBe("cancelled");
      expect(repo.getCounselorGoogleToken).not.toHaveBeenCalled();
    });

    it("detects reconnectable token errors by pattern", () => {
      const pattern = /invalid_grant|invalid (refresh token|credentials)|token has been expired|token has been revoked|failed to obtain google access token/i;
      const reconnectable = [
        "invalid_grant",
        "invalid refresh token",
        "Invalid Credentials",
        "Token has been expired",
        "Token has been expired or revoked.",
        "Token has been revoked",
        "Failed to obtain Google access token",
      ];
      for (const msg of reconnectable) {
        expect(pattern.test(msg)).toBe(true);
      }

      const nonReconnectable = [
        "network timeout",
        "internal server error",
        "rate limit exceeded",
        "Missing GOOGLE_CLIENT_ID",
        "Google Meet API error 500",
      ];
      for (const msg of nonReconnectable) {
        expect(pattern.test(msg)).toBe(false);
      }
    });

    it("saveMeetLink is called after Meet link creation", async () => {
      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue("valid-token"),
        saveMeetLink: jest.fn().mockResolvedValue(undefined),
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "approved", meeting_link: "https://meet.google.com/mock-link" }),
        ),
      });
      const service = new BookingService(repo);

      await service.updateAppointmentStatus("apt-1", "approved");
      expect(repo.saveMeetLink).toHaveBeenCalledWith("apt-1", "https://meet.google.com/mock-link");
    });
  });

  describe("BookingService.updateAppointmentStatus — non-reconnectable Meet error", () => {
    it("throws GOOGLE_MEET_CREATE_FAILED for non-token errors", async () => {
      mockCreateMeetSpace.mockRejectedValueOnce(new Error("network timeout"));

      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue("valid-token"),
      });
      const service = new BookingService(repo);

      await expect(service.updateAppointmentStatus("apt-1", "approved")).rejects.toThrow(
        "GOOGLE_MEET_CREATE_FAILED",
      );
    });

    it("throws GOOGLE_MEET_CREATE_FAILED for rate limit errors", async () => {
      mockCreateMeetSpace.mockRejectedValueOnce(new Error("rate limit exceeded"));

      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue("valid-token"),
      });
      const service = new BookingService(repo);

      await expect(service.updateAppointmentStatus("apt-1", "approved")).rejects.toThrow(
        "GOOGLE_MEET_CREATE_FAILED",
      );
    });

    it("throws GOOGLE_MEET_CREATE_FAILED for non-Error throws", async () => {
      mockCreateMeetSpace.mockRejectedValueOnce("string error");

      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue("valid-token"),
      });
      const service = new BookingService(repo);

      await expect(service.updateAppointmentStatus("apt-1", "approved")).rejects.toThrow(
        "GOOGLE_MEET_CREATE_FAILED",
      );
    });
  });

  describe("BookingService.updateAppointmentStatus — reconnectable token errors from createMeetSpace", () => {
    it.each([
      "invalid_grant",
      "invalid refresh token",
      "Token has been expired or revoked.",
      "Token has been revoked",
      "Failed to obtain Google access token",
      "Invalid Credentials",
    ])("throws GOOGLE_RECONNECT_REQUIRED when createMeetSpace fails with %s", async (errorMessage) => {
      mockCreateMeetSpace.mockRejectedValueOnce(new Error(errorMessage));

      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(makeAppointment({ mode: "online" })),
        getCounselorGoogleToken: jest.fn().mockResolvedValue("expired-token"),
      });
      const service = new BookingService(repo);

      await expect(service.updateAppointmentStatus("apt-1", "approved")).rejects.toThrow(
        "GOOGLE_RECONNECT_REQUIRED",
      );

      // Verify saveMeetLink was NOT called (approval was aborted before saving)
      expect(repo.saveMeetLink).not.toHaveBeenCalled();

      // Verify updateAppointmentStatus was NOT called (approval was aborted)
      expect(repo.updateAppointmentStatus).not.toHaveBeenCalled();
    });
  });

  describe("BookingService.updateAppointmentStatus — null / edge appointments", () => {
    it("proceeds without Meet when appointment does not exist", async () => {
      const repo = makeRepo({
        getAppointmentById: jest.fn().mockResolvedValue(null),
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "approved" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("nonexistent", "approved");
      expect(result.status).toBe("approved");
      expect(repo.getCounselorGoogleToken).not.toHaveBeenCalled();
      expect(repo.updateAppointmentStatus).toHaveBeenCalledWith("nonexistent", "approved", undefined);
    });

    it("sets status to declined without Meet interaction", async () => {
      const repo = makeRepo({
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "declined" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("apt-1", "declined");
      expect(result.status).toBe("declined");
      expect(repo.getCounselorGoogleToken).not.toHaveBeenCalled();
    });

    it("sets status to expired without Meet interaction", async () => {
      const repo = makeRepo({
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "expired" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("apt-1", "expired");
      expect(result.status).toBe("expired");
      expect(repo.getCounselorGoogleToken).not.toHaveBeenCalled();
    });

    it("sets status to completed without Meet interaction", async () => {
      const repo = makeRepo({
        updateAppointmentStatus: jest.fn().mockResolvedValue(
          makeAppointment({ status: "completed" }),
        ),
      });
      const service = new BookingService(repo);

      const result = await service.updateAppointmentStatus("apt-1", "completed");
      expect(result.status).toBe("completed");
      expect(repo.getCounselorGoogleToken).not.toHaveBeenCalled();
    });
  });
});
