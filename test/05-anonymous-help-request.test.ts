process.env.TOKEN_ENCRYPTION_KEY = "dd61d1831ee33319081fd5f87d0a49d3681bedc092811a634daa1eb44f0414dc";

import { encrypt, decrypt } from "@/lib/crypto";
import { encryptAnonymousMessage, decryptAnonymousMessage } from "@/lib/anonymous/crypto";
import {
  createThreadWithFirstMessage,
  sendStudentMessage,
  sendCounselorMessage,
} from "@/lib/anonymous/service";
import * as repo from "@/lib/anonymous/repository";

function chainable(terminal: any = null) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => ({ error: null })),
    update: jest.fn(() => ({ error: null })),
  };
  if (terminal !== null) {
    builder.maybeSingle = jest.fn(() => Promise.resolve(terminal));
  }
  return builder;
}

jest.mock("@/lib/anonymous/repository");
jest.mock("@/lib/supabase/server", () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => chainable()),
  })),
}));

describe("Feature 5: Anonymous Help Request", () => {
  describe("Crypto — encrypt/decrypt cycle", () => {
    it("round-trips a plaintext message", () => {
      const original = "I need help with anxiety";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", () => {
      const msg = "same message";
      const e1 = encrypt(msg);
      const e2 = encrypt(msg);
      expect(e1).not.toBe(e2);
      expect(decrypt(e1)).toBe(msg);
      expect(decrypt(e2)).toBe(msg);
    });

    it("throws on invalid format", () => {
      expect(() => decrypt("not-valid")).toThrow("Invalid encrypted token format");
    });

    it("throws on tampered ciphertext", () => {
      const encrypted = encrypt("secret");
      const parts = encrypted.split(":");
      parts[1] = "0".repeat(64);
      expect(() => decrypt(parts.join(":"))).toThrow();
    });

    it("throws on missing TOKEN_ENCRYPTION_KEY", () => {
      const original = process.env.TOKEN_ENCRYPTION_KEY;
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(() => encrypt("test")).toThrow("TOKEN_ENCRYPTION_KEY");
      process.env.TOKEN_ENCRYPTION_KEY = original;
    });

    it("handles empty string encryption", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("throws on malformed input with extra colons", () => {
      expect(() => decrypt("a:b:c:d")).toThrow("Invalid encrypted token format");
      expect(() => decrypt("a:b:c:d:e:f")).toThrow("Invalid encrypted token format");
    });
  });

  describe("Anonymous crypto wrapper", () => {
    it("encryptAnonymousMessage wraps encrypt", () => {
      const msg = "anonymous message";
      const encrypted = encryptAnonymousMessage(msg);
      expect(decryptAnonymousMessage(encrypted)).toBe(msg);
    });

    it("handles long messages", () => {
      const longMsg = "x".repeat(5000);
      const encrypted = encryptAnonymousMessage(longMsg);
      expect(decryptAnonymousMessage(encrypted)).toBe(longMsg);
    });

    it("handles unicode content", () => {
      const msg = "Hilfe benötige 我需要帮助";
      const encrypted = encryptAnonymousMessage(msg);
      expect(decryptAnonymousMessage(encrypted)).toBe(msg);
    });
  });

  describe("createThreadWithFirstMessage", () => {
    it("creates thread, adds message, and returns thread ID", async () => {
      (repo.getOrCreateThread as jest.Mock).mockResolvedValue({ id: "thread-1" });
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);

      const result = await createThreadWithFirstMessage("auth-user-1", "cou-1", "I need help");

      expect(result).toEqual({ threadId: "thread-1" });
      expect(repo.getOrCreateThread).toHaveBeenCalledWith("auth-user-1", "cou-1");
      expect(repo.addMessage).toHaveBeenCalledWith("thread-1", "student", "I need help");
    });

    it("passes full message to addMessage even when long", async () => {
      (repo.getOrCreateThread as jest.Mock).mockResolvedValue({ id: "thread-1" });
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);

      const longMsg = "a".repeat(500);
      await createThreadWithFirstMessage("auth-user-1", "cou-1", longMsg);

      expect(repo.addMessage).toHaveBeenCalledWith("thread-1", "student", longMsg);
    });

    it("propagates errors from getOrCreateThread", async () => {
      (repo.getOrCreateThread as jest.Mock).mockRejectedValue(new Error("DB connection failed"));

      await expect(
        createThreadWithFirstMessage("auth-user-1", "cou-1", "help"),
      ).rejects.toThrow("DB connection failed");
    });
  });

  describe("sendStudentMessage", () => {
    it("adds message and retrieves thread for notification", async () => {
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);
      (repo.getAnonymousThreadById as jest.Mock).mockResolvedValue({
        id: "thread-1",
        counselor_id: "cou-1",
      });

      await sendStudentMessage("thread-1", "Follow up message");

      expect(repo.addMessage).toHaveBeenCalledWith("thread-1", "student", "Follow up message");
      expect(repo.getAnonymousThreadById).toHaveBeenCalledWith("thread-1");
    });

    it("does not throw when thread is not found", async () => {
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);
      (repo.getAnonymousThreadById as jest.Mock).mockResolvedValue(null);

      await expect(
        sendStudentMessage("thread-1", "message to nowhere"),
      ).resolves.toBeUndefined();
    });
  });

  describe("sendCounselorMessage", () => {
    it("adds message and resolves student for notification", async () => {
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);
      (repo.resolveThreadOwnerAuthUserId as jest.Mock).mockResolvedValue("auth-user-1");
      (repo.resolveStudentIdByAuthUserId as jest.Mock).mockResolvedValue("stu-1");

      await sendCounselorMessage("thread-1", "Response from counselor", "cou-1");

      expect(repo.addMessage).toHaveBeenCalledWith("thread-1", "counselor", "Response from counselor", "cou-1");
      expect(repo.resolveThreadOwnerAuthUserId).toHaveBeenCalledWith("thread-1");
    });

    it("resolves student and triggers notification when student is found", async () => {
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);
      (repo.resolveThreadOwnerAuthUserId as jest.Mock).mockResolvedValue("auth-user-1");
      (repo.resolveStudentIdByAuthUserId as jest.Mock).mockResolvedValue("stu-resolved");

      await sendCounselorMessage("thread-1", "Response", "cou-1");

      expect(repo.resolveThreadOwnerAuthUserId).toHaveBeenCalledWith("thread-1");
      expect(repo.resolveStudentIdByAuthUserId).toHaveBeenCalledWith("auth-user-1");
    });

    it("handles case where student cannot be resolved", async () => {
      (repo.addMessage as jest.Mock).mockResolvedValue(undefined);
      (repo.resolveThreadOwnerAuthUserId as jest.Mock).mockResolvedValue(null);

      await expect(
        sendCounselorMessage("thread-1", "Response", "cou-1"),
      ).resolves.toBeUndefined();
    });
  });
});
