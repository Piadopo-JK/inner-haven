export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

export type ApiErrorPayload = {
  error?: string;
};

export class AuthExpiredError extends Error {
  readonly status = 401;

  constructor(message = SESSION_EXPIRED_MESSAGE) {
    super(message);
    this.name = "AuthExpiredError";
  }
}

export function isAuthExpiredError(error: unknown): error is AuthExpiredError {
  return error instanceof AuthExpiredError;
}

export async function readResponsePayload<T>(response: Response) {
  return (await response.json().catch(() => null)) as (T & ApiErrorPayload) | null;
}

export function createApiError(
  response: Pick<Response, "status">,
  fallbackMessage: string,
  payload?: ApiErrorPayload | null,
) {
  const message =
    payload?.error ??
    (response.status === 401 ? SESSION_EXPIRED_MESSAGE : fallbackMessage);

  if (response.status === 401) {
    return new AuthExpiredError(message);
  }

  return new Error(message);
}

export async function readJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
) {
  const payload = await readResponsePayload<T>(response);

  if (!response.ok) {
    throw createApiError(response, fallbackMessage, payload);
  }

  return payload as T;
}

export async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  return readJsonResponse<T>(response, `Request failed: ${url}`);
}