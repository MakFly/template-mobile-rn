import { z } from 'zod';

import { env } from '@/core/env';

import { ApiError } from './errors';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  /** JSON-serialized request body. */
  body?: unknown;
  /** Per-request timeout; defaults to 10s. */
  timeoutMs?: number;
  /** External cancellation (e.g. TanStack Query's signal). */
  signal?: AbortSignal;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * Thin fetch wrapper: base URL from validated env, 10s timeout, every failure
 * normalized to `ApiError`, response validated against the given zod schema.
 *
 * Never call this when `env.EXPO_PUBLIC_API_URL` is unset — feature APIs are
 * expected to branch to their local mocks in that case (throws 'config' here).
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const baseUrl = env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new ApiError(
      'config',
      'EXPO_PUBLIC_API_URL is not set: apiFetch is unavailable, use local mocks instead.',
    );
  }

  const { method = 'GET', headers, body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  try {
    let response: Response;
    try {
      response = await fetch(joinUrl(baseUrl, path), {
        method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined && { 'content-type': 'application/json' }),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (cause) {
      if (signal?.aborted) {
        throw new ApiError('aborted', `Request aborted: ${method} ${path}`, { cause });
      }
      if (controller.signal.aborted) {
        throw new ApiError('timeout', `Request timed out after ${timeoutMs}ms: ${method} ${path}`, {
          cause,
        });
      }
      throw new ApiError('network', `Network request failed: ${method} ${path}`, { cause });
    }

    if (!response.ok) {
      throw new ApiError(
        'http',
        `Request failed with status ${response.status}: ${method} ${path}`,
        {
          status: response.status,
        },
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (cause) {
      throw new ApiError('parse', `Response is not valid JSON: ${method} ${path}`, {
        status: response.status,
        cause,
      });
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError(
        'parse',
        `Unexpected response shape for ${method} ${path}:\n${z.prettifyError(parsed.error)}`,
        { status: response.status, cause: parsed.error },
      );
    }

    return parsed.data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
