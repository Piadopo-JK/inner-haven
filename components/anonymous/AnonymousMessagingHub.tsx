"use client";

import { Plus, Search, X, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import AnonymousChat from "@/components/anonymous/AnonymousChat";
import AnonymousRequestForm from "@/components/anonymous/AnonymousRequestForm";
import ThreadList from "@/components/anonymous/ThreadList";
import { AnonymousCounselor } from "@/components/anonymous/types";
import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { Button } from "@/components/ui/button";
import { LOADING_MESSAGES } from "@/lib/loading/states";
import { fetchJson } from "@/lib/query/http";
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
  const [sidebarView, setSidebarView] = useState<"threads" | "pick-counselor" | "new-thread">("threads");
  const [newThreadCounselorId, setNewThreadCounselorId] = useState<string | null>(null);
  const [counselorSearch, setCounselorSearch] = useState("");
  const { data: studentThreads, isLoading: isChecking } = useAnonymousIdentity();
  const { mutateAsync: detachThread, isPending: isDetaching } = useDetachThread();

  const { data: counselors = [], isLoading: isLoadingCounselors } = useQuery({
    queryKey: ["anonymous", "counselors"],
    queryFn: () =>
      fetchJson<{ counselors: AnonymousCounselor[] }>("/api/anonymous/counselors").then(
        (p) => p.counselors,
      ),
    staleTime: 5 * 60_000,
  });

  const filteredCounselors = useMemo(() => {
    const q = counselorSearch.trim().toLowerCase();
    if (!q) return counselors;
    return counselors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.specialization ?? "").toLowerCase().includes(q),
    );
  }, [counselors, counselorSearch]);

  useAnonymousIdentityRealtimeSync(studentThreads?.ownerAuthUserId);

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

      if (threads.length > 0 && !previous) return threads[0]!.id;

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
        className="mx-auto h-[calc(100dvh-5rem)] w-full max-w-7xl overflow-hidden p-4"
      >
        <div
          className="flex h-full items-center justify-center rounded-2xl border p-6"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--msg-chat-bg)",
            boxShadow: "var(--md-sys-elevation-level1)",
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
      className="mx-auto h-[calc(100dvh-5rem)] w-full max-w-7xl overflow-hidden p-4"
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
          {sidebarView === "pick-counselor" ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarView("threads");
                    setCounselorSearch("");
                  }}
                  className="rounded-full p-1"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                  aria-label="Back to conversations"
                >
                  <X className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-semibold" style={{ color: "var(--msg-label-color)" }}>
                  New conversation
                </h2>
              </div>

              <label
                className="mb-2 flex shrink-0 items-center gap-2 rounded-full border px-3 py-2"
                style={{
                  borderColor: "var(--md-sys-color-outline-variant)",
                  background: "var(--md-sys-color-surface-container-low)",
                  color: "var(--md-sys-color-on-surface-variant)",
                }}
              >
                <Search className="h-4 w-4 shrink-0" />
                <input
                  value={counselorSearch}
                  onChange={(e) => setCounselorSearch(e.target.value)}
                  placeholder="Search counselors"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>

              <div className="min-h-0 overflow-y-auto">
                {isLoadingCounselors ? (
                  <GentleWaveLoader
                    message="Loading counselors…"
                    className="flex min-h-[120px] items-center justify-center"
                  />
                ) : filteredCounselors.length === 0 ? (
                  <p className="px-1 py-4 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    No counselors found.
                  </p>
                ) : (
                  filteredCounselors.map((c) => {
                    const existingThread = threads.find((t) => t.counselorId === c.counselorId);

                    return (
                    <button
                      key={c.counselorId}
                      type="button"
                      onClick={() => {
                        if (existingThread) {
                          setSelectedThreadId(existingThread.id);
                          setSidebarView("threads");
                          setShowDetachConfirm(true);
                        } else {
                          setNewThreadCounselorId(c.counselorId);
                          setSidebarView("new-thread");
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_8%,transparent)]"
                    >
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                          style={{
                            background: "var(--md-sys-color-secondary-container)",
                            color: "var(--md-sys-color-on-secondary-container)",
                          }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
                          {c.name}
                        </p>
                        {existingThread ? (
                          <p className="truncate text-xs" style={{ color: "var(--md-sys-color-primary)" }}>
                            Active conversation — tap to start new
                          </p>
                        ) : c.specialization ? (
                          <p className="truncate text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                            {c.specialization}
                          </p>
                        ) : null}
                      </div>
                    </button>
                    );
                  })
                )}
              </div>
            </>
          ) : sidebarView === "new-thread" && newThreadCounselorId ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarView("pick-counselor");
                    setNewThreadCounselorId(null);
                  }}
                  className="rounded-full p-1"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                  aria-label="Back to counselor list"
                >
                  <X className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-semibold" style={{ color: "var(--msg-label-color)" }}>
                  New message
                </h2>
              </div>
              <AnonymousRequestForm
                counselorId={newThreadCounselorId}
                onCreated={() => {
                  setSidebarView("threads");
                  setNewThreadCounselorId(null);
                }}
              />
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--msg-label-color)" }}>
                    Messaging
                  </h2>
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
                  onClick={() => setSidebarView("pick-counselor")}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_10%,transparent)]"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                  aria-label="New conversation"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ThreadList
                threads={threads}
                selectedThreadId={selectedThreadId}
                onSelect={setSelectedThreadId}
                onNewConversation={() => setShowDetachConfirm(true)}
                onRemove={() => setShowDetachConfirm(true)}
              />
            </>
          )}
        </aside>

        <div className="min-h-0">
          {selectedThread ? (
            <AnonymousChat
              thread={selectedThread}
              sender="student"
              onNewConversation={() => setShowDetachConfirm(true)}
              onRemove={() => setShowDetachConfirm(true)}
            />
          ) : (
            <div
              className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border p-6 text-sm"
              style={{
                borderColor: "var(--md-sys-color-outline-variant)",
                background: "var(--msg-chat-bg)",
                boxShadow: "var(--md-sys-elevation-level1)",
                color: "var(--md-sys-color-on-surface-variant)",
              }}
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
              onNewConversation={() => setShowDetachConfirm(true)}
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
              <div className="flex items-center gap-1.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--msg-label-color)" }}>
                  Messaging
                </h2>
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
              <a
                href="/counselors"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_10%,transparent)]"
                style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                aria-label="New conversation"
              >
                <Plus className="h-5 w-5" />
              </a>
            </div>
            <ThreadList
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
              onNewConversation={() => setShowDetachConfirm(true)}
              onRemove={() => setShowDetachConfirm(true)}
            />
          </aside>
        )}
      </section>

      {showDetachConfirm && selectedThread ? (
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
          </div>
        </>
      ) : null}
    </main>
  );
}
