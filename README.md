# template-mobile

Template Expo (SDK 57, New Architecture) avec architecture feature-based.

## Stack

- expo-router + typed routes, TypeScript strict, alias `@/*` -> `src/*`
- TanStack Query v5 (server state), Zustand v5 + persist (client state UI uniquement)
- Wrapper fetch maison + zod avec exceptions typées, logger transversal ASCII/ANSI,
  react-native-mmkv v4 (façade `src/core/storage`)
- i18next + react-i18next + expo-localization (en/fr), theming tokens TS maison
- Env `EXPO_PUBLIC_*` validées par zod dans `src/core/env.ts` (fail fast au boot)

## Quickstart

```
make setup    # bun install + typegen (types expo-router)
make ios      # build dev-client + run sur simulateur iOS
make dev      # dev server Expo (dev-client déjà installé)
make web      # web ; mode headless automatique sur un serveur Linux
```

`make help` liste toutes les cibles (setup, dev, qualité, tests, build, maintenance).
`make check` = lint + typecheck + tests, doit sortir en 0 avant tout merge.

> **Dev-client obligatoire — pas d'Expo Go.** react-native-mmkv est un module
> natif absent d'Expo Go : le premier lancement passe par `make ios` /
> `make android` (expo run) pour construire le dev-client. Les lancements
> suivants se contentent de `make dev`.

Sur Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, `make web` désactive
automatiquement l'ouverture locale du navigateur et React Native DevTools. Le
serveur reste disponible sur `http://localhost:8081` ; via SSH, utiliser par
exemple `ssh -L 8081:localhost:8081 <hôte>` puis ouvrir cette URL localement.

## Structure

```
src/
  app/       expo-router : layouts et écrans (fichiers = routes)
  core/      api (fetch+zod, exceptions, queryClient), logger, env, storage, i18n, theme
  shared/    components et hooks transverses, sans logique métier
  features/  posts, settings, ... (un dossier par domaine)
```

Règle de dépendance : `app -> features -> shared -> core`, jamais l'inverse,
jamais feature -> feature. Ce qui doit être partagé entre deux features descend
dans `shared/` ou `core/`.

## Navigation sobre

Quatre habillages de navigation restent disponibles dans Réglages, sans palette
spécifique ni thème marketing :

- **Onglets classiques** (`tabs`, défaut) — barre native en bas.
- **Îlot flottant** (`island`) — navigation compacte au-dessus du contenu.
- **Panneau latéral** (`sidebar`) — drawer et navigation par geste.
- **Assistant + discussions** (`assistant`) — drawer dédié aux fils persistés.

Tous utilisent le thème neutre commun et le même runtime assistant. Changer de
disposition remonte la navigation, mais les discussions restent dans SQLite.

## Variables d'environnement

```
cp .env.example .env
```

- `EXPO_PUBLIC_API_URL` — URL http(s) du backend. Vide ou absente => la feature
  posts tourne sur ses mocks locaux (aucun appel réseau).
- `EXPO_PUBLIC_CHAT_ENDPOINT_URL` — endpoint compatible avec le flux UI Message
  du Vercel AI SDK. Une URL absolue est requise sur iOS/Android. Sans valeur,
  l'app utilise le endpoint `/v1/chat` de l'API assistant.
- `EXPO_PUBLIC_ASSISTANT_API_URL` — base de l'API Hono qui porte discussions,
  messages et chat. Par défaut : `localhost:3333` sur web/iOS Simulator et
  `10.0.2.2:3333` sur Android Emulator.
- Toutes les variables `EXPO_PUBLIC_*` sont validées par zod dans
  `src/core/env.ts` et inlinées au build par Metro : redémarrer `make dev`
  après modification du `.env`. Aucun secret dans ces variables : elles sont
  embarquées en clair dans le bundle.

## API assistant Hono/Bun

Le dossier `server/` est un workspace TypeScript séparé, organisé en domaine,
cas d'usage, ports et adapters. Il utilise `bun:sqlite` en WAL pour les fils et
messages, Hono pour HTTP et AI SDK + OpenAI pour le streaming.

