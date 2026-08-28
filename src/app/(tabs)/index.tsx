import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantThread } from '@/features/assistant/components/AssistantThread';
import { useSettingsStore } from '@/features/settings/store';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Text } from '@/shared/components/Text';
import { useContentBottomInset } from '@/shared/navigation/ContentBottomInset';

/** Keys under `home.blocks.*`, rendered in order. */
const BLOCKS = ['theme', 'i18n', 'storage', 'navigation', 'api', 'tests'] as const;

export default function HomeScreen() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const bottomInset = useContentBottomInset();
  const layoutMode = useSettingsStore((state) => state.layoutMode);

  if (layoutMode === 'assistant') {
    return <AssistantThread />;
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl + bottomInset,
          gap: spacing.md,
        }}
      >
        <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
          <Text variant="display">{t('home.title')}</Text>
          <Text variant="body" tone="muted">
            {t('home.subtitle')}
          </Text>
        </View>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="subtitle">{t('home.cardTitle')}</Text>
          <Text variant="body" tone="muted">
            {t('home.cardBody')}
          </Text>
        </Card>

        {BLOCKS.map((block) => (
          <Card key={block} style={{ gap: spacing.xs }}>
            <Text variant="subtitle">{t(`home.blocks.${block}.title`)}</Text>
            <Text variant="body" tone="muted">
              {t(`home.blocks.${block}.body`)}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
