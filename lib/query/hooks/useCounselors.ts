"use client";

import { useQuery } from "@tanstack/react-query";

import { counselorsQueryOptions } from "@/lib/query/queries";
import type { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";

const EMPTY_COUNSELORS: CounselorDirectoryItemDTO[] = [];

export function useCounselors(enabled = true) {
  return useQuery({
    ...counselorsQueryOptions(),
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

export { EMPTY_COUNSELORS };