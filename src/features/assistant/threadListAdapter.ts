import { useMemo } from 'react';
import {
  useAui,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from '@assistant-ui/react-native';
import { createAssistantStream } from 'assistant-stream';

import { assistantApi } from '@/features/assistant/api';

function useThreadAdapters() {
  const aui = useAui();
  const history = useMemo<ThreadHistoryAdapter>(
    () => ({
      async load() {
        return { messages: [] };
      },
      async append() {},
      withFormat: (format) => ({
        async load() {
          const remoteId = aui.threadListItem.getState().remoteId;
          if (!remoteId) return { messages: [] };
          const result = await assistantApi.loadHistory(remoteId);
          return {
            headId: result.headId,
            messages: result.items.map((item) =>
              format.decode(item as Parameters<typeof format.decode>[0]),
            ),
          };
        },
        async append(item) {
          const { remoteId } = await aui.threadListItem.initialize();
          await assistantApi.upsertMessage(remoteId, format.getId(item.message), {
            parent_id: item.parentId,
            format: format.format,
            content: format.encode(item),
          });
        },
        async update(item, localMessageId) {
          const { remoteId } = await aui.threadListItem.initialize();
          await assistantApi.upsertMessage(remoteId, localMessageId, {
            parent_id: item.parentId,
            format: format.format,
            content: format.encode(item),
          });
        },
        async delete(items) {
          const remoteId = aui.threadListItem.getState().remoteId;
          if (!remoteId) return;
          await Promise.all(
            items.map((item) => assistantApi.deleteMessage(remoteId, format.getId(item.message))),
          );
        },
      }),
    }),
    [aui],
  );
  return useMemo(() => ({ history }), [history]);
}

export const threadListAdapter: RemoteThreadListAdapter = {
  async list(params) {
    const [page, archived] = await Promise.all([
      assistantApi.listThreads(params?.after),
      params?.after ? Promise.resolve({ items: [] }) : assistantApi.listArchivedThreads(),
    ]);
    return {
      threads: [...page.items, ...archived.items].map((thread) => ({
        remoteId: thread.remoteId,
        status: thread.status,
        title: thread.title,
        lastMessageAt: new Date(thread.lastMessageAt ?? thread.updatedAt),
      })),
      nextCursor: page.nextCursor,
    };
  },
  async initialize() {
    const thread = await assistantApi.createThread();
    return { remoteId: thread.remoteId };
  },
  async fetch(threadId) {
    const thread = await assistantApi.getThread(threadId);
    return {
      remoteId: thread.remoteId,
      status: thread.status,
      title: thread.title,
      lastMessageAt: new Date(thread.lastMessageAt ?? thread.updatedAt),
    };
  },
  async rename(remoteId, newTitle) {
    await assistantApi.updateThread(remoteId, { title: newTitle });
  },
  async archive(remoteId) {
    await assistantApi.updateThread(remoteId, { status: 'archived' });
  },
  async unarchive(remoteId) {
    await assistantApi.updateThread(remoteId, { status: 'regular' });
  },
  async delete(remoteId) {
    await assistantApi.deleteThread(remoteId);
  },
  async generateTitle(remoteId, messages) {
    return createAssistantStream(async (controller) => {
      const { title } = await assistantApi.generateTitle(remoteId, messages);
      controller.appendText(title);
    });
  },
  unstable_useAdapters: useThreadAdapters,
};
