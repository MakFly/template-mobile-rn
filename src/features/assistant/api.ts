import { Platform } from 'react-native';
import { z } from 'zod';

import { env } from '@/core/env';
import { HttpException, NetworkException, ResponseParseException } from '@/core/api/errors';
import { getInstallationId } from '@/features/assistant/installation';

const threadSchema = z.object({
  id: z.string(),
  remoteId: z.string(),
  title: z.string(),
  status: z.enum(['regular', 'archived']),
  updatedAt: z.iso.datetime(),
  lastMessageAt: z.iso.datetime().nullable(),
});

const threadPageSchema = z.object({
  items: z.array(threadSchema),
  nextCursor: z.string().optional(),
});

const historySchema = z.object({
  headId: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      parent_id: z.string().nullable(),
      format: z.string(),
      content: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type AssistantThreadDto = z.infer<typeof threadSchema>;
export type AssistantHistoryDto = z.infer<typeof historySchema>;

export function getAssistantApiUrl() {
  if (env.EXPO_PUBLIC_ASSISTANT_API_URL) {
    return env.EXPO_PUBLIC_ASSISTANT_API_URL.replace(/\/+$/, '');
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';
}

export function getChatEndpoint() {
  return env.EXPO_PUBLIC_CHAT_ENDPOINT_URL ?? `${getAssistantApiUrl()}/v1/chat`;
}

export function assistantHeaders() {
  return { 'x-installation-id': getInstallationId() };
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${getAssistantApiUrl()}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init.body !== undefined && { 'content-type': 'application/json' }),
        ...assistantHeaders(),
        ...init.headers,
      },
    });
  } catch (cause) {
    throw new NetworkException(`Assistant request failed: ${path}`, { cause });
  }
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const message =
      response.status === 404
        ? `API assistant introuvable sur ${getAssistantApiUrl()}. Lancez \`make api\` (port 3333), puis redémarrez Expo.`
        : `Assistant request failed with status ${response.status}`;
    throw new HttpException(message, {
      status: response.status,
      body,
    });
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new ResponseParseException('Assistant response is not JSON', {
      status: response.status,
      reason: 'json',
      cause,
    });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ResponseParseException('Assistant response has an invalid shape', {
      status: response.status,
      reason: 'schema',
      cause: parsed.error,
    });
  }
  return parsed.data;
}

export async function assistantTransportFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status !== 404 && response.status !== 503) return response;

  return new Response(
    response.status === 404
      ? `API assistant introuvable sur ${getAssistantApiUrl()}. Lancez make api (port 3333), puis réessayez.`
      : 'API connectée, mais OpenAI n’est pas configuré. Ajoutez OPENAI_API_KEY dans server/.env puis relancez make api.',
    {
      status: 502,
      statusText: response.status === 404 ? 'Assistant API unavailable' : 'AI model unavailable',
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    },
  );
}

async function mutate(path: string, method: 'PUT' | 'PATCH' | 'DELETE', body?: unknown) {
  let response: Response;
  try {
    response = await fetch(`${getAssistantApiUrl()}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...assistantHeaders(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new NetworkException(`Assistant request failed: ${path}`, { cause });
  }
  if (!response.ok) {
    const message =
      response.status === 404
        ? `API assistant introuvable sur ${getAssistantApiUrl()}. Lancez \`make api\` (port 3333), puis redémarrez Expo.`
        : `Assistant request failed with status ${response.status}`;
    throw new HttpException(message, {
      status: response.status,
    });
  }
}

export const assistantApi = {
  listThreads: (after?: string) =>
    request(`/v1/threads${after ? `?after=${encodeURIComponent(after)}` : ''}`, threadPageSchema),
  listArchivedThreads: () => request('/v1/threads?status=archived&limit=100', threadPageSchema),
  createThread: () => request('/v1/threads', threadSchema, { method: 'POST' }),
  getThread: (id: string) => request(`/v1/threads/${id}`, threadSchema),
  updateThread: (id: string, changes: { title?: string; status?: 'regular' | 'archived' }) =>
    request(`/v1/threads/${id}`, threadSchema, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(changes),
    }),
  deleteThread: (id: string) => mutate(`/v1/threads/${id}`, 'DELETE'),
  generateTitle: (id: string, messages: readonly unknown[]) =>
    request(`/v1/threads/${id}/title`, z.object({ title: z.string() }), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages }),
    }),
  loadHistory: (id: string) => request(`/v1/threads/${id}/messages`, historySchema),
  upsertMessage: (
    threadId: string,
    messageId: string,
    body: { parent_id: string | null; format: string; content: Record<string, unknown> },
  ) => mutate(`/v1/threads/${threadId}/messages/${encodeURIComponent(messageId)}`, 'PUT', body),
  deleteMessage: (threadId: string, messageId: string) =>
    mutate(`/v1/threads/${threadId}/messages/${encodeURIComponent(messageId)}`, 'DELETE'),
};
