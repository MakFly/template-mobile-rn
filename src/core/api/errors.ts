export type AppExceptionCode =
  'configuration' | 'network' | 'timeout' | 'aborted' | 'http' | 'response_parse';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Request metadata shared by every exception raised by the HTTP boundary. */
export interface HttpRequestContext {
  method: HttpMethod;
  path: string;
}

export interface AppExceptionOptions {
  cause?: unknown;
  request?: HttpRequestContext;
}

/** Base class for operational failures that the application can reason about. */
export class AppException extends Error {
  readonly code: AppExceptionCode;
  override readonly cause?: unknown;
  readonly request?: HttpRequestContext;

  constructor(code: AppExceptionCode, message: string, options: AppExceptionOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.cause = options.cause;
    this.request = options.request;
  }
}

export class ConfigurationException extends AppException {
  constructor(message: string, options: AppExceptionOptions = {}) {
    super('configuration', message, options);
  }
}

export class NetworkException extends AppException {
  constructor(message: string, options: AppExceptionOptions = {}) {
    super('network', message, options);
  }
}

export class TimeoutException extends AppException {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, options: AppExceptionOptions = {}) {
    super('timeout', message, options);
    this.timeoutMs = timeoutMs;
  }
}

export class RequestAbortedException extends AppException {
  constructor(message: string, options: AppExceptionOptions = {}) {
    super('aborted', message, options);
  }
}

export interface HttpExceptionOptions<TBody> extends AppExceptionOptions {
  status: number;
  body?: TBody;
}

/** A non-successful HTTP response. Its body is retained but never logged automatically. */
export class HttpException<TBody = unknown> extends AppException {
  readonly status: number;
  readonly body?: TBody;

  constructor(message: string, options: HttpExceptionOptions<TBody>) {
    super('http', message, options);
    this.status = options.status;
    this.body = options.body;
  }
}

export type ResponseParseReason = 'json' | 'schema';

export interface ResponseParseExceptionOptions extends AppExceptionOptions {
  status: number;
  reason: ResponseParseReason;
}

export class ResponseParseException extends AppException {
  readonly status: number;
  readonly reason: ResponseParseReason;

  constructor(message: string, options: ResponseParseExceptionOptions) {
    super('response_parse', message, options);
    this.status = options.status;
    this.reason = options.reason;
  }
}

export function isAppException(error: unknown): error is AppException {
  return error instanceof AppException;
}
