import { useMemo } from 'react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/ai-sdk';

import { env } from '@/core/env';

/**
 * The relative default is useful for Expo web/API routes. Native builds should
 * point at an absolute, app-owned endpoint through EXPO_PUBLIC_CHAT_ENDPOINT_URL.
 */
const CHAT_ENDPOINT = env.EXPO_PUBLIC_CHAT_ENDPOINT_URL ?? '/api/chat';

export function useAssistantRuntime() {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: CHAT_ENDPOINT,
      }),
    [],
  );

  return useChatRuntime({ transport });
}
