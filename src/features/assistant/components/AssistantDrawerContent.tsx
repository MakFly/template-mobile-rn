import { View } from 'react-native';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';
import { ConversationPanel } from '@/features/assistant/components/ConversationPanel';

export function AssistantDrawerContent({ navigation }: DrawerContentComponentProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + spacing.xs,
        paddingBottom: insets.bottom,
        backgroundColor: colors.sidebar,
      }}
    >
      <ConversationPanel showAppLinks onSelect={() => navigation.closeDrawer()} />
    </View>
  );
}
