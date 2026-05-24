"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AnonymousThreadSummary } from "@/components/anonymous/types";

type Props = {
  threads: AnonymousThreadSummary[];
  selectedThreadId?: string;
  onSelect: (threadId: string) => void;
  anonymousView?: boolean;
};

export default function ThreadList({ threads, selectedThreadId, onSelect, anonymousView = false }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const title = anonymousView ? thread.anonymousLabel : thread.counselorName;
      return title.toLowerCase().includes(q) || (thread.lastMessagePreview ?? "").toLowerCase().includes(q);
    });
  }, [anonymousView, query, threads]);

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
        className="flex items-center gap-2 rounded-full border px-3 py-2"
        style={{
          borderColor: "var(--md-sys-color-outline-variant)",
          background: "var(--md-sys-color-surface-container-high)",
          color: "var(--md-sys-color-on-surface-variant)",
        }}
      >
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div className="min-h-0 overflow-y-auto">
        <div className="grid gap-1.5 pr-1">
          {filtered.map((thread) => {
            const active = selectedThreadId === thread.id;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelect(thread.id)}
                className="w-full rounded-xl px-3 py-3 text-left transition-colors"
                style={{
                  borderColor: "transparent",
                  background: active
                    ? "color-mix(in srgb, var(--md-sys-color-primary) 18%, var(--md-sys-color-surface-container-high))"
                    : "var(--md-sys-color-surface-container-low)",
                  boxShadow: active
                    ? "inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent)"
                    : "none",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                    {anonymousView ? thread.anonymousLabel : thread.counselorName}
                  </p>
                  <span className="text-[11px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {formatRelative(thread.lastMessageAt ?? thread.updatedAt)}
                  </span>
                </div>
                {thread.lastMessagePreview ? (
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {thread.lastMessagePreview}
                  </p>
                ) : null}
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
