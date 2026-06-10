import { NextRequest, NextResponse } from "next/server";

import type { AppointmentDTO, NotificationDTO, SessionNoteDTO } from "@/lib/booking/contracts";

// Mocks — hoisted by Jest

const mockGetSessionUser = jest.fn();
jest.mock("@/lib/supabase/get-session-user", () => ({
  get getSessionUser() { return mockGetSessionUser; },
}));

const mockBookingService = {
  listAppointments: jest.fn(),
  getAppointmentById: jest.fn(),
  verifyAppointmentAccess: jest.fn(),
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
  updateAppointmentStatus: jest.fn(),
  rescheduleAppointment: jest.fn(),
  listNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  countUnreadNotifications: jest.fn(),
  getAvailableCounselors: jest.fn(),
  getAvailability: jest.fn(),
  getAvailabilityRange: jest.fn(),
  listCounselors: jest.fn(),
  getCounselorSchedule: jest.fn(),
  upsertCounselorSchedule: jest.fn(),
  resolveCounselorId: jest.fn(),
  resolveStudentId: jest.fn(),
  getSessionNote: jest.fn(),
  listSessionNotesByAppointmentIds: jest.fn(),
  upsertSessionNote: jest.fn(),
  getCounselorGoogleToken: jest.fn(),
  listStudents: jest.fn(),
  ensureStudentProfile: jest.fn(),
};
jest.mock("@/lib/booking/service", () => ({
  get bookingService() { return mockBookingService; },
}));

const mockRevalidateTag = jest.fn();
const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
  get revalidateTag() { return mockRevalidateTag; },
  get revalidatePath() { return mockRevalidatePath; },
  unstable_cache: (fn: Function) => fn,
}));

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  get redirect() { return mockRedirect; },
}));

const mockCreateClient = jest.fn();
const mockCreateServiceClient = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  get createClient() { return mockCreateClient; },
  get createServiceClient() { return mockCreateServiceClient; },
}));

// Mock anonymous dependencies
const mockListStudentThreads = jest.fn();
const mockCreateThreadWithFirstMessage = jest.fn();
jest.mock("@/lib/anonymous/repository", () => ({
  get listStudentThreads() { return mockListStudentThreads; },
}));
jest.mock("@/lib/anonymous/service", () => ({
  get createThreadWithFirstMessage() { return mockCreateThreadWithFirstMessage; },
}));

// Mock profile settings loader
const mockLoadProfileSettings = jest.fn();
const mockLoadCounselorScheduleForUser = jest.fn();
jest.mock("@/lib/settings/server", () => ({
  get loadProfileSettings() { return mockLoadProfileSettings; },
  get loadCounselorScheduleForUser() { return mockLoadCounselorScheduleForUser; },
}));

jest.mock("@/lib/profile/avatar-storage", () => ({
  avatarBucketName: () => "avatars",
}));

// Helpers

