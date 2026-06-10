"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createApiError } from "@/lib/query/http";
import {
  googleIntegrationQueryOptions,
  queryKeys,
  type GoogleIntegrationStatusPayload,
} from "@/lib/query/queries";

function readGoogleTokenMutationError(response: Response, fallbackMessage: string) {
  return response.json().catch(() => null).then((payload) =>
    createApiError(
      response,
      fallbackMessage,
      payload as { error?: string } | null,
    ),
  );
}

export function useGoogleIntegrationStatus() {
  return useQuery({
    ...googleIntegrationQueryOptions(),
  });
}

export function useRevokeGoogleAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/google/disconnect", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw await readGoogleTokenMutationError(
          response,
          "Unable to revoke Google access right now.",
        );
      }
    },

    onSuccess: () => {
      queryClient.setQueryData<GoogleIntegrationStatusPayload>(
        queryKeys.googleIntegration(),
        { isConnected: false },
      );
    },
  });
}