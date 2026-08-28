# template-mobile

Template Expo (SDK 57, New Architecture) avec architecture feature-based.

## Stack

- expo-router + typed routes, TypeScript strict, alias `@/*` -> `src/*`
- TanStack Query v5 (server state), Zustand v5 + persist (client state UI uniquement)
- Wrapper fetch maison + zod (pas d'axios), react-native-mmkv v3 (façade `src/core/storage`)
- i18next + react-i18next + expo-localization (en/fr), theming tokens TS maison
- Env `EXPO_PUBLIC_*` validées par zod dans `src/core/env.ts` (fail fast au boot)

## Quickstart

```
make setup    # npm ci + typegen (types expo-router)
make ios      # build dev-client + run sur simulateur iOS
make dev      # dev server Expo (dev-client déjà installé)
```

`make help` liste toutes les cibles (setup, dev, qualité, tests, build, maintenance).
`make check` = lint + typecheck + tests, doit sortir en 0 avant tout merge.

> **Dev-client obligatoire — pas d'Expo Go.** react-native-mmkv est un module
> natif absent d'Expo Go : le premier lancement passe par `make ios` /
> `make android` (expo run) pour construire le dev-client. Les lancements
> suivants se contentent de `make dev`.

## Structure

```
src/
  app/       expo-router : layouts et écrans (fichiers = routes)
  core/      api (fetch+zod, queryClient), env.ts, storage (MMKV), i18n, theme
  shared/    components et hooks transverses, sans logique métier
  features/  posts, settings, ... (un dossier par domaine)
```

Règle de dépendance : `app -> features -> shared -> core`, jamais l'inverse,
jamais feature -> feature. Ce qui doit être partagé entre deux features descend
dans `shared/` ou `core/`.

## Navigation layouts

Quatre habillages de navigation, au choix dans Réglages → « Disposition de
navigation » (persisté via le store settings, clé `layoutMode` en MMKV) :

- **Onglets classiques** (`tabs`, défaut) — tab bar native en bas.
- **Îlot flottant** (`island`) — pill flottante au-dessus du contenu
  (`expo-router/ui` headless + `FloatingTabBar`).
- **Panneau latéral** (`sidebar`) — drawer type ChatGPT en slide
  (`expo-router/drawer`, vendorisé : aucun paquet `@react-navigation/*` à
  installer), hamburger + swipe de bord.
- **Assistant + discussions** (`assistant`) — fil natif
  `@assistant-ui/react-native` + runtime AI SDK, avec historique des discussions
  et liens de l'application dans un drawer latéral.

Le switcher vit dans `src/app/(tabs)/_layout.tsx`, les shells dans
`src/shared/navigation/`. Caveat : changer de disposition remonte l'arbre de
navigation — l'état des écrans (scroll, pile posts) est réinitialisé.

## Variables d'environnement

```
cp .env.example .env
```

- `EXPO_PUBLIC_API_URL` — URL http(s) du backend. Vide ou absente => la feature
  posts tourne sur ses mocks locaux (aucun appel réseau).
- `EXPO_PUBLIC_CHAT_ENDPOINT_URL` — endpoint compatible avec le flux UI Message
  du Vercel AI SDK. Une URL absolue est requise sur iOS/Android. Sans valeur,
  Assistant UI utilise `/api/chat`, pratique uniquement lorsqu'une route API
  est servie avec l'application web.
- Toutes les variables `EXPO_PUBLIC_*` sont validées par zod dans
  `src/core/env.ts` et inlinées au build par Metro : redémarrer `make dev`
  après modification du `.env`. Aucun secret dans ces variables : elles sont
  embarquées en clair dans le bundle.

## Ajouter une feature

1. Créer `src/features/<nom>/` : `api.ts` (schémas zod + appels via
   `apiFetch` de `@/core/api`), `hooks.ts` (TanStack Query, query keys
   centralisées), `components/`, `__tests__/`. Modèle : `src/features/posts/`.
2. État client UI persistant ? Un store zustand `store.ts` avec
   `createMMKVJSONStorage` de `@/core/storage` (jamais de donnée serveur
   dedans). Modèle : `src/features/settings/store.ts`.
3. Ajouter les écrans dans `src/app/` (seule couche qui importe la feature)
   et les clés i18n dans `src/core/i18n/locales/{en,fr}.json`.
4. Si `core` doit réagir à la feature (thème, langue), injecter la valeur
   depuis `src/app/_layout.tsx` — `core` n'importe jamais `features`.
5. `make check` doit rester vert.

## Scripts npm

- `npm run typegen` — régénère `.expo/types/router.d.ts` + `expo-env.d.ts`
  (obligatoire sur checkout frais, avant le premier typecheck)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `npm test` / `npm run test:coverage` / `npm run format`

## Tests

Jest + jest-expo, `@testing-library/react-native`. `jest.setup.ts` mocke MMKV
en mémoire et initialise i18next en mode test (les composants rendent les clés
brutes). `make test-watch` pour le mode watch.
