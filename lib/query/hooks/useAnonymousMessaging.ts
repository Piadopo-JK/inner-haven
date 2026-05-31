"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { readJsonResponse } from "@/lib/query/http";
import type {
  AnonymousSender,
  AnonymousThreadMessage,
  AnonymousThreadSummary,
  StudentAnonymousThreads,
  CounselorAnonymousThreadSummary,
} from "@/lib/anonymous/types";
import {
  anonymousCounselorThreadsQueryOptions,
  anonymousIdentityQueryOptions,
  anonymousThreadMessagesQueryOptions,
  queryKeys,
} from "@/lib/query/queries";

type CreateAnonymousThreadInput = {
  counselorId: string;
  message: string;
};

type CreateAnonymousThreadResponse = {
  threadId: string;
};

type SendAnonymousMessageInput = {
  message: string;
  sender: AnonymousSender;
};

async function parseMutationPayload<T>(
  response: Response,
  fallbackMessage: string,
) {
  return readJsonResponse<T>(response, fallbackMessage);
}

function sortThreadsByRecent(threads: AnonymousThreadSummary[]) {
  return [...threads].sort((left, right) =>
    (right.lastMessageAt ?? right.updatedAt).localeCompare(
      left.lastMessageAt ?? left.updatedAt,
    ),
  );
}

function patchThreadPreview(
  threads: AnonymousThreadSummary[],
  threadId: string,
  message: string,
  createdAt: string,
) {
  return sortThreadsByRecent(
    threads.map((thread) =>
      thread.id === threadId
        ? {
            ...thread,
            lastMessagePreview: message.slice(0, 80),
            lastMessageAt: createdAt,
            updatedAt: createdAt,
          }
        : thread,
    ),
  );
}

export function useAnonymousIdentity() {
  return useQuery({
    ...anonymousIdentityQueryOptions(),
    retry: false,
  });
}

export function useAnonymousIdentityRealtimeSync() {
  const queryClient = useQueryClient();
  const { data } = useAnonymousIdentity();

  useEffect(() => {
    if (!data?.threads?.length) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel("anonymous-student-threads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anonymous_threads",
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.anonymousIdentity(),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [data, queryClient]);
}

export function useCreateAnonymousThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ counselorId, message }: CreateAnonymousThreadInput) => {
      const response = await fetch("/api/anonymous-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counselorId, message }),
      });

      return parseMutationPayload<CreateAnonymousThreadResponse>(
        response,
        "Unable to create anonymous thread.",
      );
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.anonymousIdentity(),
      });
    },
  });
}

export function useDetachThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await fetch(`/api/anonymous-threads/${threadId}/detach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      return parseMutationPayload<{ ok: true }>(
        response,
        "Unable to detach thread.",
      );
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.anonymousIdentity(),
      });
    },
  });
}

export function useAnonymousCounselorThreads() {
  return useQuery({
    ...anonymousCounselorThreadsQueryOptions(),
  });
}

export function useCounselorAnonymousThreadsRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("anonymous-counselor-threads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anonymous_threads",
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.anonymousCounselorThreads(),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useAnonymousThreadMessages(threadId: string) {
  return useQuery({
    ...anonymousThreadMessagesQueryOptions(threadId),
  });
}

export function useAnonymousThreadRealtimeSync(
  threadId: string,
  viewer: AnonymousSender,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`anonymous-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anonymous_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.anonymousThreadMessages(threadId),
          });

          void queryClient.invalidateQueries({
            queryKey:
              viewer === "student"
                ? queryKeys.anonymousIdentity()
                : queryKeys.anonymousCounselorThreads(),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, threadId, viewer]);
}

export function useSendAnonymousMessage(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message, sender }: SendAnonymousMessageInput) => {
      const response = await fetch(`/api/anonymous-threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          sender,
          message,
        }),
      });

      return parseMutationPayload<{ ok: true }>(
        response,
        "Unable to send anonymous message.",
      );
    },

    onMutate: async ({ message, sender }) => {
      const trimmedMessage = message.trim();
      const createdAt = new Date().toISOString();
      const optimisticMessage: AnonymousThreadMessage = {
        id: `temp-${createdAt}`,
        threadId,
        sender,
        body: trimmedMessage,
        createdAt,
      };

      await queryClient.cancelQueries({
        queryKey: queryKeys.anonymousThreadMessages(threadId),
      });

      const previousMessages = queryClient.getQueryData<AnonymousThreadMessage[]>(
        queryKeys.anonymousThreadMessages(threadId),
      );
      const previousIdentity = queryClient.getQueryData<
        StudentAnonymousThreads | null
      >(queryKeys.anonymousIdentity());
      const previousCounselorThreads = queryClient.getQueryData<
        CounselorAnonymousThreadSummary[]
      >(queryKeys.anonymousCounselorThreads());

      queryClient.setQueryData<AnonymousThreadMessage[]>(
        queryKeys.anonymousThreadMessages(threadId),
        (current) => [...(current ?? []), optimisticMessage],
      );

      if (sender === "student") {
        queryClient.setQueryData<StudentAnonymousThreads | null>(
          queryKeys.anonymousIdentity(),
          (current) =>
            current
              ? {
                  ...current,
                  threads: patchThreadPreview(
                    current.threads,
                    threadId,
                    trimmedMessage,
                    createdAt,
                  ),
                }
              : current,
        );
      } else {
        queryClient.setQueryData<CounselorAnonymousThreadSummary[] | undefined>(
          queryKeys.anonymousCounselorThreads(),
          (current) =>
            current
              ? patchThreadPreview(
                  current as unknown as AnonymousThreadSummary[],
                  threadId,
                  trimmedMessage,
                  createdAt,
                ) as unknown as CounselorAnonymousThreadSummary[]
              : current,
        );
      }

      return {
        previousMessages,
        previousIdentity,
        previousCounselorThreads,
      };
    },

    onError: (_error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.anonymousThreadMessages(threadId),
          context.previousMessages,
        );
      }

      if (variables.sender === "student") {
        queryClient.setQueryData(
          queryKeys.anonymousIdentity(),
          context?.previousIdentity,
        );
      } else if (context?.previousCounselorThreads) {
        queryClient.setQueryData(
          queryKeys.anonymousCounselorThreads(),
          context.previousCounselorThreads,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.anonymousThreadMessages(threadId),
      });

      void queryClient.invalidateQueries({
        queryKey:
          variables.sender === "student"
            ? queryKeys.anonymousIdentity()
            : queryKeys.anonymousCounselorThreads(),
      });
    },
  });
}