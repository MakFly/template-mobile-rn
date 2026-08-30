// Metro — profil « sobre » par defaut. Voir README > « Ressources & profils Metro ».
// Rappel : @expo/metro-config active `transformer.unstable_workerThreads`, donc les
// workers sont des THREADS dans le process node, pas des forks. `maxWorkers` reste
// malgre tout le levier RAM (heap partagee + caches Babel par worker).
const os = require('node:os');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// 1. Nombre de workers, pilotable par env.
//    Defaut 4 : les ~52 fichiers source de ce template sont largement couverts par
//    4 threads Babel, et il reste 14 des 18 coeurs pour le reste du poste (agents,
//    Xcode, OrbStack). `METRO_MAX_WORKERS` permet la bascule (cf. `make dev-fast`).
//    Sous 2, le worker farm de Metro bascule en transformation in-band.
const MAX_WORKERS_DEFAULT = 4;
const parsedMaxWorkers = Number.parseInt(process.env.METRO_MAX_WORKERS ?? '', 10);
config.maxWorkers =
  Number.isInteger(parsedMaxWorkers) && parsedMaxWorkers > 0
    ? Math.min(parsedMaxWorkers, os.availableParallelism())
    : MAX_WORKERS_DEFAULT;

// 2. Cache transformer dans le projet.
//    Expo place son store dans `os.tmpdir()/metro-cache`. Le deplacer ici n'achete
//    PAS de la vitesse : ca achete de la PERSISTANCE, macOS purgeant periodiquement
//    /var/folders. Contrepartie assumee : `make clean-install` (rm -rf node_modules)
//    le detruit ; `make clean-cache` le purge a la demande.
//
//    On REUTILISE la classe du store instancie par Expo (`BinaryFileStore`) au lieu
//    d'importer `metro-cache` : (a) `metro-cache` est hoiste mais non declare ici,
//    donc un arbre de dependances resolu autrement casserait le bundler au demarrage ;
//    (b) le `FileStore` vanilla ecrit avec un `writeFile` direct, alors que le store
//    d'Expo ecrit en tmp + rename (retry EPERM/EBUSY) et unlink une entree corrompue
//    a la lecture — deux Metro concurrents (`make dev` + un `expo export`) ne peuvent
//    donc pas empoisonner une cle. Seule la racine change, le comportement non.
const metroCacheRoot = path.join(projectRoot, 'node_modules/.cache/metro');
const defaultStores = Array.isArray(config.cacheStores) ? config.cacheStores : [];
const ExpoCacheStore = defaultStores.length === 1 ? defaultStores[0].constructor : undefined;
if (typeof ExpoCacheStore === 'function') {
  config.cacheStores = [new ExpoCacheStore({ root: metroCacheRoot })];
} else {
  // Degradation SUR : si @expo/metro-config change la forme de `cacheStores`, on
  // garde son defaut (cache dans /var/folders) plutot que de casser le demarrage.
  // La persistance est un confort, pas une condition de correction.
  console.warn(
    '[metro.config] cacheStores inattendu, cache Metro laisse au defaut Expo (os.tmpdir()).',
  );
}

// 3. blockList — CONCATENATION uniquement.
//    Expo definit deja un blockList couvrant `ios/Pods`, `android/app/build`,
//    `android/.gradle` et `.expo/types` : le gros du crawl est donc deja traite,
//    ce qui suit est de l'hygiene a gain marginal (artefacts de build locaux).
//    `config.resolver.blockList` peut valoir undefined | RegExp | RegExp[] selon la
//    version : le `[].concat(... ?? [])` est obligatoire, ne pas le simplifier.
//    ATTENTION : un blockList ne se valide JAMAIS sur le code retour d'`expo export`
//    (cf. README > « Ressources & profils Metro »), mais sur le compte de modules.
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const extraBlockedDirs = ['.expo', '.playwright-mcp', 'coverage', 'dist', 'web-build'];
const extraBlockList = new RegExp(
  `^${escapeRegExp(projectRoot + path.sep)}(?:${extraBlockedDirs.map(escapeRegExp).join('|')})(?:${escapeRegExp(path.sep)}.*)?$`,
);
config.resolver.blockList = [...[].concat(config.resolver.blockList ?? []), extraBlockList];

module.exports = config;
