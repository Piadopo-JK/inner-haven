"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCreateAnonymousThread } from "@/lib/query/hooks/useAnonymousMessaging";

type Props = {
  counselorId: string;
  onCreated: (result: { threadId: string }) => Promise<void> | void;
};

export default function AnonymousRequestForm({ counselorId, onCreated }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { mutateAsync: createAnonymousThread, isPending: busy } = useCreateAnonymousThread();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setError("Please provide at least 10 characters.");
      return;
    }
    if (trimmed.length > 2000) {
      setError("Message cannot exceed 2000 characters.");
      return;
    }

    try {
      const data = await createAnonymousThread({ counselorId, message: trimmed });
      await onCreated({ threadId: data.threadId });
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    }
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border p-4"
      style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
      onSubmit={handleSubmit}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
        Start Private Conversation
      </h2>
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Your account details are hidden from counselors; they only see your pseudonymous thread label.
      </p>

      <label className="grid gap-1 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Message
        <textarea
          rows={5}
          className="rounded-xl border px-3 py-2"
          style={{
            borderColor: "var(--md-sys-color-outline)",
            background: "var(--md-sys-color-surface)",
            color: "var(--md-sys-color-on-surface)",
          }}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe what support you need (at least 10 characters)."
        />
      </label>

      {error ? (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="rounded-full">
        {busy ? "Sending…" : "Send Anonymous Message"}
      </Button>
    </form>
  );
}

