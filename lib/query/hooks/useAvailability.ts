"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  availabilityForMonthQueryOptions,
  availabilityQueryOptions,
  queryKeys,
  chunkAlignedRange,
} from "@/lib/query/queries";
import type { AvailabilityWindowResponseDTO } from "@/lib/booking/contracts";

export function useAvailability(
  counselorId: string,
  from: string,
  to: string,
) {
  return useQuery({
    ...availabilityQueryOptions(counselorId, from, to),
  });
}

export function useAvailabilityForMonth(
  counselorId: string,
  referenceDate: Date | undefined,
) {
  return useQuery({
    ...availabilityForMonthQueryOptions(counselorId, referenceDate),
  });
}

export function useInvalidateCounselorAvailability() {
  const queryClient = useQueryClient();
  return (counselorId: string) =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.availabilityByCounselor(counselorId),
    });
}

export type AvailabilityResponse = AvailabilityWindowResponseDTO;
