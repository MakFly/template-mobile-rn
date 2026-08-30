import { useMemo } from 'react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/ai-sdk';
import { useRemoteThreadListRuntime } from '@assistant-ui/react-native';

import {
  assistantHeaders,
  assistantTransportFetch,
  getChatEndpoint,
} from '@/features/assistant/api';
import { threadListAdapter } from '@/features/assistant/threadListAdapter';

export interface AssistantRuntimeOptions {
  /**
   * Controlled active-thread remote ID (URL-driven routing, e.g. `/c/[id]`).
   * `undefined` means "new empty thread". The pair with `onThreadIdChange`
   * forms the official assistant-ui controlled pattern: threadId in,
   * onThreadIdChange out.
   */
  threadId?: string | undefined;
  /** Fires with the canonical remote ID whenever the active thread changes. */
  onThreadIdChange?: (threadId: string | undefined) => void;
}

/**
 * The relative default is useful for Expo web/API routes. Native builds should
 * point at an absolute, app-owned endpoint through EXPO_PUBLIC_CHAT_ENDPOINT_URL.
 */
export function useAssistantRuntime(options: AssistantRuntimeOptions = {}) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: getChatEndpoint(),
        headers: assistantHeaders(),
        fetch: assistantTransportFetch,
      }),
    [],
  );

  return useRemoteThreadListRuntime({
    runtimeHook: function useThreadRuntime() {
      return useChatRuntime({ transport });
    },
    adapter: threadListAdapter,
    threadId: options.threadId,
    onThreadIdChange: options.onThreadIdChange,
  });
}
