import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';

export interface SpinnerProps {
  size?: 'small' | 'large';
  /** Center the spinner in the available space. */
  fill?: boolean;
}

export function Spinner({ size = 'large', fill = false }: SpinnerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const indicator = (
    <ActivityIndicator
      size={size}
      color={colors.primary}
      accessibilityLabel={t('common.loading')}
    />
  );

  if (!fill) {
    return indicator;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{indicator}</View>
  );
}
