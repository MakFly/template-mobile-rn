import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { assistantApi, type AssistantThreadDto } from '@/features/assistant/api';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { TabBarIcon, type TabBarIconName } from '@/shared/components/TabBarIcon';
import { Text } from '@/shared/components/Text';

/**
 * Compact relative stamp for a thread row: time today, "yesterday", then a
 * short date — the row answers "when did this live?" at a glance without
 * competing with the title.
 */
export function formatThreadDate(date: Date, locale: string, yesterdayLabel: string): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfDay) / 86_400_000);
  if (dayDiff <= 0) {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  if (dayDiff === 1) return yesterdayLabel;
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  }
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
}

/** Soft pulse marking a thread whose run continues in the background. */
function RunningDot() {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 640,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 640,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.runningDot, { opacity, backgroundColor: colors.primary }]} />;
}

interface ThreadRowProps {
  onSelect?: () => void;
}

/**
 * One conversation. Inactive rows stay quiet (title + relative stamp);
 * the active row lifts on `surfaceAlt` and is the only one to expose its
 * actions — rename, archive, delete — so the list never reads as a toolbar.
 */
function ThreadRow({ onSelect }: ThreadRowProps) {
  const { colors, spacing, radii } = useTheme();
  const { t, i18n } = useTranslation();
  const aui = useAui();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const isActive = useAuiState((state) => state.threads.mainThreadId === state.threadListItem.id);
  const isRunning = useAuiState((state) => state.threadListItem.isRunning);
  const lastMessageAt = useAuiState((state) => state.threadListItem.lastMessageAt);
  const title = useAuiState((state) => state.threadListItem.title) ?? t('assistant.threads.untitled');

  const commitRename = async () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== title) await aui.threadListItem.rename(next);
  };

  return (
    <ThreadListItemPrimitive.Root style={{ marginHorizontal: spacing.sm }}>
      <View
        style={[
          styles.threadRow,
          {
            borderRadius: radii.md,
            backgroundColor: isActive ? colors.surfaceAlt : 'transparent',
          },
        ]}
      >
        {editing ? (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void commitRename()}
            onBlur={() => void commitRename()}
            maxLength={120}
            selectTextOnFocus
            style={[
              styles.titleInput,
              { color: colors.text, borderColor: colors.primary, borderRadius: radii.sm },
            ]}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              void aui.threadListItem.switchTo();
              onSelect?.();
            }}
            style={({ pressed }) => [
              styles.threadTrigger,
              { gap: spacing.sm },
              pressed && { opacity: 0.62 },
            ]}
          >
            {isRunning ? <RunningDot /> : null}
            <Text
              variant="body"
              numberOfLines={1}
              style={[styles.threadTitle, isActive && styles.activeTitle]}
            >
              <ThreadListItemPrimitive.Title fallback={t('assistant.threads.untitled')} />
            </Text>
          </Pressable>
        )}
        {isActive && !editing ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('assistant.threads.rename')}
              hitSlop={6}
              onPress={() => {
                setDraft(title);
                setEditing(true);
              }}
              style={styles.action}
            >
              <AssistantIcon name="rename" size={15} color={colors.textMuted} />
            </Pressable>
            <ThreadListItemPrimitive.Archive
              accessibilityLabel={t('assistant.threads.archive')}
              hitSlop={6}
              style={styles.action}
            >
              <AssistantIcon name="archive" size={15} color={colors.textMuted} />
            </ThreadListItemPrimitive.Archive>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('assistant.threads.delete')}
              hitSlop={6}
              onPress={() =>
                Alert.alert(t('assistant.threads.deleteTitle'), t('assistant.threads.deleteBody'), [
                  { text: t('assistant.threads.deleteCancel'), style: 'cancel' },
                  {
                    text: t('assistant.threads.deleteConfirm'),
                    style: 'destructive',
                    onPress: () => void aui.threadListItem.delete(),
                  },
                ])
              }
              style={styles.action}
            >
              <AssistantIcon name="trash" size={15} color={colors.danger} />
            </Pressable>
          </View>
        ) : !editing && lastMessageAt ? (
          <Text variant="caption" tone="muted" style={{ paddingRight: spacing.md }}>
            {formatThreadDate(lastMessageAt, i18n.language, t('assistant.threads.yesterday'))}
          </Text>
        ) : null}
      </View>
    </ThreadListItemPrimitive.Root>
  );
}

const APP_LINKS: { href: Href; icon: TabBarIconName; labelKey: string }[] = [
  { href: '/posts', icon: 'posts', labelKey: 'tabs.posts' },
  { href: '/settings', icon: 'settings', labelKey: 'tabs.settings' },
];

export interface ConversationPanelProps {
  onSelect?: () => void;
  /**
   * Show the Posts/Settings shortcuts at the bottom. Only the drawer wants
   * them (it IS the navigation); on the Threads tab the tab bar already
   * carries those destinations.
   */
  showAppLinks?: boolean;
}

