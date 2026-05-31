"use client";

import { useEffect, useMemo, useState } from "react";

import AnonymousChat from "@/components/anonymous/AnonymousChat";
import ThreadList from "@/components/anonymous/ThreadList";
import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { LOADING_MESSAGES } from "@/lib/loading/states";
import {
  useAnonymousCounselorThreads,
  useCounselorAnonymousThreadsRealtimeSync,
} from "@/lib/query/hooks/useAnonymousMessaging";

export default function CounselorQueue({ initialThreadId }: { initialThreadId?: string }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string>();
  const { data: threads = [], isLoading: isLoadingQueue } = useAnonymousCounselorThreads();

  useCounselorAnonymousThreadsRealtimeSync();

  useEffect(() => {
    setSelectedThreadId((previous) => {
      if (previous && threads.some((thread) => thread.id === previous)) {
        return previous;
      }

      if (initialThreadId && threads.some((thread) => thread.id === initialThreadId)) {
        return initialThreadId;
      }

      return threads[0]?.id;
    });
  }, [initialThreadId, threads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );

  if (isLoadingQueue) {
    return (
      <main className="mx-auto h-[calc(100dvh-5rem)] w-full max-w-7xl p-4">
        <LoaderAnimations />
        <GentleWaveLoader
          message={LOADING_MESSAGES.chat.conversation}
          className="flex h-full items-center justify-center"
        />
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
          <h1 className="mb-3 text-base font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
            Anonymous Queue
          </h1>
          <ThreadList
            threads={threads.map((t) => ({
              id: t.id,
              counselorId: "",
              counselorName: t.anonymousLabel,
              anonymousLabel: t.anonymousLabel,
              status: t.status,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              lastMessagePreview: t.lastMessagePreview,
              lastMessageAt: t.lastMessageAt,
            }))}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
            anonymousView
          />
        </aside>

        <div className="min-h-0">
          {selectedThread ? (
            <AnonymousChat
              thread={{
                id: selectedThread.id,
                counselorId: "",
                counselorName: selectedThread.anonymousLabel,
                anonymousLabel: selectedThread.anonymousLabel,
                status: selectedThread.status,
                createdAt: selectedThread.createdAt,
                updatedAt: selectedThread.updatedAt,
                lastMessagePreview: selectedThread.lastMessagePreview,
                lastMessageAt: selectedThread.lastMessageAt,
              }}
              sender="counselor"
            />
          ) : (
            <section
              className="flex h-full items-center justify-center rounded-2xl border p-6"
              style={{
                borderColor: "var(--md-sys-color-outline-variant)",
                background: "var(--md-sys-color-surface-container-low)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                Select a thread to respond.
              </p>
            </section>
          )}
        </div>
      </section>

      <section className="flex h-full md:hidden">
        {selectedThread ? (
          <div className="h-full w-full min-h-0">
            <AnonymousChat
              thread={{
                id: selectedThread.id,
                counselorId: "",
                counselorName: selectedThread.anonymousLabel,
                anonymousLabel: selectedThread.anonymousLabel,
                status: selectedThread.status,
                createdAt: selectedThread.createdAt,
                updatedAt: selectedThread.updatedAt,
                lastMessagePreview: selectedThread.lastMessagePreview,
                lastMessageAt: selectedThread.lastMessageAt,
              }}
              sender="counselor"
              onBack={() => setSelectedThreadId(undefined)}
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
            <h1 className="mb-3 text-base font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Anonymous Queue
            </h1>
            <ThreadList
              threads={threads.map((t) => ({
                id: t.id,
                counselorId: "",
                counselorName: t.anonymousLabel,
                anonymousLabel: t.anonymousLabel,
                status: t.status,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
                lastMessagePreview: t.lastMessagePreview,
                lastMessageAt: t.lastMessageAt,
              }))}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
              anonymousView
            />
          </aside>
        )}
      </section>
    </main>
  );
}
