"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { createApiError, readResponsePayload } from "@/lib/query/http";
import { queryKeys, sessionNotesQueryOptions } from "@/lib/query/queries";
import type { SessionNoteDTO } from "@/lib/booking/contracts";

type SaveSessionNotesInput = {
  noteContent: string;
  recommendations: string[];
  followUp: string;
};

async function readSessionNotesMutationError(
  response: Response,
  fallbackMessage: string,
) {
  const payload = await readResponsePayload<{
    error?: string;
    note?: SessionNoteDTO;
  }>(response);

  if (!response.ok || !payload?.note) {
    throw createApiError(response, fallbackMessage, payload);
  }

  return payload.note;
}

export function useSessionNotes(
  appointmentId: string,
  initialData?: SessionNoteDTO | null,
) {
  return useQuery({
    ...sessionNotesQueryOptions(appointmentId),
    initialData:
      initialData !== undefined ? { note: initialData } : undefined,
    select: (data) => data.note ?? null,
    enabled: Boolean(appointmentId),
  });
}

export function useSetSessionNotesCache() {
  const queryClient = useQueryClient();
  return (appointmentId: string, note: SessionNoteDTO | null) => {
    queryClient.setQueryData(queryKeys.sessionNotes(appointmentId), {
      note,
    });
  };
}

export function useSaveSessionNotes(appointmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveSessionNotesInput) => {
      const response = await fetch(`/api/appointments/${appointmentId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note_content: input.noteContent,
          recommendations: input.recommendations,
          follow_up: input.followUp,
        }),
      });

      return readSessionNotesMutationError(
        response,
        "Unable to save session notes right now.",
      );
    },

    onSuccess: (note) => {
      queryClient.setQueryData(queryKeys.sessionNotes(appointmentId), { note });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appointmentDetails(appointmentId),
      });
    },
  });
}

export function useSessionNotesRealtimeSync(appointmentId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!appointmentId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`session-notes-rt-${appointmentId}-${crypto.randomUUID().slice(0, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_notes",
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const rowId = ((payload.new ?? payload.old) as Record<string, unknown>).appointment_id as string | undefined;
          if (rowId !== appointmentId) return;

          void queryClient.invalidateQueries({
            queryKey: queryKeys.sessionNotes(appointmentId),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const rowId = ((payload.new ?? payload.old) as Record<string, unknown>).appointment_id as string | undefined;
          if (rowId !== appointmentId) return;

          void queryClient.invalidateQueries({
            queryKey: queryKeys.appointmentDetails(appointmentId),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appointmentId, queryClient]);
}
