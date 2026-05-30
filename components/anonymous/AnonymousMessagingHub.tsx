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
  useCreateAnonymousIdentity,
} from "@/lib/query/hooks/useAnonymousMessaging";

type HubView = "splash" | "confirming-new" | "verified";

export default function AnonymousMessagingHub({
  counselorId,
  threadId,
}: {
  counselorId?: string;
  threadId?: string;
}) {
  const [view, setView] = useState<HubView>("splash");
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [createError, setCreateError] = useState("");
  const {
    data: verified = null,
    isLoading: isCheckingIdentity,
    refetch: refetchIdentity,
  } = useAnonymousIdentity();
  const {
    mutateAsync: createAnonymousIdentity,
    isPending: creatingIdentity,
  } = useCreateAnonymousIdentity();

  useAnonymousIdentityRealtimeSync(verified?.identityId);

  useEffect(() => {
    if (isCheckingIdentity) {
      return;
    }

    setView((current) => {
      if (verified) {
        return "verified";
      }

      return current === "confirming-new" ? current : "splash";
    });
  }, [isCheckingIdentity, verified]);

  useEffect(() => {
    if (!verified) {
      setSelectedThreadId(undefined);
      return;
    }

    setSelectedThreadId((previous) => {
      if (previous && verified.threads.some((thread) => thread.id === previous)) {
        return previous;
      }

      if (threadId) {
        const threadMatch = verified.threads.find((thread) => thread.id === threadId);
        if (threadMatch) {
          return threadMatch.id;
        }
      }

      if (counselorId) {
        const counselorMatch = verified.threads.find(
          (thread) => thread.counselorId === counselorId,
        );
        if (counselorMatch) {
          return counselorMatch.id;
        }
      }

      if (verified.threads.length === 1) {
        return verified.threads[0]!.id;
      }

      return undefined;
    });
  }, [verified, counselorId, threadId]);

  async function handleCreateIdentity() {
    setCreateError("");

    try {
      await createAnonymousIdentity();
      setView("verified");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unable to create identity. Try again.");
    }
  }

  async function handleThreadCreated({ threadId }: { threadId: string }) {
    const result = await refetchIdentity();
    if (result.data) {
      setView("verified");
    }
    setSelectedThreadId(threadId);
  }

  const selectedThread = verified?.threads.find((t) => t.id === selectedThreadId) ?? null;
  const hasThreadForCounselor = counselorId
    ? (verified?.threads ?? []).some((t) => t.counselorId === counselorId)
    : false;
  const showComposer = Boolean(counselorId && !hasThreadForCounselor);

  if (isCheckingIdentity) {
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

  if (view === "splash") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
            Private Support Chat
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
            GuidanceGo uses a pseudonymous identity so counselors do not see your account details.
            Your identity is tied to your signed-in account.
          </p>
        </div>
        <div className="grid w-full gap-3">
          <Button
            className="rounded-full bg-[var(--md-sys-color-primary)] py-6 text-base font-semibold text-[var(--md-sys-color-on-primary)]"
            onClick={() => setView("confirming-new")}
          >
            Start a private conversation
          </Button>
        </div>
      </main>
    );
  }

  if (view === "confirming-new") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-8">
        <div
          className="w-full rounded-2xl border p-6 text-center"
          style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
            Before you continue
          </h2>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            A private pseudonymous identity will be created for this account.
            It is automatically managed for this signed-in session.
          </p>
          {createError ? (
            <p className="mt-3 text-sm" style={{ color: "var(--md-sys-color-error)" }}>
              {createError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="rounded-full"
              style={{
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
              }}
              disabled={creatingIdentity}
              onClick={handleCreateIdentity}
            >
              {creatingIdentity ? "Creating…" : "Create private identity"}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setView("splash")}
            >
              Cancel
            </Button>
          </div>
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
            <button
              type="button"
              className="text-xs underline"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
              onClick={() => {
                setSelectedThreadId(undefined);
                setCreateError("");
                setView("splash");
              }}
            >
              Switch identity
            </button>
          </div>
          <ThreadList
            threads={verified?.threads ?? []}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
          />
          {(verified?.threads ?? []).length === 0 && !counselorId ? (
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
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
          ) : null}
        </aside>

        <div
          className="min-h-0 rounded-2xl border"
          style={{
            borderColor: "var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container-low)",
          }}
        >
          {selectedThread ? (
            <AnonymousChat thread={selectedThread} sender="student" />
          ) : counselorId && !hasThreadForCounselor ? (
            <div className="h-full overflow-y-auto p-4">
              <AnonymousRequestForm
                counselorId={counselorId}
                onCreated={handleThreadCreated}
              />
            </div>
          ) : (
            <div
              className="flex min-h-[240px] items-center justify-center p-6 text-sm"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
              {(verified?.threads ?? []).length > 0
                ? "Select a conversation to continue."
                : "No conversations yet. Visit the counselor directory to start one."}
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
            />
          </div>
        ) : showComposer ? (
          <div
            className="flex h-full w-full min-h-0 flex-col rounded-2xl border p-4"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container-low)",
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  New conversation
                </h2>
                <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Your first message starts the anonymous thread.
                </p>
              </div>
              <button
                type="button"
                className="text-xs underline"
                style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                onClick={() => {
                  setSelectedThreadId(undefined);
                  setCreateError("");
                  setView("splash");
                }}
              >
                Switch identity
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <AnonymousRequestForm
                counselorId={counselorId!}
                onCreated={handleThreadCreated}
              />
            </div>
          </div>
        ) : (
          <aside
            className="flex h-full w-full min-h-0 flex-col rounded-2xl border p-3"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container-low)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                Conversations
              </h2>
              <button
                type="button"
                className="text-xs underline"
                style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                onClick={() => {
                  setSelectedThreadId(undefined);
                  setCreateError("");
                  setView("splash");
                }}
              >
                Switch identity
              </button>
            </div>
            <ThreadList
              threads={verified?.threads ?? []}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
            />
            {(verified?.threads ?? []).length === 0 && !counselorId ? (
              <p
                className="mt-3 text-xs leading-relaxed"
                style={{ color: "var(--md-sys-color-on-surface-variant)" }}
              >
                No conversations yet. <a href="/counselors" className="underline" style={{ color: "var(--md-sys-color-primary)" }}>Visit the counselor directory</a> to start one.
              </p>
            ) : null}
          </aside>
        )}
      </section>
    </main>
  );
}

