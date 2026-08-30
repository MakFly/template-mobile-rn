import type { StoredMessage, Thread, ThreadStatus } from '../domain/models';

export interface ThreadPage {
  items: Thread[];
  nextCursor?: string;
}

export interface ThreadRepository {
  create(installationId: string): Thread;
  get(installationId: string, threadId: string): Thread | null;
  list(
    installationId: string,
    options: { status: ThreadStatus; after?: string; limit: number },
  ): ThreadPage;
  rename(installationId: string, threadId: string, title: string): Thread | null;
  setStatus(installationId: string, threadId: string, status: ThreadStatus): Thread | null;
  touch(installationId: string, threadId: string, at: number): void;
  delete(installationId: string, threadId: string): boolean;
}

export interface MessageRepository {
  list(installationId: string, threadId: string): StoredMessage[] | null;
  upsert(installationId: string, message: StoredMessage): boolean;
  delete(installationId: string, threadId: string, messageId: string): boolean;
}

export interface ChatModel {
  readonly configured: boolean;
  stream(messages: unknown[], signal?: AbortSignal): Promise<Response>;
  generateTitle(messages: unknown[]): Promise<string>;
}
