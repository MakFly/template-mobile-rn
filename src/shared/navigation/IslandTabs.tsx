import { StyleSheet } from 'react-native';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import {
  FloatingTabBar,
  FLOATING_TAB_BAR_SPACE,
  type FloatingTabBarItem,
} from '@/shared/components/FloatingTabBar';
import { ContentBottomInsetProvider } from '@/shared/navigation/ContentBottomInset';

/**
 * "Island" layout — headless expo-router tabs with a floating pill tab bar.
 * The real `<TabList>` is hidden (it only declares the routes/triggers);
 * `<FloatingTabBar>` renders the visible triggers on top of the scene.
 * Content scrolls behind the translucent pill on purpose — that is what the
 * blurred material renders. Screens reserve the space the pill occupies via
 * `useContentBottomInset()`, so the last item stays reachable.
 */
export function IslandTabs() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const items: FloatingTabBarItem[] = [
    { name: 'index', icon: 'home', label: t('tabs.home') },
    { name: 'posts', icon: 'posts', label: t('tabs.posts') },
    { name: 'settings', icon: 'settings', label: t('tabs.settings') },
  ];

  return (
    <Tabs style={[styles.root, { backgroundColor: colors.background }]}>
      <ContentBottomInsetProvider value={FLOATING_TAB_BAR_SPACE + insets.bottom}>
        <TabSlot />
      </ContentBottomInsetProvider>
      <TabList style={styles.hiddenTabList}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="posts" href="/posts" />
        <TabTrigger name="settings" href="/settings" />
      </TabList>
      <FloatingTabBar items={items} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hiddenTabList: {
    display: 'none',
  },
});
