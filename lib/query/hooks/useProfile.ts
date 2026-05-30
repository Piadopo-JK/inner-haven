"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiError } from "@/lib/query/http";
import {
  profileQueryOptions,
  queryKeys,
  type ProfileSettingsCachePayload,
} from "@/lib/query/queries";

type SaveProfileInput = {
  name: string;
  avatarUrl: string;
  about: string;
  specialization: string;
  officeRoom: string;
};

type UploadAvatarResponse = {
  avatar_url: string;
  path: string;
};

function normalizeString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function readProfileMutationError(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return createApiError(response, fallbackMessage, payload);
}

export function useProfile() {
  return useQuery({
    ...profileQueryOptions(),
  });
}

export function useSetProfileCache() {
  const queryClient = useQueryClient();
  return (data: ProfileSettingsCachePayload) => {
    queryClient.setQueryData(queryKeys.profile(), data);
  };
}

export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProfileInput) => {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          avatar_url: input.avatarUrl,
          about: input.about,
          specialization: input.specialization,
          office_room: input.officeRoom,
        }),
      });

      if (!response.ok) {
        throw await readProfileMutationError(
          response,
          "Unable to save profile settings.",
        );
      }

      return input;
    },

    onSuccess: (input) => {
      queryClient.setQueryData<ProfileSettingsCachePayload | undefined>(
        queryKeys.profile(),
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            name: normalizeString(input.name) ?? current.name,
            avatar_url: normalizeString(input.avatarUrl),
            about:
              current.role === "counselor"
                ? normalizeString(input.about)
                : current.about,
            specialization:
              current.role === "counselor"
                ? normalizeString(input.specialization)
                : current.specialization,
            office_room:
              current.role === "counselor"
                ? normalizeString(input.officeRoom)
                : current.office_room,
          };
        },
      );
    },
  });
}

export function useUploadProfileAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set("avatar", file);

      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw await readProfileMutationError(
          response,
          "Unable to upload avatar.",
        );
      }

      return (await response.json()) as UploadAvatarResponse;
    },

    onSuccess: ({ avatar_url }) => {
      queryClient.setQueryData<ProfileSettingsCachePayload | undefined>(
        queryKeys.profile(),
        (current) =>
          current
            ? { ...current, avatar_url: avatar_url || null }
            : current,
      );
    },
  });
}

export function useDeleteProfileAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/settings/avatar", { method: "DELETE" });

      if (!response.ok) {
        throw await readProfileMutationError(
          response,
          "Unable to delete avatar.",
        );
      }
    },

    onSuccess: () => {
      queryClient.setQueryData<ProfileSettingsCachePayload | undefined>(
        queryKeys.profile(),
        (current) => (current ? { ...current, avatar_url: null } : current),
      );
    },
  });
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
}
