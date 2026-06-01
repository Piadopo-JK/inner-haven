import { queryOptions } from "@tanstack/react-query";
import type {
  AnonymousThreadMessage,
  AnonymousThreadSummary,
  StudentAnonymousThreads,
  CounselorAnonymousThreadSummary,
} from "@/lib/anonymous/types";
import { fetchJson, readJsonResponse } from "@/lib/query/http";

export type ProfileSettingsCachePayload = {
  role: "student" | "counselor";
  name: string;
  avatar_url: string | null;
  about?: string | null;
  specialization?: string | null;
  office_room?: string | null;
};
import type {
  AppointmentDTO,
  AvailabilityWindowResponseDTO,
  CounselorDirectoryItemDTO,
  CounselorScheduleRuleDTO,
  SessionNoteDTO,
  SessionRole,
  StudentDirectoryItemDTO,
} from "@/lib/booking/contracts";

export type GoogleIntegrationStatusPayload = {
  isConnected: boolean;
};

export const APPOINTMENTS_STALE_MS = Infinity; // Realtime is the source of truth
export const APPOINTMENT_DETAILS_STALE_MS = 60_000;
export const PROFILE_STALE_MS = 15 * 60_000;
export const SCHEDULE_STALE_MS = 15 * 60_000;
export const NOTES_STALE_MS = 60_000;
export const AVAILABILITY_STALE_MS = 15 * 60_000;
export const COUNSELORS_STALE_MS = 15 * 60_000;
export const STUDENTS_STALE_MS = 15 * 60_000;
export const UNREAD_COUNT_STALE_MS = 30_000;
export const GOOGLE_INTEGRATION_STALE_MS = 60_000;
export const AUTH_ME_STALE_MS = 30 * 60_000; // 30min — role/userId rarely changes
export const ANONYMOUS_THREADS_STALE_MS = 30_000;
export const ANONYMOUS_MESSAGES_STALE_MS = 20_000;

export const queryKeys = {
  profile: () => ["profile"] as const,
  schedule: () => ["counselor-schedule"] as const,
  appointments: (role: SessionRole) => ["appointments", role] as const,
  appointmentDetails: (appointmentId: string) =>
    ["appointment", appointmentId] as const,
  counselors: () => ["counselors"] as const,
  students: () => ["students"] as const,
  unreadCount: (role: SessionRole) => ["unread-count", role] as const,
  availabilityRoot: () => ["availability"] as const,
  availabilityByCounselor: (counselorId: string) =>
    ["availability", counselorId] as const,
  availability: (counselorId: string, from: string, to: string) =>
    ["availability", counselorId, from, to] as const,
  sessionNotes: (appointmentId: string) =>
    ["session-notes", appointmentId] as const,
  googleIntegration: () => ["google-integration"] as const,
  anonymousIdentity: () => ["anonymous", "identity"] as const,
  anonymousCounselorThreads: () =>
    ["anonymous", "counselor-threads"] as const,
  anonymousThreadMessages: (threadId: string) =>
    ["anonymous", "thread", threadId, "messages"] as const,
  authMe: () => ["auth", "me"] as const,
};

export function fetchProfile() {
  return fetchJson<ProfileSettingsCachePayload>("/api/settings/profile");
}

export function profileQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.profile(),
    queryFn: fetchProfile,
    staleTime: PROFILE_STALE_MS,
  });
}

export function fetchSchedule() {
  return fetchJson<CounselorScheduleRuleDTO[]>("/api/counselor/schedule");
}

export function scheduleQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.schedule(),
    queryFn: fetchSchedule,
    staleTime: SCHEDULE_STALE_MS,
  });
}

export function fetchAppointments() {
  return fetchJson<AppointmentDTO[]>("/api/appointments");
}

export function fetchAppointmentDetails(appointmentId: string) {
  return fetchJson<AppointmentDTO>(`/api/appointments/${appointmentId}`);
}

export function fetchCounselors() {
  return fetchJson<CounselorDirectoryItemDTO[]>("/api/counselors");
}

export function counselorsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.counselors(),
    queryFn: fetchCounselors,
    staleTime: COUNSELORS_STALE_MS,
  });
}

export function fetchStudents() {
  return fetchJson<StudentDirectoryItemDTO[]>("/api/counselor/students");
}

export function studentsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.students(),
    queryFn: fetchStudents,
    staleTime: STUDENTS_STALE_MS,
  });
}

export function fetchUnreadCount() {
  return fetchJson<{ count: number }>("/api/notifications/unread-count");
}

