import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { Text } from '@/shared/components/Text';

export default function NotFoundScreen() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
        }}
      >
        <Text variant="title">{t('notFound.title')}</Text>
        <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
          {t('notFound.message')}
        </Text>
        <Button
          label={t('common.goHome')}
          onPress={() => {
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
