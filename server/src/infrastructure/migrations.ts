export const migrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        installation_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('regular', 'archived')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_message_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS threads_owner_status_updated
        ON threads (installation_id, status, updated_at DESC, id DESC);

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        parent_id TEXT,
        format TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS messages_thread_created
        ON messages (thread_id, created_at ASC, id ASC);
    `,
  },
] as const;
