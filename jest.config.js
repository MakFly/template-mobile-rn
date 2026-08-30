/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  // Pattern documenté par Expo : match par PRÉFIXE (pas de "/" final), sinon
  // expo-modules-core / expo-router / react-native-mmkv ne sont pas transformés.
  transformIgnorePatterns: [
    'node_modules/(?!((\\.bun/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)))',
  ],
  // Le défaut jest (coeurs - 1) lance 17 process workers pour 2 suites : chaque
  // worker recharge le preset jest-expo, d'où ~1,1 Go cumulés. 2 suffit ici.
  // En CI on repasse en relatif ('50%'), la machine y étant dédiée.
  maxWorkers: process.env.CI ? '50%' : 2,
  // Cache dans le projet (même logique que Metro : survit aux purges de /var/folders).
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  // Evite que jest-haste-map crawle les dossiers natifs générés (ios/ seul pèse
  // ~9,5k fichiers) et les artefacts de build.
  modulePathIgnorePatterns: ['<rootDir>/ios/', '<rootDir>/android/', '<rootDir>/dist/'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/server/'],
};
