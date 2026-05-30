"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appointmentDetailsQueryOptions,
  queryKeys,
} from "@/lib/query/queries";
import type { AppointmentDTO } from "@/lib/booking/contracts";

export function useAppointmentDetails(
  appointmentId: string,
  initialData?: AppointmentDTO,
) {
  return useQuery({
    ...appointmentDetailsQueryOptions(appointmentId),
    initialData,
    enabled: Boolean(appointmentId),
  });
}

export function useInvalidateAppointmentDetails() {
  const queryClient = useQueryClient();
  return (appointmentId: string) =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.appointmentDetails(appointmentId),
    });
}

export function useSetAppointmentDetailsCache() {
  const queryClient = useQueryClient();
  return (appointmentId: string, data: AppointmentDTO) => {
    queryClient.setQueryData(queryKeys.appointmentDetails(appointmentId), data);
  };
}
