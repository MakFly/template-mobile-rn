import {
  ConfigurationException,
  HttpException,
  NetworkException,
  RequestAbortedException,
  ResponseParseException,
} from '../errors';
import { createQueryClient } from '../query-client';

describe('query retry policy', () => {
  it('retries transient failures at most twice', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');
    if (typeof retry !== 'function') throw new Error('Expected a retry function');

    expect(retry(0, new NetworkException('offline'))).toBe(true);
    expect(retry(1, new HttpException('server error', { status: 503 }))).toBe(true);
    expect(retry(2, new NetworkException('offline'))).toBe(false);
  });

  it('does not retry deterministic or caller-controlled failures', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry;
    if (typeof retry !== 'function') throw new Error('Expected a retry function');

    expect(retry(0, new HttpException('not found', { status: 404 }))).toBe(false);
    expect(retry(0, new ConfigurationException('missing URL'))).toBe(false);
    expect(retry(0, new RequestAbortedException('cancelled'))).toBe(false);
    expect(
      retry(0, new ResponseParseException('invalid payload', { status: 200, reason: 'schema' })),
    ).toBe(false);
  });
});
