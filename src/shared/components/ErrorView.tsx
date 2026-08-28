import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { Text } from '@/shared/components/Text';

export interface ErrorViewProps {
  /** Defaults to the generic translated error message. */
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const { spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="alert"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        padding: spacing.xl,
      }}
    >
      <Text variant="body" tone="danger" style={{ textAlign: 'center' }}>
        {message ?? t('errors.generic')}
      </Text>
      {onRetry ? <Button label={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
