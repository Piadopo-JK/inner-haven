import { BookingService } from "@/lib/booking/service";
import type { BookingRepository } from "@/lib/booking/repository";
import type { NotificationDTO, SessionRole } from "@/lib/booking/contracts";

function makeNotification(overrides: Partial<NotificationDTO> = {}): NotificationDTO {
  return {
    notification_id: "notif-1",
    recipient_id: "cou-1",
    recipient_role: "counselor",
    type: "booking_request",
    appointment_id: "apt-1",
    anonymous_thread_id: null,
    message: "New booking request",
    created_at: "2026-05-27T10:00:00Z",
    read: false,
    ...overrides,
  };
}

function mockRepo(overrides: Partial<BookingRepository> = {}): BookingRepository {
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
    upsertSessionNote: jest.fn().mockResolvedValue({}),
    saveMeetLink: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as BookingRepository;
}

describe("Feature 2: Appointment Reminders and Notifications", () => {
  describe("BookingService.listNotifications", () => {
    it("returns notifications for a counselor", async () => {
      const notifications = [
        makeNotification(),
        makeNotification({ notification_id: "notif-2", type: "booking_approved" }),
      ];
      const repo = mockRepo({ listNotifications: jest.fn().mockResolvedValue(notifications) });
      const service = new BookingService(repo);

      const result = await service.listNotifications("counselor", "cou-1");
      expect(result).toHaveLength(2);
      expect(repo.listNotifications).toHaveBeenCalledWith("counselor", "cou-1");
    });

    it("returns empty list when no notifications", async () => {
      const repo = mockRepo({ listNotifications: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      const result = await service.listNotifications("student", "stu-1");
      expect(result).toEqual([]);
    });

    it("passes role filter to repository", async () => {
      const repo = mockRepo({ listNotifications: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      await service.listNotifications("student" as SessionRole, "stu-1");
      expect(repo.listNotifications).toHaveBeenCalledWith("student", "stu-1");
    });
  });

  describe("BookingService.markNotificationRead", () => {
    it("marks a single notification as read", async () => {
      const repo = mockRepo();
      const service = new BookingService(repo);

      await service.markNotificationRead("notif-1");
      expect(repo.markNotificationRead).toHaveBeenCalledWith("notif-1");
    });
  });

  describe("BookingService.markAllNotificationsRead", () => {
    it("marks all notifications for a role", async () => {
      const repo = mockRepo();
      const service = new BookingService(repo);

      await service.markAllNotificationsRead("counselor", "cou-1");
      expect(repo.markAllNotificationsRead).toHaveBeenCalledWith("counselor", "cou-1");
    });

    it("marks all without userId when omitted", async () => {
      const repo = mockRepo();
      const service = new BookingService(repo);

      await service.markAllNotificationsRead("counselor");
      expect(repo.markAllNotificationsRead).toHaveBeenCalledWith("counselor", undefined);
    });
  });

  describe("BookingService.countUnreadNotifications", () => {
    it("returns count of unread notifications", async () => {
      const repo = mockRepo({ countUnreadNotifications: jest.fn().mockResolvedValue(5) });
      const service = new BookingService(repo);

      const count = await service.countUnreadNotifications("student", "stu-1");
      expect(count).toBe(5);
    });

    it("returns 0 when no unread", async () => {
      const repo = mockRepo({ countUnreadNotifications: jest.fn().mockResolvedValue(0) });
      const service = new BookingService(repo);

      const count = await service.countUnreadNotifications("counselor", "cou-1");
      expect(count).toBe(0);
    });
  });

  describe("BookingService.listNotifications — parameter forwarding", () => {
    it("passes both role and userId to the repository", async () => {
      const repo = mockRepo({ listNotifications: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      await service.listNotifications("student", "stu-1");
      expect(repo.listNotifications).toHaveBeenCalledWith("student", "stu-1");
    });

    it("passes role without userId when userId is omitted", async () => {
      const repo = mockRepo({ listNotifications: jest.fn().mockResolvedValue([]) });
      const service = new BookingService(repo);

      await service.listNotifications("counselor");
      expect(repo.listNotifications).toHaveBeenCalledWith("counselor", undefined);
    });
  });

  describe("BookingService.markAllNotificationsRead — return value", () => {
    it("returns the count of marked notifications", async () => {
      const repo = mockRepo({ markAllNotificationsRead: jest.fn().mockResolvedValue(7) });
      const service = new BookingService(repo);

      const count = await service.markAllNotificationsRead("student", "stu-1");
      expect(count).toBe(7);
    });

    it("returns 0 when no notifications to mark", async () => {
      const repo = mockRepo({ markAllNotificationsRead: jest.fn().mockResolvedValue(0) });
      const service = new BookingService(repo);

      const count = await service.markAllNotificationsRead("counselor", "cou-1");
      expect(count).toBe(0);
    });
  });

  describe("BookingService.countUnreadNotifications — without userId", () => {
    it("counts unread without specifying userId", async () => {
      const repo = mockRepo({ countUnreadNotifications: jest.fn().mockResolvedValue(3) });
      const service = new BookingService(repo);

      const count = await service.countUnreadNotifications("counselor");
      expect(count).toBe(3);
      expect(repo.countUnreadNotifications).toHaveBeenCalledWith("counselor", undefined);
    });
  });

  describe("BookingService.listNotifications — anonymous thread notifications", () => {
    it("returns notifications with anonymous_thread_id set", async () => {
      const notif = makeNotification({
        appointment_id: null,
        anonymous_thread_id: "thread-1",
        type: "session_notes",
      });
      const repo = mockRepo({ listNotifications: jest.fn().mockResolvedValue([notif]) });
      const service = new BookingService(repo);

      const result = await service.listNotifications("student", "stu-1");
      expect(result[0].anonymous_thread_id).toBe("thread-1");
      expect(result[0].appointment_id).toBeNull();
    });
  });

  describe("BookingService.markNotificationRead — parameter forwarding", () => {
    it("passes the notification ID to the repository", async () => {
      const readNotification = makeNotification({ read: true });
      const repo = mockRepo({
        markNotificationRead: jest.fn().mockResolvedValue(readNotification),
      });
      const service = new BookingService(repo);

      const result = await service.markNotificationRead("notif-42");
      expect(repo.markNotificationRead).toHaveBeenCalledWith("notif-42");
      expect(result).toEqual(readNotification);
    });

    it("returns null when notification does not exist", async () => {
      const repo = mockRepo({
        markNotificationRead: jest.fn().mockResolvedValue(null),
      });
      const service = new BookingService(repo);

      const result = await service.markNotificationRead("nonexistent");
      expect(result).toBeNull();
    });
  });
});
