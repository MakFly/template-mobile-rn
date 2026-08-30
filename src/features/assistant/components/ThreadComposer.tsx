import { useCallback } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  AttachmentPrimitive,
  AuiIf,
  ComposerPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { logger } from '@/core/logger';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { haptics } from '@/shared/lib/haptics';

const MAX_IMAGE_ATTACHMENTS = 4;

function AttachmentPreview() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const attachment = useAuiState((state) => state.attachment);
  if (!attachment) return null;

  const imageContent = attachment.content?.find((content) => content.type === 'image');
  const uri = imageContent?.type === 'image' ? imageContent.image : undefined;

  return (
    <AttachmentPrimitive.Root style={styles.attachment}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={[styles.attachmentImage, { backgroundColor: colors.surfaceAlt }]}
        />
      ) : null}
      <AttachmentPrimitive.Remove
        accessibilityLabel={t('assistant.composer.removeAttachment')}
        onPressIn={haptics.light}
        style={styles.removeAttachment}
      >
        <View style={[styles.removeBadge, { backgroundColor: colors.primary }]}>
          <AssistantIcon name="remove" size={13} color={colors.onPrimary} />
        </View>
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  );
}

function AttachButton() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const aui = useAui();
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const attachmentCount = useAuiState((state) => state.composer.attachments.length);
  const isDisabled = isRunning || attachmentCount >= MAX_IMAGE_ATTACHMENTS;

  const pickImages = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGE_ATTACHMENTS - attachmentCount,
        base64: true,
        quality: 0.7,
      });
      if (result.canceled) return;

      for (const asset of result.assets) {
        if (!asset.base64) {
          throw new Error('Image picker returned an asset without JPEG data');
        }
        await aui.composer.addAttachment({
          name: asset.fileName ?? 'image.jpg',
          contentType: 'image/jpeg',
          type: 'image',
          content: [
            {
              type: 'image',
              image: `data:image/jpeg;base64,${asset.base64}`,
            },
          ],
        });
      }
    } catch (error) {
      logger.child('assistant').error('Unable to attach selected image', { error });
      Alert.alert(
        t('assistant.composer.attachmentErrorTitle'),
        t('assistant.composer.attachmentErrorBody'),
      );
    }
  }, [attachmentCount, aui, t]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('assistant.composer.addImage')}
      disabled={isDisabled}
      hitSlop={6}
      onPressIn={haptics.selection}
      onPress={() => void pickImages()}
      style={({ pressed }) => [
        styles.secondaryAction,
        pressed && { backgroundColor: colors.surfaceAlt },
        isDisabled && styles.disabled,
      ]}
    >
      <AssistantIcon name="add" size={21} color={colors.textMuted} />
    </Pressable>
  );
}

function SendButton() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const canSend = useAuiState((state) => state.composer.canSend);

  return (
    <ComposerPrimitive.Send
      accessibilityLabel={t('assistant.composer.send')}
      onPressIn={() => canSend && haptics.success()}
      style={({ pressed }) => [
        styles.primaryAction,
        {
          backgroundColor: canSend
            ? pressed
              ? colors.primaryPressed
              : colors.primary
            : colors.surfaceAlt,
        },
      ]}
    >
      <AssistantIcon
        name="send"
        size={18}
        color={canSend ? colors.onPrimary : colors.textMuted}
      />
    </ComposerPrimitive.Send>
  );
}

function CancelButton() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ComposerPrimitive.Cancel
      accessibilityLabel={t('assistant.composer.stop')}
      onPressIn={haptics.light}
      style={[styles.primaryAction, { backgroundColor: colors.primary }]}
    >
      <AssistantIcon name="stop" size={15} color={colors.onPrimary} />
    </ComposerPrimitive.Cancel>
  );
}

function PrimaryAction() {
  return (
    <View style={styles.primaryActionSlot}>
      <AuiIf condition={(state) => !state.thread.isRunning}>
        <SendButton />
      </AuiIf>
      <AuiIf condition={(state) => state.thread.isRunning}>
        <CancelButton />
      </AuiIf>
    </View>
  );
}

/**
 * Thread composer matching assistant-ui desktop / ChatGPT structure:
 * a full-width input above a capability-driven action toolbar.
 */
export function ThreadComposer() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const hasAttachments = useAuiState((state) => state.composer.attachments.length > 0);

  return (
    <ComposerPrimitive.Root
      style={[styles.root, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}
    >
      <View
        style={[
          styles.shell,
          {
            borderColor: colors.border,
            backgroundColor: colors.sidebar,
          },
        ]}
      >
        {hasAttachments ? (
          <View style={styles.attachments}>
            <ComposerPrimitive.Attachments>
              {() => <AttachmentPreview />}
            </ComposerPrimitive.Attachments>
          </View>
        ) : null}
        <ComposerPrimitive.Input
          multiline
          maxLength={4000}
          enterKeyHint="send"
          placeholder={t('assistant.composer.placeholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
        />
        <View style={styles.toolbar}>
          <AttachButton />
          <PrimaryAction />
        </View>
      </View>
    </ComposerPrimitive.Root>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 792,
    alignSelf: 'center',
  },
  shell: {
    width: '100%',
    flexDirection: 'column',
    gap: 2,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 28,
  },
  input: {
    width: '100%',
    minHeight: 28,
    maxHeight: 132,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    fontSize: 16,
    lineHeight: 22,
    ...Platform.select({
      web: { outlineStyle: 'none' } as never,
      default: {},
    }),
  },
  toolbar: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  attachment: {
    position: 'relative',
  },
  attachmentImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  removeAttachment: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  removeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  primaryActionSlot: {
    width: 32,
    height: 32,
  },
  primaryAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
