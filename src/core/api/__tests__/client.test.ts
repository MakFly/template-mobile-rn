import { z } from 'zod';

import { env } from '@/core/env';

import { apiFetch } from '../client';
import {
  ConfigurationException,
  HttpException,
  NetworkException,
  RequestAbortedException,
  ResponseParseException,
  TimeoutException,
} from '../errors';

const ItemSchema = z.object({ id: z.number() });

interface FakeResponseOptions {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}

function fakeResponse(options: FakeResponseOptions): Response {
  return {
    ok: options.ok,
    status: options.status,
    json: options.json ?? (() => Promise.resolve(undefined)),
    text: options.text ?? (() => Promise.resolve('')),
  } as Response;
}

function abortableFetch(): jest.MockedFunction<typeof fetch> {
  return jest.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted by test')));
    });
  }) as unknown as jest.MockedFunction<typeof fetch>;
}

describe('apiFetch', () => {
  const originalApiUrl = env.EXPO_PUBLIC_API_URL;
  const originalFetch = globalThis.fetch;
  let consoleDebug: jest.SpyInstance;
  let consoleWarn: jest.SpyInstance;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
    consoleDebug = jest.spyOn(console, 'debug').mockImplementation();
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    consoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
    consoleDebug.mockRestore();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  afterAll(() => {
    env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('returns validated data and serializes a JSON request', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(fakeResponse({ ok: true, status: 200, json: async () => ({ id: 7 }) }));
    globalThis.fetch = fetchMock;

    await expect(
      apiFetch('/items', ItemSchema, { method: 'POST', body: { name: 'test' } }),
    ).resolves.toEqual({ id: 7 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
      }),
    );
  });

  it.each([
    ['JSON', '{"message":"missing"}', { message: 'missing' }],
    ['text', 'temporarily unavailable', 'temporarily unavailable'],
  ])('keeps a %s error body in HttpException', async (_kind, body, expected) => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(fakeResponse({ ok: false, status: 404, text: async () => body }));

    const promise = apiFetch('/items/404?token=private', ItemSchema);
    await expect(promise).rejects.toMatchObject({
      code: 'http',
      status: 404,
      body: expected,
      request: { method: 'GET', path: '/items/404?token=private' },
    });
    await expect(promise).rejects.toBeInstanceOf(HttpException);
    expect(consoleWarn).not.toHaveBeenCalledWith(expect.stringContaining('private'));
    expect(consoleWarn).not.toHaveBeenCalledWith(expect.stringContaining(body));
  });

  it('normalizes a fetch rejection as NetworkException', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('socket closed'));

    await expect(apiFetch('/items', ItemSchema)).rejects.toBeInstanceOf(NetworkException);
  });

  it('distinguishes invalid JSON from a schema mismatch', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        fakeResponse({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('invalid json');
          },
        }),
      )
      .mockResolvedValueOnce(
        fakeResponse({ ok: true, status: 200, json: async () => ({ id: 'wrong' }) }),
      );

    await expect(apiFetch('/invalid-json', ItemSchema)).rejects.toMatchObject({
      code: 'response_parse',
      reason: 'json',
    });
    const schemaPromise = apiFetch('/invalid-schema', ItemSchema);
    await expect(schemaPromise).rejects.toMatchObject({
      code: 'response_parse',
      reason: 'schema',
    });
    await expect(schemaPromise).rejects.toBeInstanceOf(ResponseParseException);
  });

  it('rejects an already-aborted external signal without calling fetch', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    await expect(
      apiFetch('/items', ItemSchema, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(RequestAbortedException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('distinguishes an in-flight external cancellation from a timeout', async () => {
    const controller = new AbortController();
    globalThis.fetch = abortableFetch();

    const promise = apiFetch('/items', ItemSchema, { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(RequestAbortedException);
  });

  it('raises TimeoutException with the configured duration', async () => {
    jest.useFakeTimers();
    globalThis.fetch = abortableFetch();

    const promise = apiFetch('/slow', ItemSchema, { timeoutMs: 25 });
    const rejection = promise.catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(25);

    const error = await rejection;
    expect(error).toMatchObject({ code: 'timeout', timeoutMs: 25 });
    expect(error).toBeInstanceOf(TimeoutException);
  });

  it('fails closed when the API URL is missing', async () => {
    env.EXPO_PUBLIC_API_URL = undefined;
    globalThis.fetch = jest.fn();

    await expect(apiFetch('/items', ItemSchema)).rejects.toBeInstanceOf(ConfigurationException);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
