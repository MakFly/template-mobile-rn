import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Drawer, DrawerToggleButton } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { useAui } from '@assistant-ui/react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { AssistantDrawerContent } from '@/features/assistant/components/AssistantDrawerContent';
import { AssistantIcon } from '@/features/assistant/components/AssistantIcon';
import {
  DrawerProgressBridge,
  SceneBlurOverlay,
  SIDEBAR_WIDTH,
  type DrawerProgress,
} from '@/shared/navigation/SidebarNav';

function NewThreadButton() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const aui = useAui();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('assistant.newThread')}
      hitSlop={spacing.sm}
      onPress={() => {
        aui.threads.switchToNewThread();
        router.navigate('/');
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, marginRight: spacing.md })}
    >
      <AssistantIcon name="compose" size={21} color={colors.text} />
    </Pressable>
  );
}

function AssistantDrawer() {
  const { colors, radii } = useTheme();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<DrawerProgress | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebar }}>
      <Drawer
        drawerContent={(props) => (
          <>
            <DrawerProgressBridge onProgress={setProgress} />
            <AssistantDrawerContent {...props} />
          </>
        )}
        screenOptions={{
          drawerType: 'back',
          drawerStyle: { width: SIDEBAR_WIDTH, backgroundColor: 'transparent' },
          overlayColor: 'transparent',
          swipeEnabled: true,
          swipeEdgeWidth: 48,
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => <DrawerToggleButton tintColor={colors.text} />,
          sceneStyle: {
            backgroundColor: colors.background,
            borderTopLeftRadius: radii.lg,
            borderBottomLeftRadius: radii.lg,
            overflow: 'hidden',
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: t('assistant.title'),
            headerTitle: t('assistant.title'),
            headerRight: () => <NewThreadButton />,
          }}
        />
        <Drawer.Screen
          name="c/[id]"
          options={{
            title: t('assistant.title'),
            headerTitle: t('assistant.title'),
            headerRight: () => <NewThreadButton />,
          }}
        />
        <Drawer.Screen name="posts" options={{ title: t('tabs.posts'), headerShown: false }} />
        <Drawer.Screen name="settings" options={{ title: t('tabs.settings') }} />
      </Drawer>
      {progress ? <SceneBlurOverlay progress={progress} /> : null}
    </View>
  );
}

export function AssistantNav() {
  return <AssistantDrawer />;
}
