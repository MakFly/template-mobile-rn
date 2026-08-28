import { Pressable } from 'react-native';

import { useTheme } from '@/core/theme';
import { Card } from '@/shared/components/Card';
import { Text } from '@/shared/components/Text';

import type { Post } from '../api';

export interface PostCardProps {
  post: Post;
  onPress: () => void;
}

/** Tappable list row for a post: title + two-line excerpt. */
export function PostCard({ post, onPress }: PostCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={post.title}
      accessibilityHint={post.body}
    >
      {({ pressed }) => (
        <Card style={[{ gap: spacing.xs }, pressed && { backgroundColor: colors.surfaceAlt }]}>
          <Text variant="subtitle" numberOfLines={2}>
            {post.title}
          </Text>
          <Text variant="body" tone="muted" numberOfLines={2}>
            {post.body}
          </Text>
        </Card>
      )}
    </Pressable>
  );
}
