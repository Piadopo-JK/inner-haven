"use client";

import { ArrowLeft, SendHorizonal } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { AnonymousThreadMessage, AnonymousThreadSummary } from "@/components/anonymous/types";
import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { Button } from "@/components/ui/button";
import { LOADING_MESSAGES } from "@/lib/loading/states";
import {
  useAnonymousThreadMessages,
  useAnonymousThreadRealtimeSync,
  useSendAnonymousMessage,
} from "@/lib/query/hooks/useAnonymousMessaging";

type Props = {
  thread: AnonymousThreadSummary;
  sender: "student" | "counselor";
  onBack?: () => void;
};

export default function AnonymousChat({ thread, sender, onBack }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const { data: messages = [], isLoading: isLoadingMessages } = useAnonymousThreadMessages(thread.id);
  const { mutateAsync: sendAnonymousMessage, isPending: isSending } = useSendAnonymousMessage(thread.id);

  useAnonymousThreadRealtimeSync(thread.id, sender);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }

  useEffect(() => {
    setDraft("");
    setError("");
  }, [thread.id]);

  useEffect(() => {
    if (isLoadingMessages) return;
    scrollToBottom("smooth");
  }, [messages, isLoadingMessages]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    setError("");
    setDraft("");

    try {
      await sendAnonymousMessage({ message: trimmed, sender });
    } catch (err) {
      setDraft(trimmed);
      setError(err instanceof Error ? err.message : "Unable to send message right now.");
    }
  }

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).toUpperCase();

  return (
    <section
      className="grid h-full min-h-0 grid-rows-[auto_auto_1fr_auto] overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--md-sys-color-outline-variant)",
        background: "var(--md-sys-color-surface-container-low)",
      }}
    >
      <header
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{
          borderColor: "var(--md-sys-color-outline-variant)",
          background: "var(--md-sys-color-surface-container)",
        }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 md:hidden"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
          style={{
            background: "var(--md-sys-color-secondary-container)",
            color: "var(--md-sys-color-on-secondary-container)",
          }}
        >
          {(sender === "student" ? thread.counselorName : thread.anonymousLabel).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
            {sender === "student" ? thread.counselorName : thread.anonymousLabel}
          </p>
          <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            {sender === "student" ? "Counselor" : "Anonymous student"}
          </p>
        </div>
      </header>

      <div className="flex justify-center px-4 pt-3">
        <span
          className="rounded-full px-3 py-1 text-[11px] tracking-wide"
          style={{
            background: "var(--md-sys-color-surface-container-high)",
            color: "var(--md-sys-color-on-surface-variant)",
          }}
        >
          {dateLabel}
        </span>
      </div>

      <div ref={messagesContainerRef} className="space-y-3 overflow-y-auto px-4 py-3">
        {isLoadingMessages ? (
          <>
            <LoaderAnimations />
            <GentleWaveLoader
              message={LOADING_MESSAGES.chat.conversation}
              className="flex min-h-[240px] items-center justify-center"
            />
          </>
        ) : (
          messages.map((message) => {
          const mine = message.sender === sender;

          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                style={{
                  background: mine ? "var(--md-sys-color-primary)" : "var(--md-sys-color-surface-container-high)",
                  color: mine ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface)",
                }}
              >
                <p>{message.body}</p>
                <p className="mt-1 text-[11px] opacity-80">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
          })
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="border-t p-3"
        style={{
          borderColor: "var(--md-sys-color-outline-variant)",
          background: "var(--md-sys-color-surface-container)",
        }}
      >
        {error ? (
          <p className="mb-2 text-xs" style={{ color: "var(--md-sys-color-error)" }}>
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--md-sys-color-outline)",
              background: "var(--md-sys-color-surface)",
              color: "var(--md-sys-color-on-surface)",
            }}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              scrollToBottom("auto");
            }}
            placeholder={sender === "student" ? "Type your follow-up message..." : "Type your professional response..."}
          />

          <Button
            type="submit"
            className="h-11 w-11 self-end rounded-full p-0"
            style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
            aria-label="Send message"
            disabled={isSending || !draft.trim()}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </section>
  );
}
