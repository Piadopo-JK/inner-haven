"use client";

import {
  AppointmentDTO,
  CounselorScheduleRuleDTO,
  AvailabilityWindowResponseDTO,
  SessionRole,
} from "@/lib/booking/contracts";
import { createClient } from "@/lib/supabase/client";

export type ProfileSettingsCachePayload = {
  role: "student" | "counselor";
  name: string;
  avatar_url: string | null;
  about?: string | null;
  // Counselor-only
  specialization?: string | null;
  office_room?: string | null;
  // Student-only
  year_level?: string | null;
  course?: string | null;
};

export type AvailabilityCachePayload = {
  response: AvailabilityWindowResponseDTO;
  chunkStart: string;
  chunkEnd: string;
};

type CacheEntry<T> = {
  value: T | null;
  expiresAt: number;
  inFlight?: Promise<T>;
};

const PROFILE_TTL_MS = 15 * 60 * 1000;
const SCHEDULE_TTL_MS = 15 * 60 * 1000;
const APPOINTMENTS_TTL_MS = 60 * 1000;
const AVAILABILITY_TTL_MS = 15 * 60 * 1000;
const ERROR_BACKOFF_MS = 5_000;

const MAX_AVAILABILITY_ENTRIES = 50;

const PROFILE_EVENT = "settings:profile-changed";
const SCHEDULE_EVENT = "settings:schedule-changed";
const APPOINTMENTS_EVENT = "appointments:list-changed";
const AVAILABILITY_EVENT = "booking:availability-changed";

let cacheSessionKey: string | null = null;
const appointmentsRealtimeRefCountByRole: Record<SessionRole, number> = {
  student: 0,
  counselor: 0,
};
const appointmentsRealtimeCleanupByRole: Partial<Record<SessionRole, () => void>> = {};

const profileCache: CacheEntry<ProfileSettingsCachePayload> = {
  value: null,
  expiresAt: 0,
};

const scheduleCache: CacheEntry<CounselorScheduleRuleDTO[]> = {
  value: null,
  expiresAt: 0,
};

const appointmentsCacheByRole: Record<SessionRole, CacheEntry<AppointmentDTO[]>> = {
  student: {
    value: null,
    expiresAt: 0,
  },
  counselor: {
    value: null,
    expiresAt: 0,
  },
};

const availabilityCache: Map<string, CacheEntry<AvailabilityCachePayload>> = new Map();

export function clearAllClientCaches() {
  profileCache.value = null;
  profileCache.expiresAt = 0;
  profileCache.inFlight = undefined;

  scheduleCache.value = null;
  scheduleCache.expiresAt = 0;
  scheduleCache.inFlight = undefined;

  appointmentsCacheByRole.student.value = null;
  appointmentsCacheByRole.student.expiresAt = 0;
  appointmentsCacheByRole.student.inFlight = undefined;

  appointmentsCacheByRole.counselor.value = null;
  appointmentsCacheByRole.counselor.expiresAt = 0;
  appointmentsCacheByRole.counselor.inFlight = undefined;

  availabilityCache.clear();
}

export function setCacheSessionKey(nextKey: string | null) {
  if (cacheSessionKey === nextKey) {
    return;
  }

  cacheSessionKey = nextKey;
  clearAllClientCaches();
}

function now() {
  return Date.now();
}

function cacheIsFresh<T>(entry: CacheEntry<T>) {
  return entry.value !== null && entry.expiresAt > now();
}