```bash
cp server/.env.example server/.env
# renseigner OPENAI_API_KEY et OPENAI_MODEL uniquement côté serveur
make api
make web
```

Sans clé OpenAI, le CRUD des discussions fonctionne et `/v1/chat` répond 503
avec `MODEL_NOT_CONFIGURED`. `X-Installation-Id`, généré dans MMKV, sépare les
données locales mais ne remplace pas une authentification pour un déploiement
public. `make check` vérifie désormais l'app et l'API.

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

## Erreurs HTTP et logs

`apiFetch` transforme toutes les erreurs opérationnelles en sous-classes de
`AppException` : configuration, réseau, timeout, annulation, statut HTTP et
réponse invalide. Une `HttpException` conserve le statut et le corps JSON ou
texte du backend pour permettre à la feature de décider quoi afficher, mais ce
corps et les headers ne sont jamais écrits automatiquement dans les logs.

Le logger de `@/core/logger` expose `debug`, `info`, `warn`, `error` et
`child(scope)`. En développement, les appels HTTP produisent des lignes
corrélées et colorées (`-->`, `<--`, `<x-`). En production, seuls `warn` et
`error` restent actifs, sans couleur. Les métadonnées sensibles sont masquées ;
utiliser un logger enfant plutôt que `console.*` dans les features.

## Scripts Bun

- `bun run typegen` — régénère `.expo/types/router.d.ts` + `expo-env.d.ts`
  (obligatoire sur checkout frais, avant le premier typecheck)
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` / `bun run test` / `bun run test:coverage` / `bun run format`

## Ressources & profils Metro

Le bundler est configure « sobre » par defaut (`metro.config.js`) pour laisser le
poste disponible aux autres charges (agents, Xcode, conteneurs).

| Cible            | `METRO_MAX_WORKERS` | Heap node | Quand                                         |
| ---------------- | ------------------- | --------- | --------------------------------------------- |
| `make dev`       | 4                   | defaut    | defaut, dev quotidien                         |
| `make dev-fast`  | 10                  | 8 Go      | Metro seul au premier plan, gros rebuild      |
| `make dev-debug` | 1                   | defaut    | transformation in-band, stack traces lisibles |

Le seul levier mesure est `maxWorkers` : −36 % de RSS a froid cote Metro (17-18
workers ramenes a 4). On ne pose **pas** de `NODE_OPTIONS=--max-old-space-size=4096`
sur `dev` / `ios` / `android` : sur un poste 48 Go le heap V8 par defaut vaut deja
~4144 Mo, le flag est donc un **no-op** — et il serait hérité par tous les node
enfants, y compris ceux lances par Xcode via `make ios`. Seul `dev-fast` monte le
heap a 8 Go, ou l'effet est reel.

`make ios` / `make android` alignent le bundler sur le profil sobre : sinon Metro
repart a pleine charge pendant que Xcode/Gradle compilent.

`METRO_MAX_WORKERS` s'utilise aussi a la main devant n'importe quelle commande
Expo (`METRO_MAX_WORKERS=8 bunx expo export ...`). Valeur invalide -> retour a 4 ;
valeur superieure au nombre de coeurs -> clampee.

**Cache.** Expo place le cache transformer dans `os.tmpdir()/metro-cache` ; on le
deplace dans `node_modules/.cache/metro` (jest : `node_modules/.cache/jest`). Le
gain est de la **persistance**, pas de la vitesse : macOS purge periodiquement
`/var/folders`. Corollaire assume : `make clean-install` detruit ce cache.
`make clean-cache` le purge a la demande, `make clean` purge en plus `.expo/cache`
et `.expo/web` (jamais `.expo` en entier : `.expo/types/router.d.ts` porte les
routes typees et son absence casse `bun run typecheck`).

**Hygiene, pas gain : l'`exclude` du `tsconfig`.** C'est de l'**hygiene**, pas une
optimisation : mesure a −1 % de RSS et −3 % de wall sur `bun run typecheck`, soit
**sous le bruit de mesure (~15 %)**. Il documente une intention, il n'accelere rien.

**Pas de watchman ici, mais c'est une decision d'echelle, pas un dogme (mesure le
2026-08-29).** Attention au raccourci « Metro a rendu watchman obsolete » : c'est faux.
`@expo/metro-config` force `resolver.useWatchman = null` (`build/ExpoMetroConfig.js`), et
`metro-file-map` lit `useWatchman: options.useWatchman == null ? true : options.useWatchman`
(`src/index.js`) — le `null` d'Expo devient donc **true**. Expo **active** watchman par
defaut ; c'est seulement quand `checkWatchmanCapabilities` echoue (binaire absent) que
`#shouldUseWatchman()` retombe sur `false`. Ce meme drapeau pilote **deux** mecanismes
distincts, a ne pas confondre :