export function unreadCountQueryOptions(role: SessionRole) {
  return queryOptions({
    queryKey: queryKeys.unreadCount(role),
    queryFn: fetchUnreadCount,
    staleTime: UNREAD_COUNT_STALE_MS,
  });
}

export type AuthMePayload = {
  role: SessionRole;
  userId: string;
  email: string | undefined;
  name: string;
  studentId: string | null;
};

export function fetchAuthMe() {
  return fetchJson<AuthMePayload | null>("/api/auth/me");
}

export function authMeQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.authMe(),
    queryFn: fetchAuthMe,
    staleTime: AUTH_ME_STALE_MS,
  });
}

export function appointmentsQueryOptions(role: SessionRole) {
  return queryOptions({
    queryKey: queryKeys.appointments(role),
    queryFn: fetchAppointments,
    staleTime: APPOINTMENTS_STALE_MS,
  });
}

export function appointmentDetailsQueryOptions(appointmentId: string) {
  return queryOptions({
    queryKey: queryKeys.appointmentDetails(appointmentId),
    queryFn: () => fetchAppointmentDetails(appointmentId),
    staleTime: APPOINTMENT_DETAILS_STALE_MS,
  });
}

export function fetchAvailability(
  counselorId: string,
  from: string,
  to: string,
) {
  const params = new URLSearchParams({ counselor_id: counselorId, from, to });
  return fetchJson<AvailabilityWindowResponseDTO>(
    `/api/availability?${params}`,
  );
}

export function availabilityQueryOptions(
  counselorId: string,
  from: string,
  to: string,
) {
  return queryOptions({
    queryKey: queryKeys.availability(counselorId, from, to),
    queryFn: () => fetchAvailability(counselorId, from, to),
    staleTime: AVAILABILITY_STALE_MS,
    enabled: Boolean(counselorId && from && to),
  });
}

export function availabilityForMonthQueryOptions(
  counselorId: string,
  referenceDate: Date | undefined,
) {
  const chunk = referenceDate
    ? chunkAlignedRange(referenceDate)
    : { from: "", to: "" };

  return availabilityQueryOptions(counselorId, chunk.from, chunk.to);
}

export function fetchSessionNotes(appointmentId: string) {
  return fetchJson<{ note: SessionNoteDTO | null }>(
    `/api/appointments/${appointmentId}/notes`,
  );
}

export function sessionNotesQueryOptions(appointmentId: string) {
  return queryOptions({
    queryKey: queryKeys.sessionNotes(appointmentId),
    queryFn: () => fetchSessionNotes(appointmentId),
    staleTime: NOTES_STALE_MS,
  });
}

export function fetchGoogleIntegrationStatus() {
  return fetchJson<GoogleIntegrationStatusPayload>(
    "/api/settings/google-integration",
  );
}

export function googleIntegrationQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.googleIntegration(),
    queryFn: fetchGoogleIntegrationStatus,
    staleTime: GOOGLE_INTEGRATION_STALE_MS,
  });
}

export async function fetchAnonymousIdentity() {
  const response = await fetch("/api/anonymous-requests/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  return readJsonResponse<StudentAnonymousThreads>(
    response,
    "Unable to load anonymous threads.",
  );
}

export function anonymousIdentityQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.anonymousIdentity(),
    queryFn: fetchAnonymousIdentity,
    staleTime: ANONYMOUS_THREADS_STALE_MS,
  });
}

export async function fetchAnonymousCounselorThreads() {
  const payload = await fetchJson<{
    threads?: CounselorAnonymousThreadSummary[];
  }>("/api/counselor/anonymous-threads");

  return payload.threads ?? [];
}

export function anonymousCounselorThreadsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.anonymousCounselorThreads(),
    queryFn: fetchAnonymousCounselorThreads,
    staleTime: ANONYMOUS_THREADS_STALE_MS,
  });
}

export async function fetchAnonymousThreadMessages(threadId: string) {
  const response = await fetch(`/api/anonymous-threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list" }),
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    messages?: AnonymousThreadMessage[];
  }>(response, "Unable to load anonymous messages.");

  return payload.messages ?? [];
}

export function anonymousThreadMessagesQueryOptions(threadId: string) {
  return queryOptions({
    queryKey: queryKeys.anonymousThreadMessages(threadId),
    queryFn: () => fetchAnonymousThreadMessages(threadId),
    staleTime: ANONYMOUS_MESSAGES_STALE_MS,
    enabled: Boolean(threadId),
  });
}

export function chunkAlignedRange(referenceDate: Date): {
  from: string;
  to: string;
} {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(from.getTime() + 41 * 86_400_000); // 42 days inclusive
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
  };
}
