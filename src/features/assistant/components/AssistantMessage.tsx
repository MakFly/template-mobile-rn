import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import {
  ActionBarPrimitive,
  AuiIf,
  ErrorPrimitive,
  MessagePrimitive,
  useAuiState,
  type TextMessagePartComponent,
} from '@assistant-ui/react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { Text } from '@/shared/components/Text';

const UserText: TextMessagePartComponent = ({ text }) => (
  <Text style={styles.userText}>{text}</Text>
);

const AssistantText: TextMessagePartComponent = ({ text }) => (
  <Text style={styles.assistantText}>{text}</Text>
);

function TypingDot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.25));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 420,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { opacity, backgroundColor: colors.textMuted }]} />;
}

function TypingIndicator() {
  const isRunning = useAuiState((state) => state.message.status?.type === 'running');
  if (!isRunning) return null;

  return (
    <View style={styles.typing} accessibilityLabel="Assistant is responding">
      <TypingDot delay={0} />
      <TypingDot delay={140} />
      <TypingDot delay={280} />
    </View>
  );
}

const USER_PARTS = { Text: UserText };
const ASSISTANT_PARTS = { Text: AssistantText, Empty: TypingIndicator };

function UserMessage() {
  const { colors, radii } = useTheme();

  return (
    <MessagePrimitive.Root style={styles.userContainer}>
      <View
        style={[
          styles.userBubble,
          { backgroundColor: colors.surfaceAlt, borderRadius: radii.lg + 6 },
        ]}
      >
        <MessagePrimitive.Parts components={USER_PARTS} />
      </View>
    </MessagePrimitive.Root>
  );
}

function ReloadButton() {
  const { colors, radii } = useTheme();
  const { t } = useTranslation();

  return (
    <ActionBarPrimitive.Reload
      accessibilityLabel={t('assistant.message.retry')}
      style={({ pressed }) => [
        styles.reload,
        { borderRadius: radii.sm },
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <AssistantIcon name="reload" size={16} color={colors.textMuted} />
    </ActionBarPrimitive.Reload>
  );
}

function AssistantMessage() {
  const { colors, radii, spacing } = useTheme();

  return (
    <MessagePrimitive.Root style={styles.assistantContainer}>
      <MessagePrimitive.Parts components={ASSISTANT_PARTS} />
      <ErrorPrimitive.Root
        style={[
          styles.error,
          {
            marginTop: spacing.sm,
            padding: spacing.md,
            borderRadius: radii.md,
            borderColor: colors.danger,
            backgroundColor: colors.surfaceAlt,
          },
        ]}
      >
        <ErrorPrimitive.Message style={[styles.errorText, { color: colors.danger }]} />
      </ErrorPrimitive.Root>
      <AuiIf condition={(state) => state.message.status?.type !== 'running'}>
        <View style={styles.messageActions}>
          <ReloadButton />
        </View>
      </AuiIf>
    </MessagePrimitive.Root>
  );
}

export function AssistantMessageBubble() {
  const role = useAuiState((state) => state.message.role);
  return role === 'user' ? <UserMessage /> : <AssistantMessage />;
}

const styles = StyleSheet.create({
  userContainer: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '86%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  assistantContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  assistantText: {
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  error: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageActions: {
    marginTop: 4,
    marginLeft: -6,
  },
  reload: {
    padding: 6,
  },
});
