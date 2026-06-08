"use client";

import { useQuery } from "@tanstack/react-query";
import type { StudentDirectoryItemDTO } from "@/lib/booking/contracts";
import { studentsQueryOptions } from "@/lib/query/queries";

const EMPTY_STUDENTS: StudentDirectoryItemDTO[] = [];

export function useStudents(enabled = true) {
  const options = studentsQueryOptions();

  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: options.staleTime,
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

export { EMPTY_STUDENTS };
