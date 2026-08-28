// Setup global Jest (charge apres l'environnement de test, avant chaque suite).

// react-native-mmkv v4 (Nitro) : l'import de react-native-nitro-modules jette
// sous Jest (TurboModuleRegistry indisponible). On court-circuite le module en
// re-exportant le mock memoire OFFICIEL de la lib (createMockMMKV, celui que
// createMMKV utilise lui-meme quand il detecte JEST_WORKER_ID).
jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = jest.requireActual<{
    createMockMMKV: (config?: { id: string }) => unknown;
  }>('react-native-mmkv/lib/createMMKV/createMockMMKV');
  return { createMMKV: createMockMMKV };
});

// i18next en mode test : init minimale, ressources vides => les composants
// traduits rendent leurs cles brutes ("posts.title"), stables dans les snapshots
// et independantes de la langue de la machine de CI.
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  returnEmptyString: false,
  initAsync: false,
  interpolation: { escapeValue: false },
});