export function ConversationPanel({ onSelect, showAppLinks = false }: ConversationPanelProps) {
  const { colors, spacing, radii } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const aui = useAui();
  const [showArchives, setShowArchives] = useState(false);
  const [archives, setArchives] = useState<AssistantThreadDto[]>([]);
  const [archivesPending, setArchivesPending] = useState(false);

  const toggleArchives = useCallback(async () => {
    const next = !showArchives;
    setShowArchives(next);
    if (!next) return;
    setArchivesPending(true);
    try {
      setArchives((await assistantApi.listArchivedThreads()).items);
    } finally {
      setArchivesPending(false);
    }
  }, [showArchives]);

  const startNewThread = () => {
    void aui.threads.switchToNewThread();
    router.navigate('/');
    onSelect?.();
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.sidebar }]}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
          gap: spacing.xs,
        }}
      >
        <Text variant="caption" tone="muted" style={styles.eyebrow}>
          {t('assistant.title')}
        </Text>
        <View style={styles.headerRow}>
          <Text variant="subtitle">{t('tabs.threads')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('assistant.newThread')}
            hitSlop={4}
            onPress={startNewThread}
            style={({ pressed }) => [
              styles.composeButton,
              {
                borderColor: colors.border,
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
              },
            ]}
          >
            <AssistantIcon name="compose" size={17} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ThreadListPrimitive.Root style={styles.threadList}>
        <ThreadListPrimitive.Items
          renderItem={() => <ThreadRow onSelect={onSelect} />}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyList, { padding: spacing.xl, gap: spacing.sm }]}>
              <AssistantIcon name="compose" size={22} color={colors.textMuted} />
              <Text variant="caption" tone="muted" style={styles.emptyText}>
                {t('assistant.threads.empty')}
              </Text>
            </View>
          }
        />
      </ThreadListPrimitive.Root>

      <View style={[styles.bottom, { borderTopColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showArchives }}
          onPress={() => void toggleArchives()}
          style={[styles.archiveToggle, { gap: spacing.sm }]}
        >
          <AssistantIcon
            name={showArchives ? 'chevronDown' : 'chevronRight'}
            size={11}
            color={colors.textMuted}
          />
          <Text variant="caption" tone="muted">
            {t('assistant.threads.archives')}
            {showArchives && archives.length > 0 ? ` (${archives.length})` : ''}
          </Text>
        </Pressable>
        {showArchives ? (
          <ScrollView style={{ maxHeight: 150 }}>
            {archivesPending ? (
              <Text variant="caption" tone="muted">
                {t('assistant.threads.loading')}
              </Text>
            ) : archives.length === 0 ? (
              <Text variant="caption" tone="muted">
                {t('assistant.threads.archivesEmpty')}
              </Text>
            ) : null}
            {archives.map((thread) => (
              <Pressable
                key={thread.id}
                accessibilityRole="button"
                accessibilityLabel={t('assistant.threads.restore')}
                onPress={async () => {
                  await assistantApi.updateThread(thread.id, { status: 'regular' });
                  await aui.threads.reload();
                  setArchives((current) => current.filter((item) => item.id !== thread.id));
                }}
                style={({ pressed }) => [
                  styles.archiveRow,
                  { gap: spacing.sm, borderRadius: radii.sm },
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <AssistantIcon name="unarchive" size={13} color={colors.textMuted} />
                <Text variant="caption" numberOfLines={1} style={styles.threadTitle}>
                  {thread.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {showAppLinks ? (
          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            {APP_LINKS.map((link) => (
              <Pressable
                key={String(link.href)}
                accessibilityRole="link"
                onPress={() => {
                  router.navigate(link.href);
                  onSelect?.();
                }}
                style={({ pressed }) => [
                  styles.appLink,
                  { gap: spacing.md, borderRadius: radii.md },
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <TabBarIcon name={link.icon} size={17} color={colors.textMuted} />
                <Text variant="label">{t(link.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, minHeight: 0 },
  threadList: { flex: 1, minHeight: 0 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  threadTrigger: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  threadTitle: { flex: 1, minWidth: 0 },
  activeTitle: { fontWeight: '600' },
  runningDot: { width: 7, height: 7, borderRadius: 3.5 },
  actions: { flexDirection: 'row', alignItems: 'center', paddingRight: 4 },
  action: { width: 28, height: 34, alignItems: 'center', justifyContent: 'center' },
  titleInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    marginRight: 8,
    paddingHorizontal: 6,
    height: 34,
    borderWidth: 1,
  },
  emptyList: { alignItems: 'center' },
  emptyText: { textAlign: 'center', maxWidth: 220 },
  bottom: { borderTopWidth: StyleSheet.hairlineWidth, padding: 10 },
  archiveToggle: { minHeight: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  archiveRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  appLink: { minHeight: 40, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
});
