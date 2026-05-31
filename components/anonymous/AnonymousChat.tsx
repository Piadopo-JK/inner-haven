"use client";

import { ArrowLeft, EllipsisVertical, SendHorizonal, UserRound } from "lucide-react";
import { FormEvent, memo, useEffect, useMemo, useRef, useState } from "react";

import { AnonymousThreadMessage, AnonymousThreadSummary } from "@/components/anonymous/types";
import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOADING_MESSAGES } from "@/lib/loading/states";
import {
  useAnonymousThreadMessages,
  useAnonymousThreadRealtimeSync,
  useSendAnonymousMessage,
} from "@/lib/query/hooks/useAnonymousMessaging";

// ── Message grouping ──────────────────────────────────────────────

type MessageGroup = {
  sender: "student" | "counselor";
  messages: AnonymousThreadMessage[];
};

function groupMessages(messages: AnonymousThreadMessage[]): MessageGroup[] {
  if (messages.length === 0) return [];
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.sender === msg.sender) {
      last.messages.push(msg);
    } else {
      groups.push({ sender: msg.sender, messages: [msg] });
    }
  }
  return groups;
}

function bubbleRadius(mine: boolean, first: boolean, last: boolean, only: boolean): string {
  if (only) return mine ? "rounded-2xl rounded-br-[6px]" : "rounded-2xl rounded-bl-[6px]";
  if (first) return mine ? "rounded-t-2xl rounded-bl-2xl rounded-br-[6px]" : "rounded-t-2xl rounded-br-2xl rounded-bl-[6px]";
  if (last) return mine ? "rounded-b-2xl rounded-tl-2xl rounded-tr-[6px]" : "rounded-b-2xl rounded-tr-2xl rounded-tl-[6px]";
  return mine ? "rounded-l-2xl rounded-r-[6px]" : "rounded-r-2xl rounded-l-[6px]";
}

function formatGroupTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Message bubble ─────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({
  message,
  mine,
  firstInGroup,
  lastInGroup,
  isOnly,
  isLastMessage,
}: {
  message: AnonymousThreadMessage;
  mine: boolean;
  firstInGroup: boolean;
  lastInGroup: boolean;
  isOnly: boolean;
  isLastMessage: boolean;
}) {
  const radius = bubbleRadius(mine, firstInGroup, lastInGroup, isOnly);
  const pending = message.id.startsWith("temp-");

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3 py-2 text-sm ${radius}`}
        style={{
          background: mine ? "var(--md-sys-color-primary)" : "var(--md-sys-color-surface-container-high)",
          color: mine ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface)",
        }}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        {mine && isLastMessage ? (
          pending ? (
            <span className="mt-0.5 text-right text-[10px] italic opacity-50">pending</span>
          ) : (
            <span className="mt-0.5 text-right text-[10px] opacity-60">✓</span>
          )
        ) : null}
      </div>
    </div>
  );
});

// ── Message group ──────────────────────────────────────────────────

const MessageGroupBlock = memo(function MessageGroupBlock({
  group,
  mine,
  isLastGroup,
}: {
  group: MessageGroup;
  mine: boolean;
  isLastGroup: boolean;
}) {
  const timestamp = group.messages[0]!.createdAt;
  const lastIndex = group.messages.length - 1;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-center py-1">
        <span
          className="rounded-full px-3 py-0.5 text-[11px] tracking-wide"
          style={{
            background: "var(--md-sys-color-surface-container-high)",
            color: "var(--md-sys-color-on-surface-variant)",
          }}
        >
          {formatGroupTime(timestamp)}
        </span>
      </div>
      {group.messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          mine={mine}
          firstInGroup={i === 0}
          lastInGroup={i === lastIndex}
          isOnly={group.messages.length === 1}
          isLastMessage={isLastGroup && i === lastIndex}
        />
      ))}
    </div>
  );
});

type Props = {
  thread: AnonymousThreadSummary;
  sender: "student" | "counselor";
  onBack?: () => void;
  onNewConversation?: () => void;
  onRemove?: () => void;
};

export default function AnonymousChat({ thread, sender, onBack, onNewConversation, onRemove }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const { data: messages = [], isLoading: isLoadingMessages } = useAnonymousThreadMessages(thread.id);
  const { mutateAsync: sendAnonymousMessage, isPending: isSending } = useSendAnonymousMessage(thread.id);

  useAnonymousThreadRealtimeSync(thread.id, sender);

  const isDetached = thread.status === "detached";
  const hasMenu = !isDetached && (sender === "student" ? !!(onNewConversation || onRemove) : !!onRemove);

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

  const messageGroups = useMemo(() => groupMessages(messages), [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--md-sys-color-outline-variant)",
        background: "var(--md-sys-color-surface-container-low)",
      }}
    >
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
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
        {sender === "student" && thread.counselorAvatarUrl ? (
          <img
            src={thread.counselorAvatarUrl}
            alt={thread.counselorName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
            style={{
              background: sender === "counselor"
                ? "var(--md-sys-color-surface-container-high)"
                : "var(--md-sys-color-secondary-container)",
              color: sender === "counselor"
                ? "var(--md-sys-color-on-surface-variant)"
                : "var(--md-sys-color-on-secondary-container)",
            }}
          >
            {sender === "counselor" ? (
              <UserRound className="h-5 w-5" />
            ) : (
              <span className="text-sm font-semibold">
                {thread.counselorName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
            {sender === "student" ? thread.counselorName : thread.anonymousLabel}
          </p>
          <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            {sender === "student"
              ? `You · ${thread.anonymousLabel}`
              : isDetached
                ? "Thread closed"
                : "Anonymous student"}
          </p>
        </div>
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sender === "student" && onNewConversation ? (
                <DropdownMenuItem onClick={onNewConversation}>
                  New conversation
                </DropdownMenuItem>
              ) : null}
              {onRemove ? (
                <DropdownMenuItem onClick={onRemove}>
                  Remove
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="flex shrink-0 justify-center px-4 pt-3">
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

      <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {isLoadingMessages ? (
          <>
            <LoaderAnimations />
            <GentleWaveLoader
              message={LOADING_MESSAGES.chat.conversation}
              className="flex min-h-[240px] items-center justify-center"
            />
          </>
        ) : (
          messageGroups.map((group, gi) => (
            <MessageGroupBlock
              key={group.messages[0]!.id}
              group={group}
              mine={group.sender === sender}
              isLastGroup={gi === messageGroups.length - 1}
            />
          ))
        )}
      </div>

      {sender === "counselor" && isDetached ? (
        <div className="shrink-0 border-t p-4 text-center text-sm"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            color: "var(--md-sys-color-on-surface-variant)",
            background: "var(--md-sys-color-surface-container)",
          }}
        >
          This conversation is closed. The user can no longer be reached.
        </div>
      ) : (
        <form onSubmit={sendMessage} className="shrink-0 border-t p-3"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container)",
          }}
        >
          {error ? (
            <p className="mb-2 text-xs" style={{ color: "var(--md-sys-color-error)" }}>{error}</p>
          ) : null}
          <div className="flex items-center gap-2">
            <div
              className="flex flex-1 items-center rounded-full border px-4"
              style={{
                borderColor: "var(--md-sys-color-outline)",
                background: "var(--md-sys-color-surface)",
              }}
            >
              <textarea
                rows={1}
                className="w-full resize-none bg-transparent py-3 text-sm leading-relaxed outline-none"
                style={{ color: "var(--md-sys-color-on-surface)" }}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  scrollToBottom("auto");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    const form = event.currentTarget.closest("form");
                    form?.requestSubmit();
                  }
                }}
                placeholder={sender === "student" ? "Type your follow-up message..." : "Type your professional response..."}
              />
            </div>
            <Button
              type="submit"
              className="h-10 w-10 shrink-0 rounded-full p-0"
              style={{ background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)" }}
              aria-label="Send message"
              disabled={isSending || !draft.trim()}
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
