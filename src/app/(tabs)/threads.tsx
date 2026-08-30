import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';
import { ConversationPanel } from '@/features/assistant/components/ConversationPanel';

export default function ThreadsScreen() {
  const { colors, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.md,
        paddingTop: insets.top + spacing.md,
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 620,
          alignSelf: 'center',
          overflow: 'hidden',
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ConversationPanel />
      </View>
    </View>
  );
}
