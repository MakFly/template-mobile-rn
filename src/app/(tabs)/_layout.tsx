import type { ComponentType } from 'react';

import { AssistantNav } from '@/features/assistant/components/AssistantNav';
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
 */
export default function TabsLayout() {
  const layoutMode = useSettingsStore((state) => state.layoutMode);

  // Defensive fallback: persisted storage may hold a stale/unknown mode.
  const Layout = LAYOUTS[layoutMode] ?? ClassicTabs;

  return <Layout />;
}
