import { DomainError, type StoredMessage, type ThreadStatus } from '../domain/models';
import type { ChatModel, MessageRepository, ThreadRepository } from './ports';

export class ConversationService {
  constructor(
    private readonly threads: ThreadRepository,
    private readonly messages: MessageRepository,
    private readonly model: ChatModel,
  ) {}

  modelConfigured() {
    return this.model.configured;
  }

  createThread(installationId: string) {
    return this.threads.create(installationId);
  }

  listThreads(installationId: string, status: ThreadStatus, after?: string, limit = 30) {
    return this.threads.list(installationId, { status, after, limit });
  }

  getThread(installationId: string, threadId: string) {
    const thread = this.threads.get(installationId, threadId);
    if (!thread) throw new DomainError('Conversation not found', 'NOT_FOUND');
    return thread;
  }

  updateThread(
    installationId: string,
    threadId: string,
    changes: { title?: string; status?: ThreadStatus },
  ) {
    let thread = this.getThread(installationId, threadId);
    if (changes.title !== undefined) {
      thread = this.threads.rename(installationId, threadId, changes.title) ?? thread;
    }
    if (changes.status !== undefined) {
      thread = this.threads.setStatus(installationId, threadId, changes.status) ?? thread;
    }
    return thread;
  }

  deleteThread(installationId: string, threadId: string) {
    if (!this.threads.delete(installationId, threadId)) {
      throw new DomainError('Conversation not found', 'NOT_FOUND');
    }
  }

  listMessages(installationId: string, threadId: string) {
    this.getThread(installationId, threadId);
    return this.messages.list(installationId, threadId) ?? [];
  }

  upsertMessage(
    installationId: string,
    threadId: string,
    input: Omit<StoredMessage, 'threadId' | 'createdAt'>,
  ) {
    this.getThread(installationId, threadId);
    const now = Date.now();
    const saved = this.messages.upsert(installationId, {
      ...input,
      threadId,
      createdAt: now,
    });
    if (!saved) throw new DomainError('Conversation not found', 'NOT_FOUND');
    this.threads.touch(installationId, threadId, now);
  }

  deleteMessage(installationId: string, threadId: string, messageId: string) {
    this.getThread(installationId, threadId);
    this.messages.delete(installationId, threadId, messageId);
  }

  async generateTitle(installationId: string, threadId: string, messages: unknown[]) {
    this.getThread(installationId, threadId);
    let title: string;
    try {
      title = this.model.configured
        ? await this.model.generateTitle(messages)
        : this.fallbackTitle(messages);
    } catch {
      title = this.fallbackTitle(messages);
    }
    return this.updateThread(installationId, threadId, { title }).title;
  }

  async streamChat(
    installationId: string,
    threadId: string,
    messages: unknown[],
    signal?: AbortSignal,
  ) {
    this.getThread(installationId, threadId);
    if (!this.model.configured) {
      throw new DomainError('OpenAI is not configured on the server', 'MODEL_NOT_CONFIGURED');
    }
    return this.model.stream(messages, signal);
  }

  private fallbackTitle(messages: unknown[]) {
    const serialized = JSON.stringify(messages);
    const textMatch = serialized.match(/"text"\s*:\s*"([^"\\]{3,})/);
    const text = textMatch?.[1]?.trim() ?? 'Nouvelle discussion';
    return text.length > 58 ? `${text.slice(0, 57)}…` : text;
  }
}
