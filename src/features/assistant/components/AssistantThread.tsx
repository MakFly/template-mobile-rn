import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AuiIf, ThreadPrimitive } from '@assistant-ui/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { AssistantMessageBubble } from '@/features/assistant/components/AssistantMessage';
import { ThreadComposer } from '@/features/assistant/components/ThreadComposer';
import { Text } from '@/shared/components/Text';
import { useShellHeaderHeight } from '@/shared/navigation/useShellHeaderHeight';

const SUGGESTION_KEYS = ['plan', 'explain', 'draft'] as const;

function EmptyState() {
  const { colors, spacing, radii } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.empty, { paddingHorizontal: spacing.md }]}>
      <View style={{ gap: spacing.sm, alignItems: 'center' }}>
        <Text variant="display" style={styles.welcome}>
          {t('assistant.welcome')}
        </Text>
        <Text variant="body" tone="muted" style={styles.intro}>
          {t('assistant.intro')}
        </Text>
      </View>
      <View style={styles.suggestionsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestions}
          contentContainerStyle={[
            styles.suggestionsContent,
            { gap: spacing.sm, paddingHorizontal: spacing.md },
          ]}
        >
          {SUGGESTION_KEYS.map((key) => {
            const prompt = t(`assistant.suggestions.${key}`);
            return (
              <ThreadPrimitive.Suggestion
                key={key}
                prompt={prompt}
                send
                style={({ pressed }) => [
                  styles.suggestion,
                  {
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                  },
                ]}
              >
                <Text variant="label" numberOfLines={1}>
                  {prompt}
                </Text>
              </ThreadPrimitive.Suggestion>
            );
          })}
        </ScrollView>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.scrollHint}
        >
          <AssistantIcon name="chevronRight" size={16} color={colors.textMuted} />
        </View>
      </View>
      <ThreadComposer />
    </View>
  );
}

function Messages() {
  const { spacing } = useTheme();

  return (
    <>
      <AuiIf condition={(state) => state.thread.isEmpty}>
        <EmptyState />
      </AuiIf>
      <AuiIf condition={(state) => !state.thread.isEmpty}>
        <ThreadPrimitive.MessagesFlatList
          style={styles.flex}
          contentContainerStyle={[
            styles.messages,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.lg,
              gap: spacing.lg,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {() => <AssistantMessageBubble />}
        </ThreadPrimitive.MessagesFlatList>
      </AuiIf>
    </>
  );
}

export function AssistantThread() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useShellHeaderHeight();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.flex}>
          <Messages />
        </View>
        <AuiIf condition={(state) => !state.thread.isEmpty}>
          <View style={{ paddingBottom: insets.bottom + spacing.sm }}>
            <ThreadComposer />
          </View>
        </AuiIf>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  messages: {
    width: '100%',
    maxWidth: 768,
    marginHorizontal: 'auto',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 48,
  },
  welcome: {
    textAlign: 'center',
  },
  intro: {
    maxWidth: 440,
    textAlign: 'center',
  },
  suggestionsRow: {
    width: '100%',
    maxWidth: 680,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestions: {
    flex: 1,
    minWidth: 0,
  },
  suggestionsContent: {
    alignItems: 'center',
  },
  suggestion: {
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  scrollHint: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
