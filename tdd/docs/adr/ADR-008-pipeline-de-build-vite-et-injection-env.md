# ADR-008 — Pipeline de build Vite et injection des variables d'environnement au build

**Statut :** amendé par [ADR-022](./ADR-022-chargement-dynamique-environnement.md) (injection d'environnement passée au runtime)  
**Date :** 07/10/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| REQ-003, REQ-108, Annexe A | Livrable standalone : un fichier JS unique (`clientsbox.js`) copié à la main |
| REQ-031, REQ-112, R-40 | `CURSOR_CLI_BIN` obligatoire **en build et en dev** ; build refusé si absente |
| Contrainte 1 | TypeScript, Node ≥ 24 |
| ADR-001 | « Un pipeline de build (bundle) est obligatoire avant distribution » — outil non choisi |
| ADR-003 | Binaire lu depuis `process.env.CURSOR_CLI_BIN`, échec explicite si absent |
| ADR-007 | Vitest (même écosystème que Vite) ; `vitest.config.ts` à la racine |
| SPEC-ARCH-03 / CASE-ARCH-03-5 | Seul `src/lib/process/env-layout.resolver.ts` (LIB-005) lit `process.env` |

Cet ADR **complète** l'ADR-001 : il choisit l'outil et les règles du pipeline de build, sans changer le format du livrable.

---

## Contexte

L'ADR-001 impose un livrable **JavaScript unique** produit par un bundle, mais ne choisit pas l'outil. Le CDC exige que `CURSOR_CLI_BIN` soit présente **au build** et en dev (REQ-031 / REQ-112), ce qui suppose que le build lise la configuration d'environnement.

Il faut trancher :
1. l'outil de bundling ;
2. la source et le format des variables d'environnement ;
3. la manière dont ces variables arrivent dans le livrable (lecture à l'exécution ou valeurs écrites en dur au build) ;
4. les commandes standard : développement avec rechargement, build, démarrage du livrable ;
5. l'isolation de ce mécanisme par rapport aux tests Vitest, qui modifient `process.env` pendant l'exécution (`tests/adpt/CASE-ADPT-02-*`, `03-*`).

---

## Options envisagées

### Option A — Vite (mode SSR / Node) + injection `define` au build (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Même écosystème que Vitest (ADR-007) : un seul moteur de transformation TS/ESM ; `loadEnv` natif pour lire `.env` ; `define` pour écrire les valeurs en dur ; mode `--watch` pour le dev ; base réutilisable pour bundler l'UI plus tard |
| Ce qu'elle coûte | Configuration SSR explicite (cible Node, tout embarquer dans un seul fichier) ; un petit plugin maison pour relancer Node en dev |
| Ce qu'elle rend difficile plus tard | Rien de bloquant ; Vite est maintenu et suit l'évolution de Rollup / Rolldown |

### Option B — esbuild seul

| | |
|---|---|
| Ce qu'elle apporte | Une commande, très rapide, `--platform=node` gère les modules natifs automatiquement |
| Ce qu'elle coûte | Deuxième outil de transformation à côté de Vitest ; lecture et validation du `.env` à écrire à la main |
| Ce qu'elle rend difficile plus tard | Unifier serveur et UI dans le même outil |

### Option C — Pas de bundle, `node --env-file=.env` à l'exécution

| | |
|---|---|
| Ce qu'elle apporte | Aucun outillage de build |
| Ce qu'elle coûte | Contredit ADR-001 / REQ-003 (fichier unique) ; Node ne réécrit pas les imports `.js` → `.ts` (NodeNext), donc ne lance pas les sources telles quelles |
| Ce qu'elle rend difficile plus tard | Distribuer le livrable par copie manuelle (REQ-108) |

---

## Décision

ClientsBox utilise **Vite** pour produire `dist/clientsbox.js` ; les variables déclarées dans `.env.example` sont lues dans `.env` puis **écrites en dur** dans le livrable au moment du build.

### 1. Fichiers d'environnement

| Fichier | Versionné | Rôle |
|---|---|---|
| `.env.example` | **Oui** | **Contrat** : liste exhaustive des clés attendues, avec des valeurs d'exemple ou vides et un commentaire par clé |
| `.env` | **Non** (`.gitignore`) | Valeurs réelles de la machine, utilisées par `dev` et par `build` |

- Un seul `.env` sert au dev et à la prod. Les variantes `.env.[mode]` et `.env.local` ne font pas partie du contrat.
- Le `.env` ne doit contenir **aucun secret** : ses valeurs se retrouvent en clair dans le livrable.

### 2. Validation au build (REQ-031 / REQ-112)

`vite.config.ts` lit les clés de `.env.example`, puis charge `.env` (`loadEnv(mode, root, '')`).
Si une clé manque ou est vide, le build et le dev **s'arrêtent** avec un message en français qui nomme la clé.

### 3. Injection en dur (liste blanche)

- Pour chaque clé `K` du contrat, `define` remplace l'expression `process.env.K` par sa valeur littérale (`JSON.stringify`).
- **Seules** les clés de `.env.example` sont injectées. Aucune autre variable de la machine de build n'entre dans le livrable.
- Le code doit lire ces clés avec la forme pointée `process.env.K`. La forme `process.env[k]` n'est pas remplacée.
- La lecture reste concentrée dans `src/lib/process/env-layout.resolver.ts` (LIB-005, SPEC-ARCH-03), sans changement.
- Les contrôles faits au démarrage (binaire présent et exécutable, ADR-003) restent actifs : la valeur est figée, sa validité est toujours vérifiée.

### 4. Forme du livrable

- Point d'entrée : `src/index.ts` (ROOT-001, Composition Root unique).
- `build.ssr` = `src/index.ts`, cible `node24`, format ESM.
- `ssr.noExternal: true` et un seul chunk : tout le code applicatif est dans **un seul fichier**. Les modules `node:*` restent des imports natifs.
- Sortie : `dist/clientsbox.js`, dossier vidé à chaque build, **minifié en production** via le compresseur natif OXC/Rolldown (`minify: 'oxc'`).

### 5. Commandes standard (`package.json`)

| Commande | Effet |
|---|---|
| `npm run dev` | `vite build --watch --mode development` + plugin de dev qui relance `node dist/clientsbox.js` après chaque build réussi |
| `npm run build` | `vite build --mode production` → `dist/clientsbox.js` |
| `npm start` | `node dist/clientsbox.js` (arguments transmis : `npm start -- -p 8080`) |
| `npm test` | Inchangé : `vitest run` (ADR-007) |

Règles du plugin de dev :
- il n'agit qu'en mode `watch` ;
- il envoie `SIGTERM` au processus en cours et **attend sa fin** avant d'en lancer un nouveau. Sinon le port reste occupé et R-35 fait échouer le redémarrage ;
- il transmet `stdout` / `stderr`, donc le lien du serveur s'affiche dans le terminal (REQ-102).

Le dev et la prod passent par **le même pipeline** (même `define`, même bundle).

### 6. Isolation des tests

- `vitest.config.ts` reste à la racine. Vitest le lit **à la place** de `vite.config.ts`, donc le `define` n'est jamais appliqué aux tests.
- Seconde protection : `define` n'est appliqué que si `command === 'build'`.
- Les tests continuent de modifier `process.env[...]` pendant l'exécution, comme aujourd'hui.

---

## Raisons

- REQ-031 / REQ-112 demandent `CURSOR_CLI_BIN` **au build**. Lire et valider `.env` dans la config de build applique cette exigence à la lettre.
- Écrire les valeurs en dur rend le livrable **autonome** : copié dans `.agents/`, il démarre avec `node clientsbox.js` sans `.env` à côté (REQ-108).
- Vite partage le moteur de Vitest (ADR-007) : un seul outil transforme le TypeScript pour les tests et pour le build.
- Utiliser `.env.example` comme liste blanche évite de faire entrer par accident des variables de la machine de build dans le livrable.
- Faire tourner le dev sur le même pipeline que la prod supprime les écarts dev/prod. Un serveur Node ne fait pas de HMR navigateur, donc le « hot reload » prend la forme d'un redémarrage automatique.

---

## Conséquences acceptées

- `vite` devient une `devDependency` explicite. Il est déjà présent en dépendance transitive de Vitest.
- Le livrable dépend de la machine qui l'a construit. `CURSOR_CLI_BIN` est un chemin absolu figé, donc il faut **rebuilder** pour une machine où ce chemin est différent.
- Aucune surcharge à l'exécution en prod : changer une variable demande un nouveau build.
- Les valeurs injectées sont lisibles en clair dans `dist/clientsbox.js`. Le `.env` ne doit pas contenir de secret.
- Vite ne vérifie pas les types : il retire les annotations sans les contrôler. La vérification de types (`tsc --noEmit`) reste un outil à part.
- `npm run dev` est lancé depuis la racine du dépôt, donc `workspacePath` = racine du dépôt (C-07). Les données de dev sont écrites dans `./.agents/data/` (ADR-005).
- Le livrable est un ESM nommé `.js`. Dans un projet hôte sans `"type"`, Node 24 détecte la syntaxe ESM tout seul. Si le projet hôte déclare `"type": "commonjs"`, le livrable ne démarrera pas tel quel.

---

## Ce qui nous ferait revenir dessus

- Besoin de configurer le livrable **à l'exécution** (un même binaire déployé sur plusieurs machines) : passer à une lecture runtime avec repli sur les valeurs du build.
- Besoin de mettre un **secret** dans la configuration.
- Projets hôtes en `"type": "commonjs"` fréquents : sortie `.mjs` ou format CJS.
- Décision d'embarquer l'UI (assets statiques) dans le fichier unique : à traiter dans un ADR dédié, en réutilisant ce pipeline.

---

## Liens

- Livrable et socle : **ADR-001**.
- `CURSOR_CLI_BIN` : **ADR-003**.
- Persistance `.agents/data/` : **ADR-005**.
- Framework de test et `vitest.config.ts` : **ADR-007**.
- Monopole `process.env` : **SPEC-ARCH-03** / `CASE-ARCH-03-5`.
