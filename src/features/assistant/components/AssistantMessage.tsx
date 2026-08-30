import { useEffect, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, View } from 'react-native';
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  useAuiState,
  type TextMessagePartComponent,
} from '@assistant-ui/react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { MessageActionBar } from '@/features/assistant/components/MessageActionBar';
import { MessageBranchPicker } from '@/features/assistant/components/MessageBranchPicker';
import { Text } from '@/shared/components/Text';
import { haptics } from '@/shared/lib/haptics';

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

/** Image attachments sent with a user message, rendered above the bubble. */
function MessageImageAttachment() {
  const { colors, radii } = useTheme();
  const attachment = useAuiState((state) => state.attachment);
  if (!attachment) return null;

  const imageContent = attachment.content?.find((content) => content.type === 'image');
  const uri = imageContent?.type === 'image' ? imageContent.image : undefined;
  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      resizeMode="cover"
      style={[styles.messageImage, { borderRadius: radii.lg, backgroundColor: colors.surfaceAlt }]}
    />
  );
}

/**
 * Inline editor replacing the user bubble while `composer.isEditing`:
 * ComposerPrimitive inside a message scope binds to that message's edit
 * composer. Sending commits the edit as a new branch (hence the branch
 * picker under user messages); cancel restores the bubble.
 */
function UserEditComposer() {
  const { colors, spacing, radii } = useTheme();
  const { t } = useTranslation();

  return (
    <ComposerPrimitive.Root
      style={[
        styles.editShell,
        { borderColor: colors.border, backgroundColor: colors.sidebar, borderRadius: radii.lg },
      ]}
    >
      <ComposerPrimitive.Input
        multiline
        autoFocus
        maxLength={4000}
        placeholderTextColor={colors.textMuted}
        style={[styles.editInput, { color: colors.text }]}
      />
      <View style={[styles.editActions, { gap: spacing.sm }]}>
        <ComposerPrimitive.Cancel
          accessibilityLabel={t('assistant.message.cancelEdit')}
          onPressIn={haptics.light}
          style={({ pressed }) => [
            styles.editButton,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            },
          ]}
        >
          <AssistantIcon name="remove" size={15} color={colors.textMuted} />
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send
          accessibilityLabel={t('assistant.message.sendEdit')}
          onPressIn={haptics.success}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
          ]}
        >
          <AssistantIcon name="send" size={15} color={colors.onPrimary} />
        </ComposerPrimitive.Send>
      </View>
    </ComposerPrimitive.Root>
  );
}

function UserMessage() {
  const { colors, radii } = useTheme();
  const { t } = useTranslation();

  return (
    <MessagePrimitive.Root style={styles.userContainer}>
      <AuiIf condition={(state) => !state.composer.isEditing}>
        <View style={styles.userAttachments}>
          <MessagePrimitive.Attachments>
            {() => <MessageImageAttachment />}
          </MessagePrimitive.Attachments>
        </View>
        <View
          style={[
            styles.userBubble,
            { backgroundColor: colors.surfaceAlt, borderRadius: radii.lg + 6 },
          ]}
        >
          <MessagePrimitive.Parts components={USER_PARTS} />
        </View>
        <View style={styles.userActionsRow}>
          <MessageBranchPicker align="flex-end" />
          <ActionBarPrimitive.Edit
            accessibilityLabel={t('assistant.message.edit')}
            onPressIn={haptics.selection}
            style={({ pressed }) => [
              styles.userEdit,
              { borderRadius: radii.sm },
              pressed && { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <AssistantIcon name="rename" size={15} color={colors.textMuted} />
          </ActionBarPrimitive.Edit>
        </View>
      </AuiIf>
      <AuiIf condition={(state) => state.composer.isEditing}>
        <UserEditComposer />
      </AuiIf>
    </MessagePrimitive.Root>
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
          <MessageBranchPicker align="flex-start" />
          <MessageActionBar />
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
  userAttachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  messageImage: {
    width: 200,
    height: 200,
    marginBottom: 6,
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
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userEdit: {
    padding: 6,
  },
  editShell: {
    width: '100%',
    maxWidth: '92%',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    gap: 6,
  },
  editInput: {
    minHeight: 40,
    maxHeight: 168,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 16,
    lineHeight: 22,
    ...Platform.select({
      web: { outlineStyle: 'none' } as never,
      default: {},
    }),
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: -6,
  },
});
