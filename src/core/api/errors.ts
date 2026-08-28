/** Normalized failure categories for every request made through `apiFetch`. */
export type ApiErrorCode =
  /** No base URL configured (EXPO_PUBLIC_API_URL unset) — callers should use mocks. */
  | 'config'
  /** DNS/TLS/socket failure before an HTTP response was received. */
  | 'network'
  /** The 10s (or custom) timeout elapsed before the response arrived. */
  | 'timeout'
  /** The caller-provided AbortSignal cancelled the request. */
  | 'aborted'
  /** Non-2xx HTTP status. */
  | 'http'
  /** Body was not valid JSON or did not match the zod schema. */
  | 'parse';

/**
 * Single error type surfaced by the API layer. Consumers (query retry logic,
 * error views) can branch on `code`/`status` without string-matching messages.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** HTTP status when a response was received, undefined otherwise. */
  readonly status?: number;
  override readonly cause?: unknown;

  constructor(code: ApiErrorCode, message: string, options?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status;
    this.cause = options?.cause;
  }
}
