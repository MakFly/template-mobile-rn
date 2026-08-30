import { afterEach, describe, expect, it } from 'bun:test';

import { createApp } from '../src/app';

const installationA = '76fdfbcb-8046-4d49-b0e7-61b83e559486';
const installationB = 'e746e23d-b17d-4cf4-b1ad-a1015b8cb743';
const databases: Array<{ close: () => void }> = [];

function setup() {
  const result = createApp({ databasePath: ':memory:', corsOrigins: ['http://localhost:8081'] });
  databases.push(result.database);
  const request = (path: string, init: RequestInit = {}, installationId = installationA) =>
    result.app.request(path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-installation-id': installationId,
        ...init.headers,
      },
    });
  return { ...result, request };
}

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

describe('conversation API', () => {
  it('persists, renames, archives and isolates a conversation', async () => {
    const { request } = setup();
    const created = await request('/v1/threads', { method: 'POST' });
    expect(created.status).toBe(201);
    const thread = (await created.json()) as { id: string };

    await request(`/v1/threads/${thread.id}/messages/user-1`, {
      method: 'PUT',
      body: JSON.stringify({ parent_id: null, format: 'ai-sdk/v1', content: { text: 'Bonjour' } }),
    });
    const history = await request(`/v1/threads/${thread.id}/messages`);
    expect(((await history.json()) as { items: unknown[] }).items).toHaveLength(1);

    const renamed = await request(`/v1/threads/${thread.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Plan produit', status: 'archived' }),
    });
    expect((await renamed.json()).title).toBe('Plan produit');
    const archived = await request('/v1/threads?status=archived');
    expect(((await archived.json()) as { items: unknown[] }).items).toHaveLength(1);
    expect((await request(`/v1/threads/${thread.id}`, {}, installationB)).status).toBe(404);
  });

  it('fails closed when OpenAI is absent', async () => {
    const { request } = setup();
    const thread = (await (await request('/v1/threads', { method: 'POST' })).json()) as {
      id: string;
    };
    const response = await request('/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ id: thread.id, messages: [] }),
    });
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('MODEL_NOT_CONFIGURED');
  });

  it('requires a valid installation id', async () => {
    const { app } = setup();
    const response = await app.request('/v1/threads');
    expect(response.status).toBe(400);
  });
});
