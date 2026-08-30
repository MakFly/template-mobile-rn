import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ActionBarPrimitive } from '@assistant-ui/react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { haptics } from '@/shared/lib/haptics';

const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

/**
 * Copy + regenerate row under an assistant message, mirroring the official
 * assistant-ui expo example (`message-action-bar.tsx`).
 */
export function MessageActionBar() {
  const { colors, radii } = useTheme();
  const { t } = useTranslation();

  const buttonStyle = ({ pressed }: { pressed: boolean }) => [
    styles.button,
    { borderRadius: radii.sm },
    pressed && { backgroundColor: colors.surfaceAlt },
  ];

  return (
    <View style={styles.container}>
      <ActionBarPrimitive.Copy
        accessibilityLabel={t('assistant.message.copy')}
        copyToClipboard={copyToClipboard}
        onPressIn={haptics.selection}
        style={buttonStyle}
      >
        {({ isCopied }) => (
          <AssistantIcon
            name={isCopied ? 'check' : 'copy'}
            size={16}
            color={isCopied ? colors.text : colors.textMuted}
          />
        )}
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload
        accessibilityLabel={t('assistant.message.retry')}
        onPressIn={haptics.selection}
        style={buttonStyle}
      >
        <AssistantIcon name="reload" size={16} color={colors.textMuted} />
      </ActionBarPrimitive.Reload>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  button: {
    padding: 6,
  },
});
