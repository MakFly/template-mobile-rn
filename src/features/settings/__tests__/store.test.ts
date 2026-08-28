import { storage } from '@/core/storage';

import { SETTINGS_STORAGE_KEY, useSettingsStore } from '../store';

beforeEach(() => {
  storage.delete(SETTINGS_STORAGE_KEY);
  useSettingsStore.setState({ themePreference: 'system', locale: 'system', layoutMode: 'tabs' });
});

describe('settings store', () => {
  it('exposes system defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.themePreference).toBe('system');
    expect(state.locale).toBe('system');
    expect(state.layoutMode).toBe('tabs');
  });

  it('updates state and persists mutations through the KV facade', () => {
    useSettingsStore.getState().setThemePreference('dark');
    useSettingsStore.getState().setLocale('fr');

    expect(useSettingsStore.getState().themePreference).toBe('dark');
    expect(useSettingsStore.getState().locale).toBe('fr');

    const raw = storage.get(SETTINGS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string) as {
      state: { themePreference: string; locale: string; layoutMode: string };
    };
    expect(persisted.state).toEqual({ themePreference: 'dark', locale: 'fr', layoutMode: 'tabs' });
  });

  it('updates and persists the navigation layout mode', () => {
    useSettingsStore.getState().setLayoutMode('assistant');

    expect(useSettingsStore.getState().layoutMode).toBe('assistant');

    const persisted = JSON.parse(storage.get(SETTINGS_STORAGE_KEY) as string) as {
      state: { layoutMode: string };
    };
    expect(persisted.state.layoutMode).toBe('assistant');
  });

  it('does not persist the action functions (partialize)', () => {
    useSettingsStore.getState().setThemePreference('light');

    const persisted = JSON.parse(storage.get(SETTINGS_STORAGE_KEY) as string) as {
      state: Record<string, unknown>;
    };
    expect(Object.keys(persisted.state).sort()).toEqual([
      'layoutMode',
      'locale',
      'themePreference',
    ]);
  });

  it('rehydrates from a previously persisted value', async () => {
    storage.set(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ state: { themePreference: 'light', locale: 'en' }, version: 0 }),
    );

    await useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().themePreference).toBe('light');
    expect(useSettingsStore.getState().locale).toBe('en');
  });
});
