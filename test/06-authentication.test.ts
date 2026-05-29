process.env.TOKEN_ENCRYPTION_KEY = "dd61d1831ee33319081fd5f87d0a49d3681bedc092811a634daa1eb44f0414dc";

import { encrypt, decrypt } from "@/lib/crypto";
import {
  appointmentsListTag,
  appointmentTag,
  sessionNotesTag,
} from "@/lib/cache/appointments-cache";
import type { SessionRole } from "@/lib/booking/contracts";

function chainable(resolvedValue: any = null) {
  const builder: any = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve({ data: resolvedValue, error: null }));
  return builder;
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
  createServiceClient: jest.fn(),
}));

describe("Feature 6: Secure Login and Authentication", () => {
  describe("getSessionUser", () => {
    it("returns null when no session exists", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        from: jest.fn(() => chainable()),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result).toBeNull();
    });

    it("returns user with counselor role when found in counselors table", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "counselor@test.com" } },
            error: null,
          }),
        },
        from: jest.fn(() => chainable({ counselor_id: "cou-1" })),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-1");
      expect(result?.role).toBe("counselor");
    });

    it("defaults to student role when not in counselors table", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-3", email: "student@test.com" } },
            error: null,
          }),
        },
        from: jest.fn(() => chainable(null)),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result?.role).toBe("student");
    });

    it("returns user with email", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "test@example.com" } },
            error: null,
          }),
        },
        from: jest.fn(() => chainable(null)),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result?.email).toBe("test@example.com");
    });

    it("returns null when getUser returns an error", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Auth session missing"),
          }),
        },
        from: jest.fn(() => chainable()),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result).toBeNull();
    });

    it("falls back to student role when maybeSingle returns an error", async () => {
      const { createClient } = require("@/lib/supabase/server");
      const errorChain = chainable(null);
      errorChain.maybeSingle = jest.fn(() =>
        Promise.resolve({ data: null, error: new Error("Database error") }),
      );

      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-4", email: "user@test.com" } },
            error: null,
          }),
        },
        from: jest.fn(() => errorChain),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result?.role).toBe("student");
    });

    it("returns user with undefined email gracefully", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-5" } },
            error: null,
          }),
        },
        from: jest.fn(() => chainable(null)),
      });

      const { getSessionUser } = require("@/lib/supabase/get-session-user");
      const result = await getSessionUser();
      expect(result?.userId).toBe("user-5");
      expect(result?.email).toBeUndefined();
    });
  });

  describe("Cache tag scoping by role", () => {
    it("student and counselor tags are distinct", () => {
      const studentTag = appointmentsListTag("student" as SessionRole, "user-1");
      const counselorTag = appointmentsListTag("counselor" as SessionRole, "user-1");
      expect(studentTag).not.toBe(counselorTag);
    });

    it("appointment tag is role-agnostic", () => {
      expect(appointmentTag("apt-1")).toBe("appointment:apt-1");
    });

    it("session notes tag includes appointment ID", () => {
      expect(sessionNotesTag("apt-5")).toBe("session-notes:apt-5");
    });
  });

  describe("Token encryption for secure sessions", () => {
    it("encrypts and decrypts session tokens", () => {
      const token = "session-token-abc123";
      const encrypted = encrypt(token);
      expect(encrypted).not.toBe(token);
      expect(decrypt(encrypted)).toBe(token);
    });

    it("rejects tampered auth tags", () => {
      const encrypted = encrypt("secure-data");
      const parts = encrypted.split(":");
      const tag = parts[2];
      const tampered = tag.slice(0, -2) + (tag.slice(-2) === "00" ? "01" : "00");
      expect(() => decrypt(`${parts[0]}:${parts[1]}:${tampered}`)).toThrow();
    });
  });
});
