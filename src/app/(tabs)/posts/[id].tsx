import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { usePost } from '@/features/posts/hooks';
import { Card } from '@/shared/components/Card';
import { ErrorView } from '@/shared/components/ErrorView';
import { Screen } from '@/shared/components/Screen';
import { Spinner } from '@/shared/components/Spinner';
import { Text } from '@/shared/components/Text';

export default function PostDetailScreen() {
  // The generic is a type assertion only: at runtime `id` can be undefined on
  // first render or during a navigation transition. Never assume it exists.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = usePost(id);

  if (!id) {
    // Without an id the query stays disabled (isPending forever): show an
    // explicit error instead of an infinite spinner. No retry: it cannot help.
    return (
      <Screen edges={['left', 'right']}>
        <Stack.Screen options={{ title: t('posts.detailTitle', { id: '?' }) }} />
        <ErrorView />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: t('posts.detailTitle', { id }) }} />
      {isPending ? (
        <Spinner fill />
      ) : isError ? (
        <ErrorView onRetry={() => void refetch()} />
      ) : (
        <View style={{ gap: spacing.lg, paddingTop: spacing.sm }}>
          <Text variant="title" accessibilityRole="header">
            {data.title}
          </Text>
          <Card>
            <Text variant="body">{data.body}</Text>
          </Card>
        </View>
      )}
    </Screen>
  );
}
