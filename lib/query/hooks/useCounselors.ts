"use client";

import { useQuery } from "@tanstack/react-query";

import { counselorsQueryOptions } from "@/lib/query/queries";

export function useCounselors() {
  return useQuery({
    ...counselorsQueryOptions(),
  });
}