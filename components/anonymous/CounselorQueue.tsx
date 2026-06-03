"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Trash2, Info } from "lucide-react";

import AnonymousChat from "@/components/anonymous/AnonymousChat";
import ThreadList from "@/components/anonymous/ThreadList";
import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { LOADING_MESSAGES } from "@/lib/loading/states";
import { Button } from "@/components/ui/button";
import {
  useAnonymousCounselorThreads,
  useCounselorAnonymousThreadsRealtimeSync,
  useDetachThreadByCounselor,
} from "@/lib/query/hooks/useAnonymousMessaging";

export default function CounselorQueue({ initialThreadId }: { initialThreadId?: string }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string>();
  const [showDetachConfirm, setShowDetachConfirm] = useState(false);
  const [detachError, setDetachError] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [shaking, setShaking] = useState(false);
  const { data: threads = [], isLoading: isLoadingQueue } = useAnonymousCounselorThreads();
  const { mutateAsync: detachThread, isPending: isDetaching } = useDetachThreadByCounselor();

  useCounselorAnonymousThreadsRealtimeSync();

  const activeThreads = useMemo(() => threads.filter((t) => t.status !== "detached"), [threads]);
  const detachedThreads = useMemo(() => threads.filter((t) => t.status === "detached"), [threads]);
  const displayThreads = showTrash ? detachedThreads : activeThreads;

  useEffect(() => {
    setSelectedThreadId((previous) => {
      if (previous && displayThreads.some((thread) => thread.id === previous)) {
        return previous;
      }

      if (initialThreadId && displayThreads.some((thread) => thread.id === initialThreadId)) {
        return initialThreadId;
      }

      return displayThreads[0]?.id;
    });
  }, [initialThreadId, displayThreads]);

  const selectedThread = useMemo(
    () => displayThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, displayThreads],
  );

  async function handleDetachAndRemove() {
    if (!selectedThreadId) return;
    setDetachError("");

    try {
      await detachThread(selectedThreadId);
      setShowDetachConfirm(false);
    } catch (err) {
      setDetachError(err instanceof Error ? err.message : "Unable to remove thread.");
    }
  }

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

  if (showDetachConfirm && selectedThread) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-6 text-center shadow-xl"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container-high)",
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Remove this thread?
            </h2>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
              The conversation with <strong>{selectedThread.anonymousLabel}</strong> will be
              closed. The student will no longer be able to send messages in this thread,
              but you will still be able to view the history.
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
                onClick={handleDetachAndRemove}
              >
                {isDetaching ? "Removing…" : "Remove thread"}
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
        </div>
      </>
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
            background: "var(--msg-sidebar-bg)",
            boxShadow: "var(--md-sys-elevation-level2)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--msg-label-color)" }}>
                {showTrash ? "Trash" : "Chat"}
              </h1>
              <span className="relative group">
                <Info className="h-3.5 w-3.5 cursor-help" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
                <span className="pointer-events-none absolute left-0 top-full mt-1.5 w-48 rounded-lg border px-2.5 py-1.5 text-[11px] leading-relaxed opacity-0 transition-opacity group-hover:opacity-100 z-50"
                  style={{
                    borderColor: "var(--md-sys-color-outline-variant)",
                    background: "var(--md-sys-color-surface-container-high)",
                    color: "var(--md-sys-color-on-surface-variant)",
                    boxShadow: "var(--md-sys-elevation-level2)",
                  }}
                >
                  Conversations are pseudonymous and automatically expire after 7 days of inactivity.
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (shaking) return;
                setShaking(true);
                setShowTrash((p) => !p);
                setSelectedThreadId(undefined);
                setTimeout(() => setShaking(false), 420);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_10%,transparent)]"
              style={{ color: showTrash ? "var(--md-sys-color-error)" : "var(--md-sys-color-on-surface-variant)" }}
              aria-label={showTrash ? "Back to queue" : "Trash"}
            >
              <span className={shaking ? "theme-btn-vibrating" : ""} style={{ display: "flex" }}>
                {showTrash ? <Mail className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
              </span>
            </button>
          </div>
          <ThreadList
            threads={displayThreads.map((t) => ({
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
              onRemove={() => setShowDetachConfirm(true)}
            />
          ) : (
            <section
              className="flex h-full items-center justify-center rounded-2xl border p-6"
              style={{
                borderColor: "var(--md-sys-color-outline-variant)",
                background: "var(--msg-chat-bg)",
                boxShadow: "var(--md-sys-elevation-level1)",
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
              onRemove={() => setShowDetachConfirm(true)}
            />
          </div>
        ) : (
          <aside
            className="flex h-full w-full min-h-0 flex-col rounded-2xl border p-3"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--msg-sidebar-bg)",
              boxShadow: "var(--md-sys-elevation-level2)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--msg-label-color)" }}>
                {showTrash ? "Trash" : "Chat"}
              </h1>
              <button
                type="button"
                onClick={() => { setShowTrash((p) => !p); setSelectedThreadId(undefined); }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_10%,transparent)]"
                style={{ color: showTrash ? "var(--md-sys-color-error)" : "var(--md-sys-color-on-surface-variant)" }}
                aria-label={showTrash ? "Back to queue" : "Trash"}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
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
