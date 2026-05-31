"use client";

import { Search, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { AnonymousThreadSummary } from "@/components/anonymous/types";

type Props = {
  threads: AnonymousThreadSummary[];
  selectedThreadId?: string;
  onSelect: (threadId: string) => void;
  anonymousView?: boolean;
};

export default function ThreadList({ threads, selectedThreadId, onSelect, anonymousView = false }: Props) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const title = anonymousView ? thread.anonymousLabel : thread.counselorName;
      return title.toLowerCase().includes(q) || (thread.lastMessagePreview ?? "").toLowerCase().includes(q);
    });
  }, [anonymousView, query, threads]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const formatRelative = (value?: string) => {
    if (!value) return "";
    const deltaMs = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(deltaMs / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return new Date(value).toLocaleDateString();
  };

  if (threads.length === 0) {
    return (
      <div className="px-1 py-2 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        No threads yet.
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-2">
      <label
        className="flex shrink-0 items-center gap-2 rounded-full border px-3 py-2"
        style={{
          borderColor: "var(--md-sys-color-outline-variant)",
          background: "var(--md-sys-color-surface-container-low)",
          color: "var(--md-sys-color-on-surface-variant)",
        }}
      >
        <Search className="h-4 w-4 shrink-0" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div ref={listRef} className="min-h-0 overflow-y-auto">
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const thread = filtered[virtualItem.index]!;
            const active = selectedThreadId === thread.id;

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelect(thread.id)}
                className="absolute left-0 top-0 w-full rounded-r-xl px-3 py-3 text-left transition-colors border-l-[3px]"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  borderLeftColor: active
                    ? "var(--md-sys-color-primary)"
                    : "transparent",
                  background: active
                    ? "color-mix(in srgb, var(--md-sys-color-primary) 12%, var(--md-sys-color-surface-container-high))"
                    : "transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  {!anonymousView && thread.counselorAvatarUrl ? (
                    <img
                      src={thread.counselorAvatarUrl}
                      alt={thread.counselorName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: anonymousView
                          ? "var(--md-sys-color-surface-container-high)"
                          : active
                            ? "var(--md-sys-color-primary-container)"
                            : "var(--md-sys-color-secondary-container)",
                        color: anonymousView
                          ? "var(--md-sys-color-on-surface-variant)"
                          : active
                            ? "var(--md-sys-color-on-primary-container)"
                            : "var(--md-sys-color-on-secondary-container)",
                      }}
                    >
                    {anonymousView ? (
                      <UserRound className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {thread.counselorName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                        {anonymousView ? thread.anonymousLabel : thread.counselorName}
                      </p>
                      <span className="shrink-0 text-[11px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                        {formatRelative(thread.lastMessageAt ?? thread.updatedAt)}
                      </span>
                    </div>
                    {thread.lastMessagePreview ? (
                      <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                        {thread.lastMessagePreview}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 ? (
            <div className="rounded-2xl px-3 py-4 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              No conversations match your search.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