1. **Crawl initial** (lister l'arbre au demarrage) : crawler `watchman` vs crawler `node`
   (`metro-file-map/src/crawlers/`). Watchman est ici reellement plus rapide — c'est le
   « slow native find codepath » que redoute le commentaire d'Expo.
2. **Watch incremental** (detecter les changements ensuite) : `WatchmanWatcher` vs
   `NativeWatcher` (`fs.watch({recursive: true})`, adosse a FSEvents via libuv, donc natif
   kernel et non du polling). La, l'equivalence est reelle : watchman n'apporte rien, et le
   `FallbackWatcher` lent n'est jamais atteint sur macOS.

Chiffres releves sur un export iOS a froid avec `DEBUG='Metro:Watcher'` : le crawler node
retourne **33 573 fichiers (node_modules inclus) en 164 ms** pour un bundle de **10 054 ms /
2 411 modules**, soit **1,6 % du temps de bundle**. Le gain que watchman apporterait sur le
crawl vaut donc **164 ms au maximum** sur ce projet : le « slow native find » est un probleme
d'echelle Meta, pas d'un template de ~52 fichiers source. D'ou la decision : pas de
`brew install watchman`, pas de `.watchmanconfig` (il a ete supprime).

**Condition de peremption.** Si ce repo change d'ordre de grandeur (monorepo, milliers de
fichiers source), re-mesurer avant de conclure :

```bash
DEBUG='Metro:Watcher' bunx expo export --platform ios --output-dir /tmp/x --clear
```

puis lire la ligne `Crawler "node" returned N added/modified`. Ne pas reintroduire watchman
au motif que « c'est la best practice React Native » sans une mesure qui contredise celle-ci.

**Honnetete sur le blockList.** `@expo/metro-config` exclut deja `ios/Pods`,
`android/app/build`, `android/.gradle` et `.expo/types`. L'exclusion ajoutee ici
(`.expo`, `.playwright-mcp`, `coverage`, `dist`, `web-build`) est de l'hygiene a
gain marginal — le gros du crawl etait deja traite.

**Ne jamais valider un blockList sur le code retour d'`expo export`.** Un blockList
trop large ne provoque **pas** d'erreur de resolution : mesure ici, un blockList
avalant `src/` fait sortir `expo export` en **RC=0 sans le moindre warning**, en
produisant un bundle de **1,7 Mo / 1034 modules** au lieu de **5,5 Mo / 2391**. La
raison : le `require.context` d'expo-router recoit simplement un contexte vide, ce
qui est un resultat valide pour Metro. Les deux seuls controles valables sont :

1. le **compte de modules** affiche par le log Metro
   (`bunx expo export --platform ios 2>&1 | grep -i modules`) ;
2. un **diff d'ensembles de sources** entre les sourcemaps avant/apres
   (aucune source disparue, aucune apparue).

## Tests

Jest + jest-expo, `@testing-library/react-native`. `jest.setup.ts` mocke MMKV
en mémoire et initialise i18next en mode test (les composants rendent les clés
brutes). `make test-watch` pour le mode watch.
