import type { PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';
import { useShellHeaderHeight } from '@/shared/navigation/useShellHeaderHeight';

export interface ScreenProps extends PropsWithChildren {
  /**
   * Safe-area edges to inset. Bottom is excluded by default because
   * tab screens already sit above the tab bar.
   */
  edges?: Edges;
  /** Apply default horizontal/vertical padding from spacing tokens. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({
  edges = ['top', 'left', 'right'],
  padded = true,
  style,
  children,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  // A navigator header already sits in the top safe area; insetting again
  // would push the content down by the notch a second time.
  const hasHeader = useShellHeaderHeight() > 0;
  const resolvedEdges =
    hasHeader && Array.isArray(edges) ? edges.filter((edge) => edge !== 'top') : edges;

  return (
    <SafeAreaView
      edges={resolvedEdges}
      style={[
        { flex: 1, backgroundColor: colors.background },
        padded && { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
