import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createMMKVJSONStorage } from '@/core/storage';
import type { ThemePreference } from '@/core/theme';

/** 'system' follows the device language (en/fr supported). */
export type LocalePreference = 'system' | 'en' | 'fr';

/** Root navigation layout, including the Assistant UI thread drawer. */
export type LayoutMode = 'tabs' | 'island' | 'sidebar' | 'assistant';

export interface SettingsState {
  themePreference: ThemePreference;
  locale: LocalePreference;
  layoutMode: LayoutMode;
  setThemePreference: (themePreference: ThemePreference) => void;
  setLocale: (locale: LocalePreference) => void;
  setLayoutMode: (layoutMode: LayoutMode) => void;
}

type PersistedSettings = Pick<SettingsState, 'themePreference' | 'locale' | 'layoutMode'>;

export const SETTINGS_STORAGE_KEY = 'settings';

/**
 * Client-only UI state (never server state). Persisted synchronously through
 * the MMKV facade, so there is no hydration flash on cold start. The root
 * layout reads this store and injects the values into ThemeProvider / i18next
 * (core never imports features).
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      locale: 'system',
      layoutMode: 'tabs',
      setThemePreference: (themePreference) => set({ themePreference }),
      setLocale: (locale) => set({ locale }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createMMKVJSONStorage<PersistedSettings>(),
      partialize: (state): PersistedSettings => ({
        themePreference: state.themePreference,
        locale: state.locale,
        layoutMode: state.layoutMode,
      }),
    },
  ),
);
