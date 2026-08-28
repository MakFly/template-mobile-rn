// Side-effect imports, on purpose and in this order:
// - core/env fails fast at boot if EXPO_PUBLIC_* vars are invalid,
// - core/i18n initializes i18next before the first render.
import '@/core/env';
import i18n, { getDeviceLanguage } from '@/core/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from '@/core/api';
import { ThemeProvider, useTheme } from '@/core/theme';
import { useSettingsStore } from '@/features/settings/store';

function RootNavigator() {
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  // Settings are injected top-down (core never imports features):
  // the store hydrates synchronously from MMKV, so there is no theme flash.
  const themePreference = useSettingsStore((state) => state.themePreference);
  const locale = useSettingsStore((state) => state.locale);

  useEffect(() => {
    const target = locale === 'system' ? getDeviceLanguage() : locale;
    if (i18n.language !== target) {
      void i18n.changeLanguage(target);
    }
  }, [locale]);

  return (
    // Required once at the root for gesture-driven navigation (drawer, swipes).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider preference={themePreference}>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
