import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

const supportedLanguages = Object.keys(resources);

/**
 * Best-match device language, falling back to English.
 * Exported so the root layout can resolve the 'system' locale preference.
 */
export function getDeviceLanguage(): string {
  const deviceLanguage = getLocales()[0]?.languageCode;
  return deviceLanguage && supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
}

// Sync init (initAsync: false): translations are bundled, no need to suspend the first render.
// eslint-disable-next-line import/no-named-as-default-member -- `.use` is the i18n instance method, not the `use` named export.
void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  initAsync: false,
  interpolation: {
    // React already escapes interpolated values.
    escapeValue: false,
  },
});

export default i18n;
