"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Md3Message } from "@/components/ui/md3-message";
import { SessionNoteDTO } from "@/lib/booking/contracts";
import {
  useSaveSessionNotes,
  useSessionNotes,
} from "@/lib/query/hooks/useSessionNotes";

const sectionStyle = {
  borderColor: "var(--md-sys-color-outline-variant)",
  lineHeight: 1.6,
} as const;

const sectionHeadingStyle = {
  color: "var(--md-sys-color-on-surface)",
} as const;

const bodyTextStyle = {
  color: "var(--md-sys-color-on-surface-variant)",
} as const;

const textareaStyle = {
  borderColor: "var(--md-sys-color-outline)",
  background: "var(--md-sys-color-surface)",
  color: "var(--md-sys-color-on-surface)",
} as const;

function splitRecommendations(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SessionNotesEditor({
  appointmentId,
  role,
  initialNote,
}: {
  appointmentId: string;
  role: "student" | "counselor";
  initialNote: SessionNoteDTO | null;
}) {
  const { data: note = initialNote } = useSessionNotes(appointmentId, initialNote);
  const { mutateAsync: saveSessionNotes, isPending: isSaving } = useSaveSessionNotes(appointmentId);
  const [noteContent, setNoteContent] = useState(initialNote?.note_content ?? "");
  const [recommendationsText, setRecommendationsText] = useState(
    (initialNote?.recommendations ?? []).join("\n"),
  );
  const [followUp, setFollowUp] = useState(initialNote?.follow_up ?? "");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const hasExistingNote = useMemo(() => {
    return Boolean(note);
  }, [note]);

  useEffect(() => {
    setNoteContent(note?.note_content ?? "");
    setRecommendationsText((note?.recommendations ?? []).join("\n"));
    setFollowUp(note?.follow_up ?? "");
  }, [note]);

  async function handleSave() {
    setError("");
    setMessage("");

    try {
      await saveSessionNotes({
        noteContent,
        recommendations: splitRecommendations(recommendationsText),
        followUp,
      });
      setMessage(hasExistingNote ? "Session notes updated." : "Session notes created and shared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save session notes right now.");
    }
  }

  if (role !== "counselor") {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border bg-[var(--md-sys-color-surface-container-low)] p-5" style={sectionStyle}>
          <h3 className="mb-2 text-sm font-semibold" style={sectionHeadingStyle}>Session Notes</h3>
          <p className="text-sm" style={bodyTextStyle}>
            {note?.note_content || "No session note has been shared yet."}
          </p>
        </section>

        <section className="rounded-2xl border bg-[var(--md-sys-color-surface-container-low)] p-5" style={sectionStyle}>
          <h3 className="mb-2 text-sm font-semibold" style={sectionHeadingStyle}>Recommendations</h3>
          {(note?.recommendations?.length ?? 0) > 0 ? (
            <ol className="list-decimal pl-5 text-sm" style={bodyTextStyle}>
              {note?.recommendations.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ol>
          ) : (
            <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              No recommendations added yet.
            </p>
          )}
        </section>

        <section className="rounded-2xl border bg-[var(--md-sys-color-surface-container-low)] p-5" style={sectionStyle}>
          <h3 className="mb-2 text-sm font-semibold" style={sectionHeadingStyle}>Follow-up</h3>
          <p className="text-sm" style={bodyTextStyle}>
            {note?.follow_up || "No follow-up plan added yet."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-[var(--md-sys-color-surface-container-low)] p-5" style={sectionStyle}>
        <h3 className="mb-2 text-sm font-semibold" style={sectionHeadingStyle}>Session Notes</h3>
        <textarea
          value={noteContent}
          onChange={(event) => setNoteContent(event.target.value)}
          placeholder="Write session notes"
          className="min-h-[180px] w-full rounded-xl border px-3 py-2 text-sm"
          style={textareaStyle}
        />
      </section>

      <section className="rounded-2xl border bg-[var(--md-sys-color-surface-container-low)] p-5" style={sectionStyle}>
        <h3 className="mb-2 text-sm font-semibold" style={sectionHeadingStyle}>Recommendations</h3>
        <textarea
          value={recommendationsText}
          onChange={(event) => setRecommendationsText(event.target.value)}
          placeholder="One recommendation per line"
          className="min-h-[140px] w-full rounded-xl border px-3 py-2 text-sm"
          style={textareaStyle}
        />
      </section>

      <section className="rounded-2xl border bg-[var(--md-sys-color-surface-container-low)] p-5" style={sectionStyle}>
        <h3 className="mb-2 text-sm font-semibold" style={sectionHeadingStyle}>Follow-up</h3>
        <textarea
          value={followUp}
          onChange={(event) => setFollowUp(event.target.value)}
          placeholder="Follow-up plan"
          className="min-h-[120px] w-full rounded-xl border px-3 py-2 text-sm"
          style={textareaStyle}
        />
      </section>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full px-5"
        >
          {isSaving ? "Saving..." : "Save Session Notes"}
        </Button>
        {message ? <Md3Message tone="success">{message}</Md3Message> : null}
        {error ? <Md3Message tone="error">{error}</Md3Message> : null}
      </div>
    </div>
  );
}
