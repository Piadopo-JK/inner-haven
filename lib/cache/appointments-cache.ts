import { cookies } from "next/headers";

import { AppointmentDTO, SessionNoteDTO, SessionRole } from "@/lib/booking/contracts";

const APPOINTMENTS_REVALIDATE_S = 60;
const APPOINTMENT_DETAILS_REVALIDATE_S = 60;
const SESSION_NOTES_REVALIDATE_S = 60;

type SessionNoteResponse = {
  note: SessionNoteDTO | null;
};

type BatchSessionNotesResponse = {
  notesByAppointmentId: Record<string, SessionNoteDTO>;
};

async function getCookieHeader() {
  const cookieStore = await cookies();
  const serialized = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  return serialized || undefined;
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return normalizeBaseUrl(appUrl);
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return normalizeBaseUrl(`https://${vercelUrl}`);
  }

  throw new Error(
    "Missing app base URL. Set NEXT_PUBLIC_APP_URL (or provide VERCEL_URL in deployed environments).",
  );
}

async function fetchAuthedJson<T>(
  path: string,
  options: {
    revalidate: number;
    tags: string[];
    notFoundValue?: T;
  },
): Promise<T> {
  const appUrl = getAppUrl();
  const url = `${appUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const cookieHeader = await getCookieHeader();

  const response = await fetch(url, {
    cache: "force-cache",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    next: {
      revalidate: options.revalidate,
      tags: options.tags,
    },
  });

  if (response.status === 404 && options.notFoundValue !== undefined) {
    return options.notFoundValue;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed: ${path}`);
  }

  return (await response.json()) as T;
}

export function appointmentsListTag(role: SessionRole, authUserId: string) {
  return `appointments:list:${role}:${authUserId}`;
}

export function appointmentTag(appointmentId: string) {
  return `appointment:${appointmentId}`;
}

export function sessionNotesTag(appointmentId: string) {
  return `session-notes:${appointmentId}`;
}

export function getAppointmentsByUserCached(
  role: SessionRole,
  authUserId: string,
): Promise<AppointmentDTO[]> {
  return fetchAuthedJson<AppointmentDTO[]>("/api/appointments", {
    revalidate: APPOINTMENTS_REVALIDATE_S,
    tags: [appointmentsListTag(role, authUserId)],
  });
}

export function getAppointmentByIdCached(
  role: SessionRole,
  authUserId: string,
  appointmentId: string,
): Promise<AppointmentDTO | null> {
  return fetchAuthedJson<AppointmentDTO | null>(`/api/appointments/${appointmentId}`, {
    revalidate: APPOINTMENT_DETAILS_REVALIDATE_S,
    tags: [appointmentsListTag(role, authUserId), appointmentTag(appointmentId)],
    notFoundValue: null,
  });
}

export function getSessionNoteCached(
  role: SessionRole,
  authUserId: string,
  appointmentId: string,
): Promise<SessionNoteDTO | null> {
  return fetchAuthedJson<SessionNoteResponse>(`/api/appointments/${appointmentId}/notes`, {
    revalidate: SESSION_NOTES_REVALIDATE_S,
    tags: [sessionNotesTag(appointmentId)],
  }).then((payload) => payload.note ?? null);
}

export async function listSessionNotesByAppointmentIdsCached(
  role: SessionRole,
  authUserId: string,
  appointmentIds: string[],
): Promise<Map<string, SessionNoteDTO>> {
  const uniqueIds = [...new Set(appointmentIds)].sort();
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const params = new URLSearchParams({ ids: uniqueIds.join(",") });
  const payload = await fetchAuthedJson<BatchSessionNotesResponse>(
    `/api/appointments/notes-batch?${params.toString()}`,
    {
      revalidate: SESSION_NOTES_REVALIDATE_S,
      tags: [appointmentsListTag(role, authUserId), ...uniqueIds.map(sessionNotesTag)],
    },
  );

  return new Map(Object.entries(payload.notesByAppointmentId));
}