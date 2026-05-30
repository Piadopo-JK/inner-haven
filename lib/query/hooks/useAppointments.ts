"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  rescheduleCounselorAppointmentAction,
} from "@/app/actions/appointments";
import { createClient } from "@/lib/supabase/client";
import { createApiError, readResponsePayload } from "@/lib/query/http";
import {
  appointmentsQueryOptions,
  queryKeys,
} from "@/lib/query/queries";
import { debouncedInvalidate } from "@/lib/query/debounce-invalidate";
import type { AppointmentDTO, SessionMode, SessionRole } from "@/lib/booking/contracts";
export type {
  AppointmentTab,
  CounselorDashboardAppointments,
  StudentDashboardAppointments,
  StudentDashboardOverview,
} from "@/lib/query/appointment-selectors";
export {
  compareAppointmentDateTime,
  selectAppointmentsByTab,
  selectCounselorDashboardAppointments,
  selectStudentDashboardAppointments,
  selectStudentDashboardOverview,
} from "@/lib/query/appointment-selectors";
export { useCancelStudentAppointment } from "@/lib/query/hooks/useStudentAppointmentActions";

type SaveAppointmentInput = {
  appointmentId?: string;
  counselorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  mode: SessionMode;
};

type UpdateCounselorAppointmentStatusInput = {
  appointmentId: string;
  status: "approved" | "cancelled";
};

type RescheduleCounselorAppointmentInput = {
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
};

async function readMutationError(
  response: Response,
  fallbackMessage: string,
) {
  const payload = await readResponsePayload<{
    error?: string;
    reconnectGoogle?: boolean;
  }>(response);

  const error = createApiError(response, fallbackMessage, payload) as Error & {
    reconnectGoogle?: boolean;
  };
  error.reconnectGoogle = payload?.reconnectGoogle;
  return error;
}

function upsertAppointment(
  appointments: AppointmentDTO[] | undefined,
  nextAppointment: AppointmentDTO,
) {
  if (!appointments) {
    return [nextAppointment];
  }

  const index = appointments.findIndex(
    (appointment) => appointment.appointment_id === nextAppointment.appointment_id,
  );

  if (index === -1) {
    return [nextAppointment, ...appointments];
  }

  return appointments.map((appointment) =>
    appointment.appointment_id === nextAppointment.appointment_id
      ? nextAppointment
      : appointment,
  );
}

export function useAppointments<TData = AppointmentDTO[]>(
  role: SessionRole,
  initialData?: AppointmentDTO[],
  options?: {
    select?: (appointments: AppointmentDTO[]) => TData;
  },
) {
  const baseOptions = appointmentsQueryOptions(role);

  return useQuery({
    queryKey: baseOptions.queryKey,
    queryFn: baseOptions.queryFn,
    staleTime: baseOptions.staleTime,
    // SSR data seeds the cache on first render; background refetch happens
    // because staleTime means it's already stale at the point of hydration.
    ...(initialData !== undefined ? { initialData } : {}),
    ...(options?.select ? { select: options.select } : {}),
  });
}

export function useAppointmentsRealtimeSync(role: SessionRole) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointments-realtime-${role}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          debouncedInvalidate(queryClient, {
            queryKey: queryKeys.appointments(role),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [role, queryClient]);
}

export function useCancelCounselorAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!response.ok) {
        throw await readMutationError(response, "Failed to cancel appointment");
      }

      return (await response.json()) as AppointmentDTO;
    },

    onMutate: async (appointmentId: string) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.appointments("counselor"),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.appointmentDetails(appointmentId),
        }),
      ]);

      const previous = queryClient.getQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
      );
      const previousDetail = queryClient.getQueryData<AppointmentDTO>(
        queryKeys.appointmentDetails(appointmentId),
      );
      const counselorId =
        previousDetail?.counselor_id ??
        previous?.find((a) => a.appointment_id === appointmentId)?.counselor_id;
      const optimisticUpdatedAt = new Date().toISOString();

      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
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

    onError: (_err, appointmentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.appointments("counselor"),
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

    onSuccess: (appointment, appointmentId) => {
      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
        (current) => upsertAppointment(current, appointment),
      );
      queryClient.setQueryData(
        queryKeys.appointmentDetails(appointmentId),
        appointment,
      );
    },

    onSettled: (_appointment, _error, appointmentId, context) => {
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointments("counselor"),
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

export function useSaveAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveAppointmentInput) => {
      const response = await fetch(
        input.appointmentId
          ? `/api/appointments/${input.appointmentId}`
          : "/api/appointments",
        {
          method: input.appointmentId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            counselor_id: input.counselorId,
            appointment_date: input.appointmentDate,
            appointment_time: input.appointmentTime,
            reason: input.reason,
            mode: input.mode,
          }),
        },
      );

      if (!response.ok) {
        throw await readMutationError(
          response,
          input.appointmentId
            ? "Failed to update appointment"
            : "Failed to create appointment",
        );
      }

      return (await response.json()) as AppointmentDTO;
    },

    onMutate: async (input) => {
      if (!input.appointmentId) {
        return { previousDetail: undefined };
      }

      await queryClient.cancelQueries({
        queryKey: queryKeys.appointmentDetails(input.appointmentId),
      });

      const previousDetail = queryClient.getQueryData<AppointmentDTO>(
        queryKeys.appointmentDetails(input.appointmentId),
      );

      return { previousDetail };
    },

    onSuccess: (appointment, input, context) => {
      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("student"),
        (current) => upsertAppointment(current, appointment),
      );
      queryClient.setQueryData(
        queryKeys.appointmentDetails(appointment.appointment_id),
        appointment,
      );

      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.availabilityByCounselor(appointment.counselor_id),
      });

      if (
        context?.previousDetail &&
        context.previousDetail.counselor_id !== appointment.counselor_id
      ) {
        debouncedInvalidate(queryClient, {
          queryKey: queryKeys.availabilityByCounselor(
            context.previousDetail.counselor_id,
          ),
        });
      }
    },

    onError: (_error, input, context) => {
      if (input.appointmentId && context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.appointmentDetails(input.appointmentId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_appointment, _error, input) => {
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointments("student"),
      });

      if (input.appointmentId) {
        debouncedInvalidate(queryClient, {
          queryKey: queryKeys.appointmentDetails(input.appointmentId),
        });
      }
    },
  });
}

