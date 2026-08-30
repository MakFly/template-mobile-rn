import { AssistantThread } from '@/features/assistant/components/AssistantThread';

/**
 * A persisted conversation, addressed by its remote ID — `/c/:id`, like the
 * classic web chat URL scheme. The (tabs) layout reads the `id` param and
 * drives the runtime (controlled `threadId`); this screen only renders the
 * same thread UI as the index route.
 */
export default function ConversationScreen() {
  return <AssistantThread />;
}
