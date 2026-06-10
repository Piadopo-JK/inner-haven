"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelStudentAppointmentAction } from "@/app/actions/appointments";
import type { AppointmentDTO } from "@/lib/booking/contracts";
import { queryKeys } from "@/lib/query/queries";
import { debouncedInvalidate } from "@/lib/query/debounce-invalidate";

export function useCancelStudentAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      await cancelStudentAppointmentAction(appointmentId);
    },

    onMutate: async (appointmentId: string) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.appointments("student"),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.appointmentDetails(appointmentId),
        }),
      ]);

      const previous = queryClient.getQueryData<AppointmentDTO[]>(
        queryKeys.appointments("student"),
      );
      const previousDetail = queryClient.getQueryData<AppointmentDTO>(
        queryKeys.appointmentDetails(appointmentId),
      );
      const counselorId =
        previousDetail?.counselor_id ??
        previous?.find((a) => a.appointment_id === appointmentId)?.counselor_id;
      const optimisticUpdatedAt = new Date().toISOString();

      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("student"),
        (current) =>
          current?.map((item) =>
            item.appointment_id === appointmentId
              ? { ...item, status: "cancelled", updated_at: optimisticUpdatedAt }
              : item,
          ) ?? [],
      );

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.appointmentDetails(appointmentId), {
          ...previousDetail,
          status: "cancelled",
          updated_at: optimisticUpdatedAt,
        });
      }

      return { previous, previousDetail, counselorId };
    },

    onError: (_error, appointmentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.appointments("student"),
          context.previous,
        );
      }

      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.appointmentDetails(appointmentId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_appointment, _error, appointmentId, context) => {
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointments("student"),
      });
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointmentDetails(appointmentId),
      });
      if (context?.counselorId) {
        debouncedInvalidate(queryClient, {
          queryKey: queryKeys.availabilityByCounselor(context.counselorId),
        });
      }
    },
  });
}
