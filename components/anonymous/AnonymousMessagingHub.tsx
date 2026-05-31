"use client";

import { useEffect, useState } from "react";

import AnonymousChat from "@/components/anonymous/AnonymousChat";
import AnonymousRequestForm from "@/components/anonymous/AnonymousRequestForm";
import ThreadList from "@/components/anonymous/ThreadList";
import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { Button } from "@/components/ui/button";
import { LOADING_MESSAGES } from "@/lib/loading/states";
import {
  useAnonymousIdentity,
  useAnonymousIdentityRealtimeSync,
  useDetachThread,
} from "@/lib/query/hooks/useAnonymousMessaging";

export default function AnonymousMessagingHub({
  counselorId,
  threadId,
}: {
  counselorId?: string;
  threadId?: string;
}) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [showDetachConfirm, setShowDetachConfirm] = useState(false);
  const [detachError, setDetachError] = useState("");
  const { data: studentThreads, isLoading: isChecking } = useAnonymousIdentity();
  const { mutateAsync: detachThread, isPending: isDetaching } = useDetachThread();

  useAnonymousIdentityRealtimeSync();

  const threads = studentThreads?.threads ?? [];

  useEffect(() => {
    if (!studentThreads) {
      setSelectedThreadId(undefined);
      return;
    }

    setSelectedThreadId((previous) => {
      if (previous && threads.some((t) => t.id === previous)) {
        return previous;
      }

      if (threadId) {
        const match = threads.find((t) => t.id === threadId);
        if (match) return match.id;
      }

      if (counselorId) {
        const match = threads.find((t) => t.counselorId === counselorId);
        if (match) return match.id;
      }

      if (threads.length === 1) return threads[0]!.id;

      return undefined;
    });
  }, [studentThreads, counselorId, threadId, threads]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;
  const activeThreadWithCounselor = counselorId
    ? threads.find((t) => t.counselorId === counselorId)
    : null;

  async function handleDetachAndNewConversation() {
    if (!selectedThreadId) return;
    setDetachError("");

    try {
      await detachThread(selectedThreadId);
      setShowDetachConfirm(false);
    } catch (err) {
      setDetachError(err instanceof Error ? err.message : "Unable to detach thread.");
    }
  }

  if (isChecking) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-lg p-8">
        <LoaderAnimations />
        <GentleWaveLoader
          message={counselorId ? LOADING_MESSAGES.chat.counselorLookup : LOADING_MESSAGES.chat.identity}
          className="flex min-h-[50vh] items-center justify-center"
        />
      </main>
    );
  }

  if (showDetachConfirm && selectedThread) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-8">
        <div
          className="w-full rounded-2xl border p-6 text-center"
          style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
            Start a new conversation?
          </h2>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            This will close your existing conversation with{" "}
            <strong>{selectedThread.counselorName}</strong>.
            The counselor will see your previous messages but you will no longer
            be able to access them. A new pseudonymous label will be used.
          </p>
          {detachError ? (
            <p className="mt-3 text-sm" style={{ color: "var(--md-sys-color-error)" }}>
              {detachError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="rounded-full"
              style={{
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
              }}
              disabled={isDetaching}
              onClick={handleDetachAndNewConversation}
            >
              {isDetaching ? "Closing…" : "Close & start new"}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setShowDetachConfirm(false);
                setDetachError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (counselorId && !activeThreadWithCounselor) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg p-8">
        <div className="w-full">
          {threads.length > 0 ? (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setSelectedThreadId(threads[0]!.id)}
              >
                ← Back to conversations
              </Button>
            </div>
          ) : null}
          <AnonymousRequestForm
            counselorId={counselorId}
            onCreated={() => {
            }}
          />
        </div>
      </main>
    );
  }

  if (threads.length === 0 && !counselorId) {
    return (
      <main
        className="mx-auto h-[calc(100dvh-5rem)] w-full max-w-7xl overflow-hidden p-4 anonymous-hub-bg"
      >
        <div
          className="flex h-full items-center justify-center rounded-2xl border p-6"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-low)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            No conversations yet.{" "}
            <a
              href="/counselors"
              className="underline"
              style={{ color: "var(--md-sys-color-primary)" }}
            >
              Visit the counselor directory
            </a>{" "}
            to start one.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto h-[calc(100dvh-5rem)] w-full max-w-7xl overflow-hidden p-4 anonymous-hub-bg"
    >
      <section className="hidden h-full gap-4 md:grid md:grid-cols-[320px_1fr]">
        <aside
          className="flex h-full min-h-0 flex-col rounded-2xl border p-3"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-low)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--md-sys-color-on-surface)" }}
            >
              Conversations
            </h2>
          </div>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
          />
        </aside>

        <div
          className="min-h-0 rounded-2xl border"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-low)",
          }}
        >
          {selectedThread ? (
            <AnonymousChat
              thread={selectedThread}
              sender="student"
              onNewConversation={
                activeThreadWithCounselor
                  ? () => {
                      setSelectedThreadId(activeThreadWithCounselor.id);
                      setShowDetachConfirm(true);
                    }
                  : undefined
              }
            />
          ) : (
            <div
              className="flex min-h-[240px] items-center justify-center p-6 text-sm"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
              Select a conversation to continue.
            </div>
          )}
        </div>
      </section>

      <section className="flex h-full md:hidden">
        {selectedThread ? (
          <div className="h-full w-full min-h-0">
            <AnonymousChat
              thread={selectedThread}
              sender="student"
              onBack={() => setSelectedThreadId(undefined)}
              onNewConversation={
                activeThreadWithCounselor
                  ? () => {
                      setShowDetachConfirm(true);
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <aside
            className="flex h-full w-full min-h-0 flex-col rounded-2xl border p-3"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container-low)",
            }}
          >
            <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Conversations
            </h2>
            <ThreadList
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
            />
          </aside>
        )}
      </section>
    </main>
  );
}



