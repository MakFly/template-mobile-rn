import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { PostCard } from '@/features/posts/components/PostCard';
import { usePosts } from '@/features/posts/hooks';
import { ErrorView } from '@/shared/components/ErrorView';
import { Screen } from '@/shared/components/Screen';
import { Spinner } from '@/shared/components/Spinner';
import { Text } from '@/shared/components/Text';
import { useContentBottomInset } from '@/shared/navigation/ContentBottomInset';

export default function PostsScreen() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isPending, isError, refetch, isRefetching } = usePosts();
  const bottomInset = useContentBottomInset();

  if (isPending) {
    return (
      <Screen>
        <Text variant="display">{t('posts.title')}</Text>
        <Spinner fill />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Text variant="display">{t('posts.title')}</Text>
        <ErrorView onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(post) => String(post.id)}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl + bottomInset,
          gap: spacing.md,
        }}
        ListHeaderComponent={
          <Text variant="display" style={{ marginBottom: spacing.sm }}>
            {t('posts.title')}
          </Text>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
            <Text variant="body" tone="muted">
              {t('posts.empty')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => {
              router.push({ pathname: '/posts/[id]', params: { id: String(item.id) } });
            }}
          />
        )}
      />
    </Screen>
  );
}
