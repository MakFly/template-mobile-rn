import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

import type { KVStorage } from './index';

const mmkv = createMMKV({ id: 'app-storage' });

/** Sync KV store backed by MMKV. */
export const storage: KVStorage = {
  get: (key) => mmkv.getString(key) ?? null,
  set: (key, value) => {
    mmkv.set(key, value);
  },
  delete: (key) => {
    mmkv.remove(key);
  },
};

/** MMKV adapter for zustand/persist (sync, no async hydration flash). */
export const mmkvStateStorage: StateStorage = {
  getItem: (name) => storage.get(name),
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};

/**
 * Typed JSON storage for zustand/persist:
 *   persist(creator, { name: 'settings', storage: createMMKVJSONStorage<SettingsState>() })
 */
export function createMMKVJSONStorage<S>() {
  return createJSONStorage<S>(() => mmkvStateStorage);
}
