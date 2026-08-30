export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMetadata = Record<string, unknown>;

export interface LoggerTransport {
  write(level: LogLevel, line: string): void;
}

export interface Logger {
  child(scope: string): Logger;
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}

export interface CreateLoggerOptions {
  scope?: string;
  minLevel?: LogLevel;
  color?: boolean;
  transport?: LoggerTransport;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: '\u001b[36m',
  info: '\u001b[34m',
  warn: '\u001b[33m',
  error: '\u001b[31m',
};

const ANSI_RESET = '\u001b[0m';
const MAX_STRING_LENGTH = 500;
const SENSITIVE_KEY = /authorization|cookie|password|secret|token/i;

const consoleTransport: LoggerTransport = {
  write(level, line) {
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else if (level === 'info') {
      console.info(line);
    } else {
      console.debug(line);
    }
  },
};

function truncate(value: string): string {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
    : value;
}

function sanitize(value: unknown, seen: WeakSet<object>, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return '[REDACTED]';
  if (typeof value === 'string') return truncate(value);
  if (value instanceof Error) return { name: value.name, message: truncate(value.message) };
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitize(entryValue, seen, entryKey),
    ]),
  );
}

function formatMetadata(metadata?: LogMetadata): string {
  if (!metadata || Object.keys(metadata).length === 0) return '';
  try {
    return ` ${JSON.stringify(sanitize(metadata, new WeakSet()))}`;
  } catch {
    return ' {"metadata":"[Unserializable]"}';
  }
}

class AppLogger implements Logger {
  constructor(
    private readonly scope: string | undefined,
    private readonly minLevel: LogLevel,
    private readonly color: boolean,
    private readonly transport: LoggerTransport,
  ) {}

  child(scope: string): Logger {
    const childScope = this.scope ? `${this.scope}:${scope}` : scope;
    return new AppLogger(childScope, this.minLevel, this.color, this.transport);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) return;

    const label = `[${level.toUpperCase()}]`;
    const prefix = this.scope ? `${label} [${this.scope}]` : label;
    const renderedPrefix = this.color ? `${LEVEL_COLOR[level]}${prefix}${ANSI_RESET}` : prefix;
    this.transport.write(level, `${renderedPrefix} ${message}${formatMetadata(metadata)}`);
  }
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  return new AppLogger(
    options.scope,
    options.minLevel ?? (__DEV__ ? 'debug' : 'warn'),
    options.color ?? __DEV__,
    options.transport ?? consoleTransport,
  );
}

/** App-wide logger. Use child scopes instead of embedding feature prefixes in messages. */
export const logger = createLogger({ scope: 'app' });
