import { z } from 'zod';

import { env } from '@/core/env';
import { logger } from '@/core/logger';

import {
  ConfigurationException,
  HttpException,
  NetworkException,
  RequestAbortedException,
  ResponseParseException,
  TimeoutException,
  isAppException,
  type HttpMethod,
  type HttpRequestContext,
} from './errors';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface ApiFetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  /** JSON-serialized request body. */
  body?: unknown;
  /** Per-request timeout; defaults to 10s. */
  timeoutMs?: number;
  /** External cancellation (e.g. TanStack Query's signal). */
  signal?: AbortSignal;
}

const httpLogger = logger.child('http');
let nextRequestId = 1;

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function pathWithoutQuery(path: string): string {
  return path.split(/[?#]/, 1)[0] || '/';
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

/**
 * Thin fetch wrapper: base URL from validated env, timeout, typed operational
 * exceptions, safe lifecycle logs, and zod validation at the response boundary.
 *
 * Never call this when `env.EXPO_PUBLIC_API_URL` is unset — feature APIs are
 * expected to branch to their local mocks in that case.
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const baseUrl = env.EXPO_PUBLIC_API_URL;
  const { method = 'GET', headers, body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;
  const request: HttpRequestContext = { method, path };

  if (!baseUrl) {
    throw new ConfigurationException(
      'EXPO_PUBLIC_API_URL is not set: apiFetch is unavailable, use local mocks instead.',
      { request },
    );
  }

  const requestId = nextRequestId++;
  const safePath = pathWithoutQuery(path);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);
  httpLogger.debug(`#${requestId} --> ${method} ${safePath}`);

  try {
    if (signal?.aborted) {
      throw new RequestAbortedException(`Request aborted: ${method} ${path}`, { request });
    }

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
        throw new RequestAbortedException(`Request aborted: ${method} ${path}`, {
          cause,
          request,
        });
      }
      if (controller.signal.aborted) {
        throw new TimeoutException(
          `Request timed out after ${timeoutMs}ms: ${method} ${path}`,
          timeoutMs,
          { cause, request },
        );
      }
      throw new NetworkException(`Network request failed: ${method} ${path}`, { cause, request });
    }

    if (!response.ok) {
      throw new HttpException(`Request failed with status ${response.status}: ${method} ${path}`, {
        status: response.status,
        body: await readErrorBody(response),
        request,
      });
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (cause) {
      throw new ResponseParseException(`Response is not valid JSON: ${method} ${path}`, {
        status: response.status,
        reason: 'json',
        cause,
        request,
      });
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ResponseParseException(
        `Unexpected response shape for ${method} ${path}:\n${z.prettifyError(parsed.error)}`,
        { status: response.status, reason: 'schema', cause: parsed.error, request },
      );
    }

    httpLogger.debug(`#${requestId} <-- ${response.status} ${method} ${safePath}`, {
      durationMs: Date.now() - startedAt,
    });
    return parsed.data;
  } catch (error) {
    const exception = isAppException(error)
      ? error
      : new NetworkException(`Unexpected request failure: ${method} ${path}`, {
          cause: error,
          request,
        });
    const metadata = {
      code: exception.code,
      ...('status' in exception && typeof exception.status === 'number'
        ? { status: exception.status }
        : {}),
      durationMs: Date.now() - startedAt,
    };
    const message = `#${requestId} <x- ${method} ${safePath}`;

    if (exception.code === 'aborted') {
      httpLogger.debug(message, metadata);
    } else if (exception instanceof HttpException && exception.status < 500) {
      httpLogger.warn(message, metadata);
    } else {
      httpLogger.error(message, metadata);
    }
    throw exception;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
