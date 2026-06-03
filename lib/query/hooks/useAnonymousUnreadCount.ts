"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionRole } from "@/lib/booking/contracts";
import { anonymousUnreadCountQueryOptions } from "@/lib/query/queries";

export function useAnonymousUnreadCount(role: SessionRole) {
  const options = anonymousUnreadCountQueryOptions(role);

  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: options.staleTime,
    placeholderData: (previousData) => previousData,
  });
}
