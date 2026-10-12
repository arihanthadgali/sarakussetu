import type { z } from 'zod';

import { env } from '@/config/env';

import { ApiError, GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE, messageFromBody } from './errors';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RequestOptions<T> = {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the stored bearer token. */
  auth?: boolean;
  /** Runtime check of the response shape; drift from the backend becomes an ApiError. */
  schema?: z.ZodType<T>;
  timeoutMs?: number;
};

type AuthHooks = {
  getToken: () => string | null;
  /** Called once for any authenticated request that returns 401. */
  onUnauthorized: () => void;
};

let authHooks: AuthHooks = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

/** Wired up by the session store so the client never imports it (no cycle). */
export function configureApiAuth(hooks: AuthHooks): void {
  authHooks = hooks;
}

export type Fetcher = typeof fetch;
let fetcher: Fetcher = (...args) => fetch(...args);

/** Test seam. */
export function setFetcher(next: Fetcher): void {
  fetcher = next;
}

export async function apiRequest<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = 'GET', body, auth = false, schema, timeoutMs = env.requestTimeoutMs } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = authHooks.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetcher(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError({
      kind: aborted ? 'timeout' : 'network',
      message: NETWORK_ERROR_MESSAGE,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const parsed = messageFromBody(await readJson(response));
    if (response.status === 401 && auth) authHooks.onUnauthorized();
    throw new ApiError({
      kind: 'http',
      status: response.status,
      code: parsed.code,
      message: parsed.message ?? GENERIC_ERROR_MESSAGE,
    });
  }

  if (response.status === 204) return undefined as T;

  const data = await readJson(response);
  if (!schema) return data as T;

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError({
      kind: 'invalid_response',
      status: response.status,
      message: GENERIC_ERROR_MESSAGE,
    });
  }
  return result.data;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