function cacheHasStaleValue<T>(entry: CacheEntry<T>) {
  return entry.value !== null;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed: ${url}`);
  }
  return (await response.json()) as T;
}

export function chunkAlignedRange(referenceDate: Date): { from: string; to: string } {
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

export async function getProfileSettingsCached(options?: { force?: boolean }) {
  if (!options?.force && cacheIsFresh(profileCache)) {
    return profileCache.value as ProfileSettingsCachePayload;
  }

  const hasStale = !options?.force && cacheHasStaleValue(profileCache);

  if (!profileCache.inFlight) {
    profileCache.inFlight = fetchJson<ProfileSettingsCachePayload>("/api/settings/profile")
      .then((payload) => {
        profileCache.value = payload;
        profileCache.expiresAt = now() + PROFILE_TTL_MS;
        return payload;
      })
      .catch((err: unknown) => {
        profileCache.expiresAt = now() + ERROR_BACKOFF_MS;
        throw err;
      })
      .finally(() => {
        profileCache.inFlight = undefined;
      });
  }

  if (hasStale) {
    return profileCache.value as ProfileSettingsCachePayload;
  }

  return profileCache.inFlight;
}

function setProfileSettingsCache(payload: ProfileSettingsCachePayload) {
  profileCache.value = payload;
  profileCache.expiresAt = now() + PROFILE_TTL_MS;
}

export function invalidateProfileSettingsCache() {
  profileCache.value = null;
  profileCache.expiresAt = 0;
}

export function emitProfileSettingsChanged(payload?: ProfileSettingsCachePayload) {
  if (payload) {
    setProfileSettingsCache(payload);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT));
  }
}

export function subscribeProfileSettingsChanged(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => listener();
  window.addEventListener(PROFILE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_EVENT, handler);
}

export async function getCounselorScheduleCached(options?: { force?: boolean }) {
  if (!options?.force && cacheIsFresh(scheduleCache)) {
    return scheduleCache.value as CounselorScheduleRuleDTO[];
  }

  const hasStale = !options?.force && cacheHasStaleValue(scheduleCache);

  if (!scheduleCache.inFlight) {
    scheduleCache.inFlight = fetchJson<CounselorScheduleRuleDTO[]>("/api/counselor/schedule")
      .then((payload) => {
        scheduleCache.value = payload;
        scheduleCache.expiresAt = now() + SCHEDULE_TTL_MS;
        return payload;
      })
      .catch((err: unknown) => {
        scheduleCache.expiresAt = now() + ERROR_BACKOFF_MS;
        throw err;
      })
      .finally(() => {
        scheduleCache.inFlight = undefined;
      });
  }

  if (hasStale) {
    return scheduleCache.value as CounselorScheduleRuleDTO[];
  }

  return scheduleCache.inFlight;
}

function setCounselorScheduleCache(payload: CounselorScheduleRuleDTO[]) {
  scheduleCache.value = payload;
  scheduleCache.expiresAt = now() + SCHEDULE_TTL_MS;
}

export function invalidateCounselorScheduleCache() {
  scheduleCache.value = null;
  scheduleCache.expiresAt = 0;
}

export function emitCounselorScheduleChanged(payload?: CounselorScheduleRuleDTO[]) {
  if (payload) {
    setCounselorScheduleCache(payload);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));
  }
}

export function subscribeCounselorScheduleChanged(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => listener();
  window.addEventListener(SCHEDULE_EVENT, handler);
  return () => window.removeEventListener(SCHEDULE_EVENT, handler);
}

export function subscribeSettingsRealtimeSync() {
  return () => {};
}

export function subscribeCounselorScheduleRealtimeSync() {
  return () => {};
}

function setAppointmentsCache(role: SessionRole, payload: AppointmentDTO[]) {
  appointmentsCacheByRole[role].value = payload;
  appointmentsCacheByRole[role].expiresAt = now() + APPOINTMENTS_TTL_MS;
}

export async function getAppointmentsCached(
  role: SessionRole,
  options?: { force?: boolean; seed?: AppointmentDTO[] }
) {
  const entry = appointmentsCacheByRole[role];

  if (!entry.value && options?.seed?.length) {
    setAppointmentsCache(role, options.seed);
    return options.seed;
  }

  if (!options?.force && cacheIsFresh(entry)) {
    return entry.value as AppointmentDTO[];
  }

  const hasStale = !options?.force && cacheHasStaleValue(entry);

  if (!entry.inFlight) {
    entry.inFlight = fetchJson<AppointmentDTO[]>("/api/appointments")
      .then((payload) => {
        setAppointmentsCache(role, payload);
        return payload;
      })
      .catch((err: unknown) => {
        entry.expiresAt = now() + ERROR_BACKOFF_MS;
        throw err;
      })
      .finally(() => {
        entry.inFlight = undefined;
      });
  }

  if (hasStale) {
    return entry.value as AppointmentDTO[];
  }

  return entry.inFlight;
}

export function seedAppointmentsCache(role: SessionRole, appointments: AppointmentDTO[]) {
  const entry = appointmentsCacheByRole[role];
  if (!entry.value) {
    setAppointmentsCache(role, appointments);
  }
}

export function invalidateAppointmentsCache(role: SessionRole) {
  appointmentsCacheByRole[role].value = null;
  appointmentsCacheByRole[role].expiresAt = 0;
}

export function emitAppointmentsChanged(role: SessionRole, payload?: AppointmentDTO[]) {
  if (payload) {
    setAppointmentsCache(role, payload);
  } else {
    invalidateAppointmentsCache(role);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APPOINTMENTS_EVENT, { detail: { role } }));
  }
}

export function subscribeAppointmentsChanged(role: SessionRole, listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ role?: SessionRole }>;
    if (!customEvent.detail?.role || customEvent.detail.role === role) {
      listener();
    }
  };

  window.addEventListener(APPOINTMENTS_EVENT, handler);
  return () => window.removeEventListener(APPOINTMENTS_EVENT, handler);
}

function startAppointmentsRealtimeSync(role: SessionRole) {
  const supabase = createClient();
  const channel = supabase
    .channel(`appointments-cache-realtime-${role}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments",
      },
      () => {
        emitAppointmentsChanged(role);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeAppointmentsRealtimeSync(role: SessionRole) {
  if (typeof window === "undefined") {
    return () => {};
  }

  appointmentsRealtimeRefCountByRole[role] += 1;
  if (!appointmentsRealtimeCleanupByRole[role]) {
    appointmentsRealtimeCleanupByRole[role] = startAppointmentsRealtimeSync(role);
  }

  return () => {
    appointmentsRealtimeRefCountByRole[role] = Math.max(0, appointmentsRealtimeRefCountByRole[role] - 1);
    if (appointmentsRealtimeRefCountByRole[role] === 0 && appointmentsRealtimeCleanupByRole[role]) {
      appointmentsRealtimeCleanupByRole[role]?.();
      delete appointmentsRealtimeCleanupByRole[role];
    }
  };
}

function availabilityCacheKey(counselorId: string, from: string, to: string) {
  return JSON.stringify([counselorId, from, to]);
}

function pruneAvailabilityCache() {
  const n = now();
  availabilityCache.forEach((entry, key) => {
    if (!entry.inFlight && entry.expiresAt < n) {
      availabilityCache.delete(key);
    }
  });
}

function evictOldestAvailabilityEntry() {
  let oldestKey: string | null = null;
  let oldestExpiry = Infinity;
  availabilityCache.forEach((entry, key) => {
    if (!entry.inFlight && entry.expiresAt < oldestExpiry) {
      oldestExpiry = entry.expiresAt;
      oldestKey = key;
    }
  });
  if (oldestKey) {
    availabilityCache.delete(oldestKey);
  }
}

export async function getCounselorAvailabilityCached(
  counselorId: string,
  from: string,
  to: string,
  options?: { force?: boolean }
) {
  const key = availabilityCacheKey(counselorId, from, to);
  const cached = availabilityCache.get(key);

  if (!options?.force && cached && cacheIsFresh(cached)) {
    return cached.value as AvailabilityCachePayload;
  }

  const hasStale = !options?.force && cached && cacheHasStaleValue(cached);

  const entry: CacheEntry<AvailabilityCachePayload> = cached || {
    value: null,
    expiresAt: 0,
  };

  if (!entry.inFlight) {
    pruneAvailabilityCache();
    if (availabilityCache.size >= MAX_AVAILABILITY_ENTRIES) {
      evictOldestAvailabilityEntry();
    }

    const params = new URLSearchParams({ counselor_id: counselorId, from, to });
    entry.inFlight = fetchJson<AvailabilityWindowResponseDTO>(`/api/availability?${params}`)
      .then((response) => {
        const payload: AvailabilityCachePayload = {
          response,
          chunkStart: from,
          chunkEnd: to,
        };
        entry.value = payload;
        entry.expiresAt = now() + AVAILABILITY_TTL_MS;
        availabilityCache.set(key, entry);
        return payload;
      })
      .catch((err: unknown) => {
        entry.expiresAt = now() + ERROR_BACKOFF_MS;
        throw err;
      })
      .finally(() => {
        entry.inFlight = undefined;
      });

    availabilityCache.set(key, entry);
  }

  if (hasStale) {
    return cached!.value as AvailabilityCachePayload;
  }

  return entry.inFlight;
}

export function invalidateCounselorAvailabilityCache(counselorId: string) {
  const keysToDelete: string[] = [];
  availabilityCache.forEach((_, key) => {
    const parsed = JSON.parse(key) as [string, string, string];
    if (parsed[0] === counselorId) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => availabilityCache.delete(key));
}

export function emitCounselorAvailabilityChanged(counselorId: string) {
  invalidateCounselorAvailabilityCache(counselorId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AVAILABILITY_EVENT, { detail: { counselorId } }));
  }
}

export function subscribeCounselorAvailabilityChanged(listener: (counselorId: string) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ counselorId: string }>;
    listener(customEvent.detail.counselorId);
  };
  window.addEventListener(AVAILABILITY_EVENT, handler);
  return () => window.removeEventListener(AVAILABILITY_EVENT, handler);
}

export function isProfileSettingsCacheFresh() {
  return cacheIsFresh(profileCache);
}

export function isCounselorScheduleCacheFresh() {
  return cacheIsFresh(scheduleCache);
}

export function isAppointmentsCacheFresh(role: SessionRole) {
  return cacheIsFresh(appointmentsCacheByRole[role]);
}

export function subscribeVisibilityRefetch(
  isFresh: () => boolean,
  onRefetch: () => void,
): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const handler = () => {
    if (document.visibilityState === "visible" && !isFresh()) {
      onRefetch();
    }
  };

  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}

export function subscribeNetworkRefetch(
  isFresh: () => boolean,
  onRefetch: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => {
    if (!isFresh()) {
      onRefetch();
    }
  };

  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
