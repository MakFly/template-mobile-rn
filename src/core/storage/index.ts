/**
 * Storage facade. The rest of the app depends on this interface only,
 * never on react-native-mmkv directly (swappable, mockable in tests).
 */
export interface KVStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export { createMMKVJSONStorage, mmkvStateStorage, storage } from './mmkv';
