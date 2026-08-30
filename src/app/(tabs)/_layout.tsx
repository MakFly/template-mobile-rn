import { useCallback, useState, type ComponentType } from 'react';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { AssistantRuntimeProvider } from '@assistant-ui/react-native';

import { AssistantNav } from '@/features/assistant/components/AssistantNav';
import { useAssistantRuntime } from '@/features/assistant/hooks/useAssistantRuntime';
import { useSettingsStore, type LayoutMode } from '@/features/settings/store';
import { ClassicTabs } from '@/shared/navigation/ClassicTabs';
import { IslandTabs } from '@/shared/navigation/IslandTabs';
import { SidebarNav } from '@/shared/navigation/SidebarNav';

const LAYOUTS: Record<LayoutMode, ComponentType> = {
  tabs: ClassicTabs,
  island: IslandTabs,
  sidebar: SidebarNav,
  assistant: AssistantNav,
};

/**
 * Layout switcher: the user picks the navigation shell in Settings.
 * Switching modes remounts the navigator (state inside tabs is reset) —
 * the Settings screen surfaces that as a hint.
 *
 * The assistant runtime is URL-controlled (official assistant-ui pattern):
 * `/c/[id]` drives the active thread, and thread switches write back to the
 * URL. Non-chat routes (posts, settings, threads) keep the last chat state so
 * browsing the app never resets the conversation.
 */
export default function TabsLayout() {
  const layoutMode = useSettingsStore((state) => state.layoutMode);
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useGlobalSearchParams<{ id?: string }>();

  // Derived-during-render state ("adjusting state when props change" pattern):
  // chat routes overwrite the controlled thread id, other routes keep the
  // previous value so the conversation survives a detour through the app.
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const urlThreadId =
    pathname === '/'
      ? undefined
      : pathname.startsWith('/c/') && typeof id === 'string' && id.length > 0
        ? id
        : threadId;
  if (urlThreadId !== threadId) setThreadId(urlThreadId);

  const onThreadIdChange = useCallback(
    (remoteId: string | undefined) => {
      // Controlled-option changes are not echoed back by the runtime, so this
      // only fires for user-driven switches — mirror them into the URL.
      if (remoteId) {
        router.replace({ pathname: '/c/[id]', params: { id: remoteId } });
      } else {
        router.replace('/');
      }
    },
    [router],
  );

  const runtime = useAssistantRuntime({ threadId: urlThreadId, onThreadIdChange });

  // Defensive fallback: persisted storage may hold a stale/unknown mode.
  const Layout = LAYOUTS[layoutMode] ?? ClassicTabs;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Layout />
    </AssistantRuntimeProvider>
  );
}
