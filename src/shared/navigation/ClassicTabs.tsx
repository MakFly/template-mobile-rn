import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { TabBarIcon } from '@/shared/components/TabBarIcon';

/**
 * Classic bottom tab bar — the default `layoutMode: 'tabs'`.
 * Rendered by src/app/(tabs)/_layout.tsx (the layout switcher).
 */
export function ClassicTabs() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.sidebar,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.assistant'),
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="assistant" color={color} size={size} />
          ),
        }}
      />
      {/* Conversation route (/c/:id): reachable by URL/runtime, never a tab. */}
      <Tabs.Screen name="c/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="threads"
        options={{
          title: t('tabs.threads'),
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="discussions" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: t('tabs.posts'),
          tabBarIcon: ({ color, size }) => <TabBarIcon name="posts" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <TabBarIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
