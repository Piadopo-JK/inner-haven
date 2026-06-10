"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionRole } from "@/lib/booking/contracts";
import { unreadCountQueryOptions } from "@/lib/query/queries";

export function useUnreadCount(role: SessionRole) {
  const options = unreadCountQueryOptions(role);

  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: options.staleTime,
    placeholderData: (previousData) => previousData,
  });
}
