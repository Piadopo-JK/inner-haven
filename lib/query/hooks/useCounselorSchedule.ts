"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiError } from "@/lib/query/http";
import { queryKeys, scheduleQueryOptions } from "@/lib/query/queries";
import type { CounselorScheduleRuleDTO } from "@/lib/booking/contracts";

async function readScheduleMutationError(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return createApiError(response, fallbackMessage, payload);
}

export function useCounselorSchedule() {
  return useQuery({
    ...scheduleQueryOptions(),
  });
}

export function useSetScheduleCache() {
  const queryClient = useQueryClient();
  return (data: CounselorScheduleRuleDTO[]) => {
    queryClient.setQueryData(queryKeys.schedule(), data);
  };
}

export function useSaveCounselorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: CounselorScheduleRuleDTO[]) => {
      const response = await fetch("/api/counselor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });

      if (!response.ok) {
        throw await readScheduleMutationError(
          response,
          "Unable to save schedule settings.",
        );
      }

      return rules;
    },

    onSuccess: (rules) => {
      queryClient.setQueryData(queryKeys.schedule(), rules);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availabilityRoot(),
      });
    },
  });
}

export function useInvalidateSchedule() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.schedule() });
}
