import { createLogger, type LogLevel, type LoggerTransport } from '@/core/logger';

function createCaptureTransport() {
  const entries: { level: LogLevel; line: string }[] = [];
  const transport: LoggerTransport = {
    write(level, line) {
      entries.push({ level, line });
    },
  };
  return { entries, transport };
}

describe('logger', () => {
  it('renders scoped ASCII logs with ANSI colors in development mode', () => {
    const { entries, transport } = createCaptureTransport();
    const logger = createLogger({ scope: 'app', minLevel: 'debug', color: true, transport });

    logger.child('http').debug('#12 --> GET /posts', { durationMs: 4 });

    expect(entries).toEqual([
      {
        level: 'debug',
        line: '\u001b[36m[DEBUG] [app:http]\u001b[0m #12 --> GET /posts {"durationMs":4}',
      },
    ]);
  });

  it('keeps only warn and error when configured for production', () => {
    const { entries, transport } = createCaptureTransport();
    const logger = createLogger({ minLevel: 'warn', color: false, transport });

    logger.debug('hidden');
    logger.info('hidden');
    logger.warn('visible');
    logger.error('also visible');

    expect(entries.map(({ level, line }) => ({ level, line }))).toEqual([
      { level: 'warn', line: '[WARN] visible' },
      { level: 'error', line: '[ERROR] also visible' },
    ]);
  });

  it('redacts sensitive metadata, truncates strings, and handles cycles', () => {
    const { entries, transport } = createCaptureTransport();
    const logger = createLogger({ minLevel: 'debug', color: false, transport });
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    logger.error('safe', {
      accessToken: 'secret-value',
      nested: { authorization: 'Bearer secret' },
      long: 'x'.repeat(600),
      circular,
    });

    const line = entries[0]?.line ?? '';
    expect(line).not.toContain('secret-value');
    expect(line).not.toContain('Bearer secret');
    expect(line).toContain('[REDACTED]');
    expect(line).toContain('[truncated]');
    expect(line).toContain('[Circular]');
  });
});
