import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { MessageRepository, ThreadPage, ThreadRepository } from '../application/ports';
import { DomainError, type StoredMessage, type Thread, type ThreadStatus } from '../domain/models';
import { migrations } from './migrations';

interface ThreadRow {
  id: string;
  installation_id: string;
  title: string;
  status: ThreadStatus;
  created_at: number;
  updated_at: number;
  last_message_at: number | null;
}

interface MessageRow {
  id: string;
  thread_id: string;
  parent_id: string | null;
  format: string;
  content: string;
  created_at: number;
}

function toThread(row: ThreadRow): Thread {
  return {
    id: row.id,
    installationId: row.installation_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  };
}

function encodeCursor(thread: Thread) {
  return Buffer.from(JSON.stringify([thread.updatedAt, thread.id])).toString('base64url');
}

function decodeCursor(cursor: string): [number, string] {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      typeof value[0] !== 'number' ||
      typeof value[1] !== 'string'
    ) {
      throw new Error('Invalid cursor');
    }
    return [value[0], value[1]];
  } catch {
    throw new DomainError('Invalid pagination cursor', 'INVALID_CURSOR');
  }
}

export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path, { create: true, strict: true });
  database.run('PRAGMA foreign_keys = ON;');
  database.run('PRAGMA journal_mode = WAL;');
  database.run(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);',
  );
  const applied = new Set(
    database
      .query<{ version: number }, []>('SELECT version FROM schema_migrations')
      .all()
      .map((row) => row.version),
  );
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    const apply = database.transaction(() => {
      database.run(migration.sql);
      database
        .query('INSERT INTO schema_migrations (version, applied_at) VALUES ($version, $at)')
        .run({ version: migration.version, at: Date.now() });
    });
    apply.immediate();
  }
  return database;
}

export class SQLiteThreadRepository implements ThreadRepository {
  constructor(private readonly database: Database) {}

  create(installationId: string): Thread {
    const now = Date.now();
    const thread: Thread = {
      id: crypto.randomUUID(),
      installationId,
      title: 'Nouvelle discussion',
      status: 'regular',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
    };
    this.database
      .query<
        never,
        {
          id: string;
          installationId: string;
          title: string;
          status: ThreadStatus;
          createdAt: number;
          updatedAt: number;
        }
      >(
        `INSERT INTO threads
          (id, installation_id, title, status, created_at, updated_at, last_message_at)
         VALUES ($id, $installationId, $title, $status, $createdAt, $updatedAt, NULL)`,
      )
      .run(thread);
    return thread;
  }

  get(installationId: string, threadId: string): Thread | null {
    const row = this.database
      .query<ThreadRow, { installationId: string; threadId: string }>(
        'SELECT * FROM threads WHERE installation_id = $installationId AND id = $threadId',
      )
      .get({ installationId, threadId });
    return row ? toThread(row) : null;
  }

  list(
    installationId: string,
    options: { status: ThreadStatus; after?: string; limit: number },
  ): ThreadPage {
    const cursor = options.after ? decodeCursor(options.after) : undefined;
    const rows = this.database
      .query<
        ThreadRow,
        {
          installationId: string;
          status: ThreadStatus;
          cursorAt: number;
          cursorId: string;
          hasCursor: number;
          limit: number;
        }
      >(
        `SELECT * FROM threads
         WHERE installation_id = $installationId AND status = $status
           AND ($hasCursor = 0 OR updated_at < $cursorAt OR (updated_at = $cursorAt AND id < $cursorId))
         ORDER BY updated_at DESC, id DESC LIMIT $limit`,
      )
      .all({
        installationId,
        status: options.status,
        cursorAt: cursor?.[0] ?? 0,
        cursorId: cursor?.[1] ?? '',
        hasCursor: cursor ? 1 : 0,
        limit: options.limit + 1,
      });
    const hasMore = rows.length > options.limit;
    const items = rows.slice(0, options.limit).map(toThread);
    const last = items.at(-1);
    return { items, ...(hasMore && last ? { nextCursor: encodeCursor(last) } : {}) };
  }

  rename(installationId: string, threadId: string, title: string): Thread | null {
    this.database
      .query(
        `UPDATE threads SET title = $title, updated_at = $updatedAt
         WHERE installation_id = $installationId AND id = $threadId`,
      )
      .run({ title, updatedAt: Date.now(), installationId, threadId });
    return this.get(installationId, threadId);
  }

  setStatus(installationId: string, threadId: string, status: ThreadStatus): Thread | null {
    this.database
      .query(
        `UPDATE threads SET status = $status, updated_at = $updatedAt
         WHERE installation_id = $installationId AND id = $threadId`,
      )
      .run({ status, updatedAt: Date.now(), installationId, threadId });
    return this.get(installationId, threadId);
  }

  touch(installationId: string, threadId: string, at: number) {
    this.database
      .query(
        `UPDATE threads SET updated_at = $at, last_message_at = $at
         WHERE installation_id = $installationId AND id = $threadId`,
      )
      .run({ at, installationId, threadId });
  }

  delete(installationId: string, threadId: string) {
    return (
      this.database
        .query('DELETE FROM threads WHERE installation_id = $installationId AND id = $threadId')
        .run({ installationId, threadId }).changes > 0
    );
  }
}

export class SQLiteMessageRepository implements MessageRepository {
  constructor(private readonly database: Database) {}

  list(installationId: string, threadId: string): StoredMessage[] | null {
    const owner = this.database
      .query<{ found: number }, { installationId: string; threadId: string }>(
        `SELECT 1 AS found FROM threads
         WHERE installation_id = $installationId AND id = $threadId`,
      )
      .get({ installationId, threadId });
    if (!owner) return null;
    return this.database
      .query<MessageRow, { threadId: string }>(
        'SELECT * FROM messages WHERE thread_id = $threadId ORDER BY created_at ASC, id ASC',
      )
      .all({ threadId })
      .map((row) => ({
        id: row.id,
        threadId: row.thread_id,
        parentId: row.parent_id,
        format: row.format,
        content: JSON.parse(row.content) as Record<string, unknown>,
        createdAt: row.created_at,
      }));
  }

  upsert(installationId: string, message: StoredMessage) {
    const owner = this.database
      .query<{ found: number }, { installationId: string; threadId: string }>(
        `SELECT 1 AS found FROM threads
         WHERE installation_id = $installationId AND id = $threadId`,
      )
      .get({ installationId, threadId: message.threadId });
    if (!owner) return false;
    this.database
      .query(
        `INSERT INTO messages (id, thread_id, parent_id, format, content, created_at)
         VALUES ($id, $threadId, $parentId, $format, $content, $createdAt)
         ON CONFLICT(id) DO UPDATE SET
           parent_id = excluded.parent_id,
           format = excluded.format,
           content = excluded.content`,
      )
      .run({ ...message, content: JSON.stringify(message.content) });
    return true;
  }

  delete(installationId: string, threadId: string, messageId: string) {
    return (
      this.database
        .query(
          `DELETE FROM messages WHERE id = $messageId AND thread_id = $threadId
           AND EXISTS (
             SELECT 1 FROM threads
             WHERE threads.id = messages.thread_id AND installation_id = $installationId
           )`,
        )
        .run({ installationId, threadId, messageId }).changes > 0
    );
  }
}