export function useUpdateCounselorAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, status }: UpdateCounselorAppointmentStatusInput) => {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw await readMutationError(
          response,
          "Unable to update appointment right now. Please try again.",
        );
      }

      return (await response.json()) as AppointmentDTO;
    },

    onMutate: async ({ appointmentId, status }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.appointments("counselor") }),
        queryClient.cancelQueries({ queryKey: queryKeys.appointmentDetails(appointmentId) }),
      ]);

      const previousAppointments = queryClient.getQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
      );
      const previousDetail = queryClient.getQueryData<AppointmentDTO>(
        queryKeys.appointmentDetails(appointmentId),
      );
      const counselorId =
        previousDetail?.counselor_id ??
        previousAppointments?.find((a) => a.appointment_id === appointmentId)?.counselor_id;

      const optimisticUpdatedAt = new Date().toISOString();

      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
        (current) =>
          current?.map((appointment) =>
            appointment.appointment_id === appointmentId
              ? { ...appointment, status, updated_at: optimisticUpdatedAt }
              : appointment,
          ) ?? [],
      );

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.appointmentDetails(appointmentId), {
          ...previousDetail,
          status,
          updated_at: optimisticUpdatedAt,
        });
      }

      return { previousAppointments, previousDetail, counselorId };
    },

    onError: (_error, { appointmentId }, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          queryKeys.appointments("counselor"),
          context.previousAppointments,
        );
      }

      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.appointmentDetails(appointmentId),
          context.previousDetail,
        );
      }
    },

    onSuccess: (appointment) => {
      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
        (current) => upsertAppointment(current, appointment),
      );
      queryClient.setQueryData(
        queryKeys.appointmentDetails(appointment.appointment_id),
        appointment,
      );
    },

    onSettled: (_appointment, _error, { appointmentId, status }, context) => {
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointments("counselor"),
      });
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointmentDetails(appointmentId),
      });
      if (status === "cancelled" && context?.counselorId) {
        debouncedInvalidate(queryClient, {
          queryKey: queryKeys.availabilityByCounselor(context.counselorId),
        });
      }
    },
  });
}

export function useRescheduleCounselorAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, appointmentDate, appointmentTime }: RescheduleCounselorAppointmentInput) => {
      await rescheduleCounselorAppointmentAction(
        appointmentId,
        appointmentDate,
        appointmentTime,
      );
    },

    onMutate: async ({ appointmentId, appointmentDate, appointmentTime }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.appointments("counselor") }),
        queryClient.cancelQueries({ queryKey: queryKeys.appointmentDetails(appointmentId) }),
      ]);

      const previousAppointments = queryClient.getQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
      );
      const previousDetail = queryClient.getQueryData<AppointmentDTO>(
        queryKeys.appointmentDetails(appointmentId),
      );
      const optimisticUpdatedAt = new Date().toISOString();

      queryClient.setQueryData<AppointmentDTO[]>(
        queryKeys.appointments("counselor"),
        (current) =>
          current?.map((appointment) =>
            appointment.appointment_id === appointmentId
              ? {
                  ...appointment,
                  appointment_date: appointmentDate,
                  appointment_time: `${appointmentTime}:00`,
                  updated_at: optimisticUpdatedAt,
                }
              : appointment,
          ) ?? [],
      );

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.appointmentDetails(appointmentId), {
          ...previousDetail,
          appointment_date: appointmentDate,
          appointment_time: `${appointmentTime}:00`,
          updated_at: optimisticUpdatedAt,
        });
      }

      return { previousAppointments, previousDetail };
    },

    onError: (_error, { appointmentId }, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          queryKeys.appointments("counselor"),
          context.previousAppointments,
        );
      }

      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.appointmentDetails(appointmentId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_result, _error, { appointmentId }) => {
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointments("counselor"),
      });
      debouncedInvalidate(queryClient, {
        queryKey: queryKeys.appointmentDetails(appointmentId),
      });
    },
  });
}
