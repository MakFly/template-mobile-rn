import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';

export default function PostsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Header hidden, but `title` is still required: the native back button
          of the detail screen reuses the previous screen's title — without it
          iOS shows the raw route name ("< index"). */}
      <Stack.Screen name="index" options={{ title: t('tabs.posts') }} />
      {/* Native header on the detail screen: free back button + swipe gesture. */}
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
