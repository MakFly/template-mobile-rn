import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { z } from 'zod';

import { ConversationService } from '../application/conversations';
import { DomainError } from '../domain/models';

type Variables = { installationId: string };

const installationSchema = z.uuid();
const threadIdSchema = z.uuid();
const messageSchema = z.object({
  parent_id: z.string().nullable(),
  format: z.string().min(1).max(120),
  content: z.record(z.string(), z.unknown()),
});

function threadDto(thread: ReturnType<ConversationService['getThread']>) {
  return {
    id: thread.id,
    remoteId: thread.id,
    title: thread.title,
    status: thread.status,
    createdAt: new Date(thread.createdAt).toISOString(),
    updatedAt: new Date(thread.updatedAt).toISOString(),
    lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt).toISOString() : null,
  };
}

export function createHttpApp(service: ConversationService, corsOrigins: string[]) {
  const app = new Hono<{ Variables: Variables }>();
  app.use('*', requestId());
  app.use(
    '*',
    cors({
      origin: (origin) => (corsOrigins.includes(origin) ? origin : corsOrigins[0] || ''),
      allowHeaders: ['Content-Type', 'X-Installation-Id', 'Upgrade-Insecure-Requests'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use('*', async (c, next) => {
    // Chromium's Private Network Access preflight is stricter for local web
    // clients (for example Expo Web on localhost talking to 127.0.0.1).
    c.header('Access-Control-Allow-Private-Network', 'true');
    await next();
  });
  app.use('*', bodyLimit({ maxSize: 12 * 1024 * 1024 }));

  app.get('/health', (c) => c.json({ ok: true, modelConfigured: service.modelConfigured() }));

  app.use('/v1/*', async (c, next) => {
    const parsed = installationSchema.safeParse(c.req.header('x-installation-id'));
    if (!parsed.success) {
      return c.json(
        { error: { code: 'INVALID_INSTALLATION', message: 'Valid installation ID required' } },
        400,
      );
    }
    c.set('installationId', parsed.data);
    await next();
  });

  app.get('/v1/threads', (c) => {
    const status = c.req.query('status') === 'archived' ? 'archived' : 'regular';
    const after = c.req.query('after');
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 30), 1), 100);
    const page = service.listThreads(c.get('installationId'), status, after, limit);
    return c.json({ items: page.items.map(threadDto), nextCursor: page.nextCursor });
  });

  app.post('/v1/threads', (c) => {
    const thread = service.createThread(c.get('installationId'));
    return c.json(threadDto(thread), 201);
  });

  app.get('/v1/threads/:threadId', (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    return c.json(threadDto(service.getThread(c.get('installationId'), threadId)));
  });

  app.patch('/v1/threads/:threadId', async (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    const body = z
      .object({
        title: z.string().trim().min(1).max(120).optional(),
        status: z.enum(['regular', 'archived']).optional(),
      })
      .refine((value) => value.title !== undefined || value.status !== undefined)
      .parse(await c.req.json());
    return c.json(threadDto(service.updateThread(c.get('installationId'), threadId, body)));
  });

  app.delete('/v1/threads/:threadId', (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    service.deleteThread(c.get('installationId'), threadId);
    return c.body(null, 204);
  });

  app.post('/v1/threads/:threadId/title', async (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    const { messages } = z
      .object({ messages: z.array(z.unknown()).max(20) })
      .parse(await c.req.json());
    const title = await service.generateTitle(c.get('installationId'), threadId, messages);
    return c.json({ title });
  });

  app.get('/v1/threads/:threadId/messages', (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    const messages = service.listMessages(c.get('installationId'), threadId);
    return c.json({
      headId: messages.at(-1)?.id ?? null,
      items: messages.map((message) => ({
        id: message.id,
        parent_id: message.parentId,
        format: message.format,
        content: message.content,
      })),
    });
  });

  app.put('/v1/threads/:threadId/messages/:messageId', async (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    const messageId = z.string().min(1).max(200).parse(c.req.param('messageId'));
    const body = messageSchema.parse(await c.req.json());
    service.upsertMessage(c.get('installationId'), threadId, {
      id: messageId,
      parentId: body.parent_id,
      format: body.format,
      content: body.content,
    });
    return c.body(null, 204);
  });

  app.delete('/v1/threads/:threadId/messages/:messageId', (c) => {
    const threadId = threadIdSchema.parse(c.req.param('threadId'));
    const messageId = z.string().min(1).max(200).parse(c.req.param('messageId'));
    service.deleteMessage(c.get('installationId'), threadId, messageId);
    return c.body(null, 204);
  });

  app.post('/v1/chat', async (c) => {
    const body = z
      .object({ id: z.uuid(), messages: z.array(z.unknown()).max(200) })
      .passthrough()
      .parse(await c.req.json());
    return service.streamChat(c.get('installationId'), body.id, body.messages, c.req.raw.signal);
  });

  app.onError((error, c) => {
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } }, 400);
    }
    if (error instanceof DomainError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'MODEL_NOT_CONFIGURED' ? 503 : 400;
      return c.json({ error: { code: error.code, message: error.message } }, status);
    }
    console.error(`[api] ${c.get('requestId')} unhandled request failure`, error);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } }, 500);
  });

  return app;
}