function makeAppointment(overrides: Partial<AppointmentDTO> = {}): AppointmentDTO {
  return {
    appointment_id: "apt-1",
    student_id: "stu-1",
    counselor_id: "cou-1",
    appointment_date: "2099-06-01",
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

function makeNote(overrides: Partial<SessionNoteDTO> = {}): SessionNoteDTO {
  return {
    note_id: "note-1",
    appointment_id: "apt-1",
    note_content: "Session went well",
    recommendations: ["Follow up in 2 weeks"],
    follow_up: "Schedule check-in",
    created_at: "2026-05-27T00:00:00Z",
    ...overrides,
  };
}

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

function makeRequest(path: string, init?: RequestInit) {
  return new NextRequest(new URL(path, "http://localhost"), init);
}

const studentSession = { userId: "user-stu-1", role: "student" as const, email: "student@test.com" };
const counselorSession = { userId: "user-cou-1", role: "counselor" as const, email: "counselor@test.com" };

// Tests

describe("Integration Tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Block 1: Appointments API
  describe("GET /api/appointments", () => {
    let GET: typeof import("@/app/api/appointments/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/appointments/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/appointments"));
      expect(res.status).toBe(401);
    });

    it("returns appointments for student role", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const appointments = [makeAppointment()];
      mockBookingService.listAppointments.mockResolvedValue(appointments);

      const res = await GET(makeRequest("/api/appointments"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(appointments);
      expect(mockBookingService.listAppointments).toHaveBeenCalledWith({
        role: "student",
        student_id: "user-stu-1",
        status: undefined,
      });
    });

    it("returns appointments for counselor role", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.listAppointments.mockResolvedValue([]);

      await GET(makeRequest("/api/appointments"));
      expect(mockBookingService.listAppointments).toHaveBeenCalledWith({
        role: "counselor",
        counselor_id: "user-cou-1",
        status: undefined,
      });
    });

    it("forwards optional status filter", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.listAppointments.mockResolvedValue([]);

      await GET(makeRequest("/api/appointments?status=pending"));
      expect(mockBookingService.listAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" }),
      );
    });

    it("returns empty array when no appointments exist", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.listAppointments.mockResolvedValue([]);

      const res = await GET(makeRequest("/api/appointments"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([]);
    });
  });

  describe("POST /api/appointments", () => {
    let POST: typeof import("@/app/api/appointments/route").POST;

    beforeAll(() => {
      ({ POST } = require("@/app/api/appointments/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await POST(makeRequest("/api/appointments", { method: "POST" }));
      expect(res.status).toBe(401);
    });

    it("returns 403 for counselor role", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const res = await POST(makeRequest("/api/appointments", { method: "POST" }));
      expect(res.status).toBe(403);
    });

    it("returns 400 when required fields missing", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({ counselor_id: "cou-1" }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for past appointment", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2020-01-01",
            appointment_time: "10:00",
            mode: "online",
            reason: "test",
          }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/past/i);
    });

    it("returns 201 with created appointment", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const created = makeAppointment();
      mockBookingService.createAppointment.mockResolvedValue(created);

      const res = await POST(
        makeRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            mode: "online",
            reason: "test",
          }),
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.appointment_id).toBe("apt-1");
    });

    it("calls revalidateTag with correct cache tags", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.createAppointment.mockResolvedValue(makeAppointment());

      await POST(
        makeRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            mode: "online",
            reason: "test",
          }),
        }),
      );
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:student:user-stu-1", "max");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointment:apt-1", "max");
    });

    it("returns 409 for timeslot conflict", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.createAppointment.mockRejectedValue(new Error("Timeslot is already taken"));

      const res = await POST(
        makeRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            mode: "online",
            reason: "test",
          }),
        }),
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("BOOKING_SLOT_TAKEN");
    });

    it("returns 500 for generic errors", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.createAppointment.mockRejectedValue(new Error("Unknown error"));

      const res = await POST(
        makeRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            mode: "online",
            reason: "test",
          }),
        }),
      );
      expect(res.status).toBe(500);
    });
  });

  // Block 2: Appointment Detail API
  describe("GET /api/appointments/[id]", () => {
    let GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse>;

    beforeAll(() => {
      ({ GET } = require("@/app/api/appointments/[id]/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/appointments/apt-1"), {
        params: Promise.resolve({ id: "apt-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 404 when appointment not found", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await GET(makeRequest("/api/appointments/apt-999"), {
        params: Promise.resolve({ id: "apt-999" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns appointment data", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());

      const res = await GET(makeRequest("/api/appointments/apt-1"), {
        params: Promise.resolve({ id: "apt-1" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.appointment_id).toBe("apt-1");
    });
    it("returns 404 when accessing another student's appointment (BUG-005)", async () => {
      // Student B tries to view Student A's appointment via shared URL
      const studentB = { userId: "user-stu-2", role: "student" as const, email: "studentB@test.com" };
      mockGetSessionUser.mockResolvedValue(studentB);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await GET(makeRequest("/api/appointments/apt-1"), {
        params: Promise.resolve({ id: "apt-1" }),
      });
      expect(res.status).toBe(404);
      expect(mockBookingService.verifyAppointmentAccess).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-stu-2" }),
        "apt-1",
      );
    });

    it("returns 404 when counselor accesses unassigned appointment (BUG-005)", async () => {
      const otherCounselor = { userId: "user-cou-2", role: "counselor" as const, email: "counselorB@test.com" };
      mockGetSessionUser.mockResolvedValue(otherCounselor);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await GET(makeRequest("/api/appointments/apt-1"), {
        params: Promise.resolve({ id: "apt-1" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/appointments/[id]", () => {
    let PATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse>;

    beforeAll(() => {
      ({ PATCH } = require("@/app/api/appointments/[id]/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", { method: "PATCH" }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(401);
    });

    it("returns 401 for counselor role", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", { method: "PATCH" }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(401);
    });

    it("returns updated appointment for student", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      const updated = makeAppointment({ reason: "Updated reason", appointment_date: "2099-07-01" });
      mockBookingService.updateAppointment.mockResolvedValue(updated);

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", {
          method: "PATCH",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-07-01",
            appointment_time: "11:00",
            reason: "Updated reason",
            mode: "online",
          }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reason).toBe("Updated reason");
      expect(body.appointment_date).toBe("2099-07-01");
    });

    it("returns 409 for BOOKING_SLOT_TAKEN", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointment.mockRejectedValue(new Error("Timeslot is already taken"));

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", {
          method: "PATCH",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            reason: "test",
            mode: "online",
          }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("BOOKING_SLOT_TAKEN");
    });

    it("returns 409 for APPOINTMENT_NOT_EDITABLE", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment({ status: "approved" }));

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", {
          method: "PATCH",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            reason: "test",
            mode: "online",
          }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("APPOINTMENT_NOT_EDITABLE");
    });

    it("returns 500 for generic update failure", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointment.mockRejectedValue(new Error("Unknown error"));

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", {
          method: "PATCH",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            reason: "test",
            mode: "online",
          }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe("APPOINTMENT_UPDATE_FAILED");
    });

    it("returns 404 when student tries to edit another student's appointment (BUG-005)", async () => {
      const studentB = { userId: "user-stu-2", role: "student" as const, email: "studentB@test.com" };
      mockGetSessionUser.mockResolvedValue(studentB);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1", {
          method: "PATCH",
          body: JSON.stringify({
            counselor_id: "cou-1",
            appointment_date: "2099-06-01",
            appointment_time: "10:00",
            reason: "hacked",
            mode: "online",
          }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(404);
    });
  });

  // Block 3: Appointment Status API
  describe("PATCH /api/appointments/[id]/status", () => {
    let PATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse>;

    beforeAll(() => {
      ({ PATCH } = require("@/app/api/appointments/[id]/status/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(401);
    });

    it("returns 403 for student role", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 when status missing", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({}),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when appointment not found", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await PATCH(
        makeRequest("/api/appointments/apt-999/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-999" }) },
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 with updated appointment", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      const approved = makeAppointment({ status: "approved" });
      mockBookingService.updateAppointmentStatus.mockResolvedValue(approved);

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("approved");
    });

    it("calls revalidateTag with correct cache tags", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockResolvedValue(makeAppointment({ status: "approved" }));

      await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:counselor:user-cou-1", "max");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointment:apt-1", "max");
    });

    it("returns 409 with GOOGLE_RECONNECT_REQUIRED", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockRejectedValue(
        new Error("GOOGLE_RECONNECT_REQUIRED:Reconnect Google"),
      );

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("GOOGLE_RECONNECT_REQUIRED");
    });

    it("returns 502 with GOOGLE_MEET_CREATE_FAILED", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockRejectedValue(
        new Error("GOOGLE_MEET_CREATE_FAILED:Meet failed"),
      );

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(502);
    });

    it("returns 409 for timeslot conflict", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockRejectedValue(
        new Error("Timeslot is already taken"),
      );

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 when unassigned counselor tries to approve (BUG-005)", async () => {
      const otherCounselor = { userId: "user-cou-2", role: "counselor" as const, email: "counselorB@test.com" };
      mockGetSessionUser.mockResolvedValue(otherCounselor);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await PATCH(
        makeRequest("/api/appointments/apt-1/status", {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(404);
    });
  });

  // Block 4: Appointment Notes API
  describe("GET /api/appointments/[id]/notes", () => {
    let GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse>;

    beforeAll(() => {
      ({ GET } = require("@/app/api/appointments/[id]/notes/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/appointments/apt-1/notes"), {
        params: Promise.resolve({ id: "apt-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 404 when appointment not found", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);

      const res = await GET(makeRequest("/api/appointments/apt-999/notes"), {
        params: Promise.resolve({ id: "apt-999" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns note data", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      const note = makeNote();
      mockBookingService.getSessionNote.mockResolvedValue(note);

      const res = await GET(makeRequest("/api/appointments/apt-1/notes"), {
        params: Promise.resolve({ id: "apt-1" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.note.note_id).toBe("note-1");
    });
  });

  describe("PUT /api/appointments/[id]/notes", () => {
    let PUT: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse>;

    beforeAll(() => {
      ({ PUT } = require("@/app/api/appointments/[id]/notes/route"));
    });

    it("returns 403 for student role", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());

      const res = await PUT(
        makeRequest("/api/appointments/apt-1/notes", {
          method: "PUT",
          body: JSON.stringify({ note_content: "test" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(403);
    });

    it("returns 200 with created/updated note", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.resolveCounselorId.mockResolvedValue("cou-1");
      const note = makeNote();
      mockBookingService.upsertSessionNote.mockResolvedValue(note);

      const res = await PUT(
        makeRequest("/api/appointments/apt-1/notes", {
          method: "PUT",
          body: JSON.stringify({
            note_content: "Session went well",
            recommendations: ["Follow up"],
            follow_up: "Schedule check-in",
          }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(res.status).toBe(200);
      expect(mockBookingService.upsertSessionNote).toHaveBeenCalledWith(
        "apt-1",
        expect.objectContaining({ note_content: "Session went well" }),
        "cou-1",
      );
    });

    it("calls revalidateTag for notes and appointment tags", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.resolveCounselorId.mockResolvedValue("cou-1");
      mockBookingService.upsertSessionNote.mockResolvedValue(makeNote());

      await PUT(
        makeRequest("/api/appointments/apt-1/notes", {
          method: "PUT",
          body: JSON.stringify({ note_content: "x" }),
        }),
        { params: Promise.resolve({ id: "apt-1" }) },
      );
      expect(mockRevalidateTag).toHaveBeenCalledWith("session-notes:apt-1", "max");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointment:apt-1", "max");
    });
  });

  // Block 5: Notes Batch API
  describe("GET /api/appointments/notes-batch", () => {
    let GET: typeof import("@/app/api/appointments/notes-batch/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/appointments/notes-batch/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/appointments/notes-batch"));
      expect(res.status).toBe(401);
    });

    it("returns empty object when no ids param", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/appointments/notes-batch"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.notesByAppointmentId).toEqual({});
    });

    it("returns only notes for appointments owned by user", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.listAppointments.mockResolvedValue([
        makeAppointment({ appointment_id: "apt-1" }),
        makeAppointment({ appointment_id: "apt-2" }),
      ]);
      const notes = new Map([["apt-1", makeNote()]]);
      mockBookingService.listSessionNotesByAppointmentIds.mockResolvedValue(notes);

      const res = await GET(makeRequest("/api/appointments/notes-batch?ids=apt-1,apt-3"));
      expect(res.status).toBe(200);
      const body = await res.json();
      // apt-3 is not owned so should be filtered out
      expect(mockBookingService.listSessionNotesByAppointmentIds).toHaveBeenCalledWith(["apt-1"]);
      expect(body.notesByAppointmentId["apt-1"]).toBeDefined();
      expect(body.notesByAppointmentId["apt-3"]).toBeUndefined();
    });
  });

  // Block 6: Available Counselors API (which counselors are free at a slot)
  describe("GET /api/availability/counselors", () => {
    let GET: typeof import("@/app/api/availability/counselors/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/availability/counselors/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/availability/counselors?date=2099-06-01&time=10:00"));
      expect(res.status).toBe(401);
    });

    it("returns 400 when date or time missing", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/availability/counselors?date=2099-06-01"));
      expect(res.status).toBe(400);
    });

    it("returns available counselors", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.getAvailableCounselors.mockResolvedValue([]);

      const res = await GET(makeRequest("/api/availability/counselors?date=2099-06-01&time=10:00"));
      expect(res.status).toBe(200);
      expect(mockBookingService.getAvailableCounselors).toHaveBeenCalledWith("2099-06-01", "10:00");
    });
  });

  // Block 7: Counselor Availability Window API
  describe("GET /api/availability", () => {
    let GET: typeof import("@/app/api/availability/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/availability/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/availability?counselor_id=cou-1"));
      expect(res.status).toBe(401);
    });

    it("returns 400 when counselor_id missing", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/availability"));
      expect(res.status).toBe(400);
    });

    it("returns 403 when counselor requests another counselor's data", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.resolveCounselorId.mockResolvedValue("cou-own");

      const res = await GET(makeRequest("/api/availability?counselor_id=cou-other"));
      expect(res.status).toBe(403);
    });

    it("returns single date availability", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.getAvailability.mockResolvedValue({ slots: [], empty_state: "available" });

      const res = await GET(makeRequest("/api/availability?counselor_id=cou-1&date=2099-06-01"));
      expect(res.status).toBe(200);
      expect(mockBookingService.getAvailability).toHaveBeenCalledWith("cou-1", "2099-06-01");
    });

    it("returns 400 when from/to missing and no date", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/availability?counselor_id=cou-1"));
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid date range", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(
        makeRequest("/api/availability?counselor_id=cou-1&from=2099-07-01&to=2099-06-01"),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when range exceeds 42 days", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(
        makeRequest("/api/availability?counselor_id=cou-1&from=2099-01-01&to=2099-12-31"),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/42/i);
    });

    it("returns availability window for valid range", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.getAvailabilityRange.mockResolvedValue({});

      const res = await GET(
        makeRequest("/api/availability?counselor_id=cou-1&from=2099-06-01&to=2099-06-07"),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.counselor_id).toBe("cou-1");
      expect(body.from).toBe("2099-06-01");
      expect(body.to).toBe("2099-06-07");
    });
  });

  // Block 8: Notifications API
  describe("GET /api/notifications", () => {
    let GET: typeof import("@/app/api/notifications/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/notifications/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET(makeRequest("/api/notifications?role=counselor"));
      expect(res.status).toBe(401);
    });

    it("returns 400 when role missing", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/notifications"));
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid role", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/notifications?role=admin"));
      expect(res.status).toBe(400);
    });

    it("returns 403 when role does not match session", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET(makeRequest("/api/notifications?role=counselor"));
      expect(res.status).toBe(403);
    });

    it("returns 200 with notification data", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const notifications = [makeNotification()];
      mockBookingService.listNotifications.mockResolvedValue(notifications);

      const res = await GET(makeRequest("/api/notifications?role=counselor"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(notifications);
    });
  });

  // Block 9: Anonymous Threads API
  describe("POST /api/anonymous-threads", () => {
    let POST: typeof import("@/app/api/anonymous-threads/route").POST;

    beforeAll(() => {
      ({ POST } = require("@/app/api/anonymous-threads/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "Hello world test" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 403 for counselor role", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "Hello world test" }),
        }),
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 when counselorId missing", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ message: "Hello world test" }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when message too short", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "short" }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when message too long", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "x".repeat(2001) }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 201 with threadId", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockCreateThreadWithFirstMessage.mockResolvedValue({ threadId: "thread-1" });

      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "I need help with something" }),
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.threadId).toBe("thread-1");
    });

    it("returns 500 on service error", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockCreateThreadWithFirstMessage.mockRejectedValue(new Error("DB error"));

      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "I need help with something" }),
        }),
      );
      expect(res.status).toBe(500);
    });

    it("returns 409 on duplicate active thread", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const dupError = new Error("duplicate") as Error & { code: string };
      dupError.code = "23505";
      mockCreateThreadWithFirstMessage.mockRejectedValue(dupError);

      const res = await POST(
        makeRequest("/api/anonymous-threads", {
          method: "POST",
          body: JSON.stringify({ counselorId: "cou-1", message: "I need help with something" }),
        }),
      );
      expect(res.status).toBe(409);
    });
  });

  // Block 10: Settings Profile API
  describe("GET /api/settings/profile", () => {
    let GET: typeof import("@/app/api/settings/profile/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/settings/profile/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns 404 when profile not found", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockLoadProfileSettings.mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(404);
    });

    it("returns profile data", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockLoadProfileSettings.mockResolvedValue({ role: "student", name: "Test" });

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("Test");
    });
  });

  describe("POST /api/settings/profile", () => {
    let POST: typeof import("@/app/api/settings/profile/route").POST;

    beforeAll(() => {
      ({ POST } = require("@/app/api/settings/profile/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await POST(makeRequest("/api/settings/profile", { method: "POST" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid avatar URL", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/settings/profile", {
          method: "POST",
          body: JSON.stringify({ name: "Test", avatar_url: "https://evil.com/image.png" }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/avatar/i);
    });

    it("returns 400 for name too long", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(
        makeRequest("/api/settings/profile", {
          method: "POST",
          body: JSON.stringify({ name: "x".repeat(121) }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 for counselor profile update", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockCreateServiceClient.mockReturnValue({
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      });

      const res = await POST(
        makeRequest("/api/settings/profile", {
          method: "POST",
          body: JSON.stringify({ name: "Dr. Smith" }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it("returns 200 for student profile update", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockCreateServiceClient.mockReturnValue({
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      });

      const res = await POST(
        makeRequest("/api/settings/profile", {
          method: "POST",
          body: JSON.stringify({ name: "Jane" }),
        }),
      );
      expect(res.status).toBe(200);
    });
  });

  // Block 11: Counselor Schedule API
  describe("GET /api/counselor/schedule", () => {
    let GET: typeof import("@/app/api/counselor/schedule/route").GET;

    beforeAll(() => {
      ({ GET } = require("@/app/api/counselor/schedule/route"));
    });

    it("returns 401 when not authenticated", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns 403 for student role", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it("returns schedule rules", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const rules = [{ day_of_week: 1, start_time: "09:00", end_time: "17:00", slot_duration_minutes: 30, is_active: true, breaks: [] }];
      mockLoadCounselorScheduleForUser.mockResolvedValue(rules);

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(rules);
    });
  });

  describe("POST /api/counselor/schedule", () => {
    let POST: typeof import("@/app/api/counselor/schedule/route").POST;

    beforeAll(() => {
      ({ POST } = require("@/app/api/counselor/schedule/route"));
    });

    it("returns 403 for student role", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      const res = await POST(makeRequest("/api/counselor/schedule", { method: "POST" }));
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid rules payload", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      const res = await POST(
        makeRequest("/api/counselor/schedule", {
          method: "POST",
          body: JSON.stringify({ rules: [{ day_of_week: 9 }] }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 with ok:true", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.resolveCounselorId.mockResolvedValue("cou-1");
      mockBookingService.upsertCounselorSchedule.mockResolvedValue(undefined);

      const validRules = [{
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration_minutes: 30,
        is_active: true,
        breaks: [],
      }];

      const res = await POST(
        makeRequest("/api/counselor/schedule", {
          method: "POST",
          body: JSON.stringify({ rules: validRules }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  // Block 12: Server Actions — Appointments
  describe("updateAppointmentStatusAction", () => {
    const mod = require("@/app/actions/appointments");

    it("throws for non-counselor", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      await expect(mod.updateAppointmentStatusAction("apt-1", "approved")).rejects.toThrow("Unauthorized");
    });

    it("throws for missing appointment", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(null);
      await expect(mod.updateAppointmentStatusAction("apt-999", "approved")).rejects.toThrow("Forbidden");
    });

    it("calls service and revalidates cache", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockResolvedValue(makeAppointment({ status: "approved" }));

      await mod.updateAppointmentStatusAction("apt-1", "approved");
      expect(mockBookingService.updateAppointmentStatus).toHaveBeenCalledWith("apt-1", "approved", "counselor");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:counselor:user-cou-1", "max");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointment:apt-1", "max");
    });

    it("redirects on GOOGLE_RECONNECT_REQUIRED", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockRejectedValue(
        new Error("GOOGLE_RECONNECT_REQUIRED:Reconnect"),
      );
      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(mod.updateAppointmentStatusAction("apt-1", "approved")).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/settings?reconnect=google");
    });
  });

  describe("cancelStudentAppointmentAction", () => {
    const mod = require("@/app/actions/appointments");

    it("throws for non-student", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      await expect(mod.cancelStudentAppointmentAction("apt-1")).rejects.toThrow("Unauthorized");
    });

    it("throws for already cancelled appointment", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(
        makeAppointment({ status: "cancelled" }),
      );
      await expect(mod.cancelStudentAppointmentAction("apt-1")).rejects.toThrow("Appointment cannot be cancelled");
    });

    it("cancels and revalidates cache", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.updateAppointmentStatus.mockResolvedValue(
        makeAppointment({ status: "cancelled" }),
      );

      await mod.cancelStudentAppointmentAction("apt-1");
      expect(mockBookingService.updateAppointmentStatus).toHaveBeenCalledWith("apt-1", "cancelled", "student");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:student:user-stu-1", "max");
    });
  });

  describe("completeAppointmentAction", () => {
    const mod = require("@/app/actions/appointments");

    it("throws for non-counselor", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      await expect(mod.completeAppointmentAction("apt-1")).rejects.toThrow("Unauthorized");
    });

    it("throws for non-past non-approved appointment", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(
        makeAppointment({ status: "pending", appointment_date: "2099-06-01" }),
      );
      await expect(mod.completeAppointmentAction("apt-1")).rejects.toThrow("not eligible");
    });

    it("no-ops for already completed appointment", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(
        makeAppointment({ status: "completed", appointment_date: "2020-01-01" }),
      );

      await mod.completeAppointmentAction("apt-1");
      expect(mockBookingService.updateAppointmentStatus).not.toHaveBeenCalled();
      expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:counselor:user-cou-1", "max");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointment:apt-1", "max");
    });

    it("completes past approved appointment and revalidates", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(
        makeAppointment({ status: "approved", appointment_date: "2020-01-01" }),
      );
      mockBookingService.updateAppointmentStatus.mockResolvedValue(
        makeAppointment({ status: "completed" }),
      );

      await mod.completeAppointmentAction("apt-1");
      expect(mockBookingService.updateAppointmentStatus).toHaveBeenCalledWith("apt-1", "completed");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:counselor:user-cou-1", "max");
    });
  });

  describe("updateStudentPendingAppointmentAction", () => {
    const mod = require("@/app/actions/appointments");

    it("throws for non-pending appointment", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(
        makeAppointment({ status: "approved" }),
      );
      await expect(
        mod.updateStudentPendingAppointmentAction("apt-1", {
          counselor_id: "cou-1",
          appointment_date: "2099-06-01",
          appointment_time: "10:00",
          reason: "test",
          mode: "online",
        }),
      ).rejects.toThrow("pending");
    });

    it("updates and revalidates cache", async () => {
      mockGetSessionUser.mockResolvedValue(studentSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      const updated = makeAppointment({ reason: "Updated" });
      mockBookingService.updateAppointment.mockResolvedValue(updated);

      const result = await mod.updateStudentPendingAppointmentAction("apt-1", {
        counselor_id: "cou-1",
        appointment_date: "2099-06-01",
        appointment_time: "10:00",
        reason: "Updated",
        mode: "online",
      });
      expect(result.reason).toBe("Updated");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:student:user-stu-1", "max");
    });
  });

  describe("rescheduleCounselorAppointmentAction", () => {
    const mod = require("@/app/actions/appointments");

    it("validates date format", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      await expect(mod.rescheduleCounselorAppointmentAction("apt-1", "bad-date", "10:00")).rejects.toThrow("Invalid appointment date");
    });

    it("validates time format", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      await expect(mod.rescheduleCounselorAppointmentAction("apt-1", "2099-06-01", "25:00")).rejects.toThrow("Invalid appointment time");
    });

    it("reschedules and revalidates cache", async () => {
      mockGetSessionUser.mockResolvedValue(counselorSession);
      mockBookingService.verifyAppointmentAccess.mockResolvedValue(makeAppointment());
      mockBookingService.rescheduleAppointment.mockResolvedValue(
        makeAppointment({ appointment_date: "2099-06-15", appointment_time: "14:00:00" }),
      );

      await mod.rescheduleCounselorAppointmentAction("apt-1", "2099-06-15", "14:00");
      expect(mockBookingService.rescheduleAppointment).toHaveBeenCalledWith("apt-1", "2099-06-15", "14:00");
      expect(mockRevalidateTag).toHaveBeenCalledWith("appointments:list:counselor:user-cou-1", "max");
    });
  });

  // Block 13: Server Action — Onboarding
  describe("setupStudentProfile", () => {
    const mod = require("@/app/actions/onboarding");

    function makeFormData(entries: Record<string, string>) {
      const fd = new FormData();
      for (const [key, value] of Object.entries(entries)) {
        fd.set(key, value);
      }
      return fd;
    }

    it("returns error when name is empty", async () => {
      const result = await mod.setupStudentProfile({}, makeFormData({ name: "" }));
      expect(result.error).toBeDefined();
    });

    it("returns error when not logged in", async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      });

      const result = await mod.setupStudentProfile({}, makeFormData({ name: "Test" }));
      expect(result.error).toMatch(/logged in/i);
    });

    it("returns error for non-unique-constraint DB errors", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "test@test.com" } },
          }),
        },
      });
      // resolveStudentId returns null (no existing profile), then ensureStudentProfile throws
      mockBookingService.resolveStudentId.mockResolvedValue(null);
      mockBookingService.ensureStudentProfile.mockRejectedValue(new Error("relation not found"));

      const result = await mod.setupStudentProfile({}, makeFormData({ name: "Test" }));
      expect(result.error).toMatch(/Failed/i);
    });

    it("silently ignores unique constraint violation (23505)", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "test@test.com" } },
          }),
        },
      });
      // ensureStudentProfile handles 23505 internally and returns created: false
      mockBookingService.ensureStudentProfile.mockResolvedValue({ created: false, studentId: "stu-1" });

      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(mod.setupStudentProfile({}, makeFormData({ name: "Jane" }))).rejects.toThrow();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("inserts student and revalidates on success", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "test@test.com" } },
          }),
        },
      });
      mockBookingService.ensureStudentProfile.mockResolvedValue({ created: true, studentId: "stu-1" });

      // redirect throws NEXT_REDIRECT
      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(mod.setupStudentProfile({}, makeFormData({ name: "Jane" }))).rejects.toThrow();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  // Block 14: Server Action — Notifications
  describe("markAllNotificationsReadAction", () => {
    const mod = require("@/app/actions/notifications");

    it("calls service with correct arguments", async () => {
      mockBookingService.markAllNotificationsRead.mockResolvedValue(5);

      await mod.markAllNotificationsReadAction("counselor", "cou-1");
      expect(mockBookingService.markAllNotificationsRead).toHaveBeenCalledWith("counselor", "cou-1");
    });

    it("calls service for student role", async () => {
      mockBookingService.markAllNotificationsRead.mockResolvedValue(0);

      await mod.markAllNotificationsReadAction("student", "stu-1");
      expect(mockBookingService.markAllNotificationsRead).toHaveBeenCalledWith("student", "stu-1");
    });
  });

  // Block 15: Cache Tag Generators
  describe("Cache tag generators", () => {
    let appointmentsListTag: typeof import("@/lib/cache/appointments-cache").appointmentsListTag;
    let appointmentTag: typeof import("@/lib/cache/appointments-cache").appointmentTag;
    let sessionNotesTag: typeof import("@/lib/cache/appointments-cache").sessionNotesTag;

    beforeAll(() => {
      ({ appointmentsListTag, appointmentTag, sessionNotesTag } = require("@/lib/cache/appointments-cache"));
    });

    it("appointmentsListTag produces correct format", () => {
      expect(appointmentsListTag("student", "user-1")).toBe("appointments:list:student:user-1");
    });

    it("appointmentTag includes appointment ID", () => {
      expect(appointmentTag("apt-42")).toBe("appointment:apt-42");
    });

    it("sessionNotesTag includes appointment ID", () => {
      expect(sessionNotesTag("apt-5")).toBe("session-notes:apt-5");
    });

    it("tags are distinct across roles", () => {
      const student = appointmentsListTag("student", "user-1");
      const counselor = appointmentsListTag("counselor", "user-1");
      expect(student).not.toBe(counselor);
    });
  });
});
