export type ThreadStatus = 'regular' | 'archived';

export interface Thread {
  id: string;
  installationId: string;
  title: string;
  status: ThreadStatus;
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number | null;
}

export interface StoredMessage {
  id: string;
  threadId: string;
  parentId: string | null;
  format: string;
  content: Record<string, unknown>;
  createdAt: number;
}

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_CURSOR' | 'MODEL_NOT_CONFIGURED',
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
