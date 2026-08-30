import { StyleSheet, View } from 'react-native';
import { BranchPickerPrimitive, useAuiState } from '@assistant-ui/react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import { Text } from '@/shared/components/Text';

/**
 * ‹ n / N › navigation between message branches (created by edits and
 * regenerations). Hidden while a message has a single branch — the common
 * case — so the thread stays quiet. Mirrors the official expo example.
 */
export function MessageBranchPicker({ align = 'flex-start' }: { align?: 'flex-start' | 'flex-end' }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const branchNumber = useAuiState((state) => state.message.branchNumber);
  const branchCount = useAuiState((state) => state.message.branchCount);

  if (branchCount <= 1) return null;

  return (
    <View style={[styles.container, { justifyContent: align }]}>
      <BranchPickerPrimitive.Previous
        accessibilityLabel={t('assistant.message.previousBranch')}
        hitSlop={4}
        style={[styles.button, { opacity: branchNumber <= 1 ? 0.35 : 1 }]}
      >
        <AssistantIcon name="chevronLeft" size={15} color={colors.textMuted} />
      </BranchPickerPrimitive.Previous>
      <Text variant="caption" tone="muted" style={styles.label}>
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </Text>
      <BranchPickerPrimitive.Next
        accessibilityLabel={t('assistant.message.nextBranch')}
        hitSlop={4}
        style={[styles.button, { opacity: branchNumber >= branchCount ? 0.35 : 1 }]}
      >
        <AssistantIcon name="chevronRight" size={15} color={colors.textMuted} />
      </BranchPickerPrimitive.Next>
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
    padding: 4,
  },
  label: {
    fontVariant: ['tabular-nums'],
  },
});
