import { uuid } from 'expo';
import { fetch } from 'expo/fetch';

/**
 * The one HTTP client. Everything that talks to the API goes through `request`, so the base
 * URL, headers, the bearer token and error shaping are decided in exactly one file.
 *
 * It holds no domain knowledge: no endpoints, no schemas, no feature types. It returns the
 * parsed JSON body as `unknown`; feature `api/` modules parse it with their Zod schemas.
 *
 * The API uses Sanctum personal access tokens, not the cookie/CSRF mode: a login hands back a
 * string that is replayed as `Authorization: Bearer …`.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/** Long enough for a slow mobile network, short enough that a dead server is reported. */
const TIMEOUT_MS = 15_000;

/** Shown when no answer arrived at all — the backend never had a chance to write a message. */
export const UNREACHABLE_MESSAGE = 'Server trenutno nije dostupan. Pokušajte ponovo.';

/**
 * A failed API call, normalised.
 *
 * Successful responses share one envelope; errors keep Laravel's shape, and 401/403/404 carry
 * only a `message`. Branch on `status`, never on the shape of the body. `message` is written by
 * the backend for the end user and is shown verbatim.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Field-level messages keyed by field name. Only ever present on a 422. */
  readonly errors: Record<string, string[]> | undefined;
  /** `X-Request-Id`, generated here so it exists even when no response arrives. */
  readonly requestId: string;

  constructor(
    status: number,
    message: string,
    requestId: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
    this.errors = errors;
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** The token sent with every request. Persisting it is the session's job, not this file's. */
export function setAuthToken(next: string | null): void {
  token = next;
}

/**
 * Called when a request that carried a token answers 401 — the token is dead (expired, logged
 * out elsewhere, account reset). A 401 without a token is a wrong password and is left to the
 * caller.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Sent as JSON — or as multipart/form-data when it is a `FormData` (file uploads). */
  body?: unknown;
}

export async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not set — copy .env.example to .env.local');
  }

  const requestId = uuid.v4();
  const sentToken = token;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Request-Id': requestId,
  };
  const isForm = options.body instanceof FormData;
  // A FormData body gets its multipart boundary from fetch itself; spelling the type out breaks it.
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (sentToken !== null) headers.Authorization = `Bearer ${sentToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    // No answer: network down, timeout, server not running.
    throw new ApiError(0, UNREACHABLE_MESSAGE, requestId);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) return null;

  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && sentToken !== null) onUnauthorized?.();

    const body = isRecord(payload) ? payload : {};
    throw new ApiError(
      response.status,
      typeof body.message === 'string' ? body.message : 'Došlo je do greške.',
      requestId,
      isFieldErrors(body.errors) ? body.errors : undefined
    );
  }

  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (messages) => Array.isArray(messages) && messages.every((m) => typeof m === 'string')
    )
  );
}
