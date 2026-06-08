"use client";

import { useQuery } from "@tanstack/react-query";
import { authMeQueryOptions } from "@/lib/query/queries";

export function useAuthMe() {
  const options = authMeQueryOptions();

  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: options.staleTime,
    placeholderData: (previousData) => previousData,
  });
}
