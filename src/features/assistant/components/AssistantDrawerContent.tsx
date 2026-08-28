import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { TabBarIcon, type TabBarIconName } from '@/shared/components/TabBarIcon';
import { Text } from '@/shared/components/Text';

interface ThreadListItemProps {
  onSelect: () => void;
}

function AssistantThreadListItem({ onSelect }: ThreadListItemProps) {
  const { colors, spacing, radii } = useTheme();
  const aui = useAui();
  const isActive = useAuiState((state) => state.threads.mainThreadId === state.threadListItem.id);

  return (
    <ThreadListItemPrimitive.Root>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        onPress={() => {
          aui.threadListItem.switchTo();
          onSelect();
        }}
        style={({ pressed }) => [
          styles.threadItem,
          {
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            backgroundColor: isActive || pressed ? colors.surfaceAlt : 'transparent',
          },
        ]}
      >
        <Text variant="body" numberOfLines={1} style={isActive && styles.activeTitle}>
          <ThreadListItemPrimitive.Title fallback="New chat" />
        </Text>
      </Pressable>
    </ThreadListItemPrimitive.Root>
  );
}

interface AppLinkProps {
  href: Href;
  icon: TabBarIconName;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function AppLink({ href, icon, label, selected, onSelect }: AppLinkProps) {
  const { colors, spacing, radii, typography } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        router.navigate(href);
        onSelect();
      }}
      style={({ pressed }) => [
        styles.appLink,
        {
          gap: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          backgroundColor: selected || pressed ? colors.surfaceAlt : 'transparent',
        },
      ]}
    >
      <TabBarIcon
        name={icon}
        size={typography.sizes.lg}
        color={selected ? colors.primary : colors.textMuted}
      />
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

export function AssistantDrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const aui = useAui();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;
  const isNewThreadActive = useAuiState(
    (assistantState) => assistantState.threads.newThreadId === assistantState.threads.mainThreadId,
  );

  const closeDrawer = () => navigation.closeDrawer();
  const openNewThread = () => {
    aui.threads.switchToNewThread();
    router.navigate('/');
    closeDrawer();
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: colors.sidebar,
        },
      ]}
    >
      <ThreadListPrimitive.Root style={styles.threadListRoot}>
        <Text variant="subtitle" style={{ paddingHorizontal: spacing.lg }}>
          {t('assistant.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isNewThreadActive && activeRoute === 'index' }}
          onPress={openNewThread}
          style={({ pressed }) => [
            styles.newThread,
            {
              gap: spacing.md,
              marginTop: spacing.md,
              marginHorizontal: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 8,
              backgroundColor:
                (isNewThreadActive && activeRoute === 'index') || pressed
                  ? colors.surfaceAlt
                  : 'transparent',
            },
          ]}
        >
          <AssistantIcon name="compose" size={18} color={colors.text} />
          <Text variant="label">{t('assistant.newThread')}</Text>
        </Pressable>

        <Text
          variant="caption"
          tone="muted"
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xs,
          }}
        >
          {t('assistant.recent')}
        </Text>
        <ThreadListPrimitive.Items
          renderItem={() => (
            <AssistantThreadListItem
              onSelect={() => {
                router.navigate('/');
                closeDrawer();
              }}
            />
          )}
          style={styles.threads}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      </ThreadListPrimitive.Root>

      <View style={[styles.appLinks, { borderTopColor: colors.border, paddingTop: spacing.sm }]}>
        <Text
          variant="caption"
          tone="muted"
          style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}
        >
          {t('assistant.appSection')}
        </Text>
        <AppLink
          href="/posts"
          icon="posts"
          label={t('tabs.posts')}
          selected={activeRoute === 'posts'}
          onSelect={closeDrawer}
        />
        <AppLink
          href="/settings"
          icon="settings"
          label={t('tabs.settings')}
          selected={activeRoute === 'settings'}
          onSelect={closeDrawer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  threadListRoot: {
    flex: 1,
  },
  newThread: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  threads: {
    flex: 1,
  },
  threadItem: {
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  activeTitle: {
    fontWeight: '600',
  },
  appLinks: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  appLink: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
