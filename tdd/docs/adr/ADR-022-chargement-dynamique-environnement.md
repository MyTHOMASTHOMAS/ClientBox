# ADR-022 — Chargement dynamique des variables d'environnement au runtime, architecture modulaire de configuration et découplage du build Vite

**Statut :** proposé  
**Date :** 17/11/2026  
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
| REQ-046, R-50 | Chargement dynamique d'environnement au runtime (`env/.env` par défaut et flags `-e` / `--env <path>`) |
| REQ-031, REQ-112, R-40 | Présence des 3 binaires CLI d'agents (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) obligatoire au **runtime uniquement** (démarrage du serveur ou de `--exec-scene`) |
| REQ-002, REQ-005, R-35 | Priorité de résolution du port HTTP (`-p` CLI > variable `PORT` > défaut 2974) |
| REQ-003, REQ-108 | Livrable standalone JavaScript unique (`clientsbox.js`), portable et exécutable sur n'importe quel environnement sans recompilation |
| SPEC-ARCH-01 | Règle de DAG stricte pour `src/config/` (types purs en entrée, importé exclusivement par `src/services/config/`) |
| SPEC-ARCH-03, CASE-ARCH-03-5 | Monopole d'accès `process.env` et `process.cwd()` réservé à `src/lib/process/env/` (`env.engine.ts`, `env.layout.ts`) |
| ADR-001 | Socle applicatif standalone Node.js ≥ 24 |
| ADR-008 | Pipeline de build Vite : la présente décision **abroge et remplace la section injection statique (`define`)** d'ADR-008 ; le bundling SSR reste intact |
| CR-003, CDC v2.2 | Entretiens source et formalisation du contrat d'usage |

Cet ADR **amende l'ADR-008** : il supprime le « baking » statique des variables d'environnement au build et instaure un chargement 100 % dynamique au runtime dans Node.js 24, découplé en moteurs réutilisables, schémas déclaratifs et service d'orchestration.

---

## Contexte

Dans l'ADR-008, ClientsBox utilisait la clause `define` de Vite (`vite.config.ts`) pour injecter en dur les variables d'environnement (`process.env.KEY`) dans le fichier produit `dist/clientsbox.js` lors de `npm run build`.

Ce choix initial présentait trois limitations critiques devenues bloquantes :
1. **Livrable non portable :** `dist/clientsbox.js` contenait les chemins absolus (`CURSOR_CLI_BIN`, etc.) et la configuration de la machine de build. Déployer ClientsBox sur une autre machine nécessitait de recompiler le code.
2. **Accès indexés et inopérance du kill-switch des logs :** Le sous-système de logging accédant dynamiquement aux variables via `env['LOGS_DISABLED']`, Vite n'effectuait aucune substitution textuelle. Les journaux continuaient de s'afficher même lorsque `LOGS_DISABLED=true` figurait dans le `.env`.
3. **Rigidité au build :** La compilation échouait si un fichier `.env` complet n'était pas configuré sur la machine qui construisait le livrable, empêchant les builds neutres en CI/CD.

L'utilisateur exige désormais (`CR-003`, `CDC v2.2`) un modèle **100 % dynamique au runtime** :
- Le fichier `dist/clientsbox.js` ne contient aucune valeur de configuration écrite en dur.
- Par défaut, l'application cherche sa configuration dans `env/.env`. Si ce fichier est absent, **ce n'est pas une erreur** : ClientsBox démarre en s'appuyant sur les variables déjà injectées dans `process.env`.
- L'opérateur peut spécifier un fichier personnalisé via `-e <chemin>` ou `--env <chemin>`. Si le fichier indiqué n'existe pas, ClientsBox s'arrête **immédiatement avec une erreur fatale explicite**.
- Les **trois binaires CLI d'agents** (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) sont obligatoires dès le démarrage. Si l'un quelconque est absent, vide ou non exécutable, le démarrage est refusé avec renvoi explicite vers `env/.env.example`.
- L'architecture de configuration doit séparer rigoureusement les **moteurs génériques réutilisables** (moteur de parsing CLI, moteur de validation d'environnement), la **configuration déclarative** (`src/config/`), et l'**orchestration applicative** (`ConfigService`).

---

## Options envisagées

### Option A — Cascade multi-fichiers avec dépendance externe (`dotenv-flow`)

| | |
|---|---|
| Ce qu'elle apporte | Gestion automatique d'une arborescence complète (`.env`, `.env.local`, `.env.development`, `.env.test`) |
| Ce qu'elle coûte | Ajout d'une dépendance npm externe au runtime ; complexité inutile pour un outil standalone mono-développeur ; risque de comportements imprévisibles selon l'ordre des cascades |
| Ce qu'elle rend difficile plus tard | Le contrôle déterministe et l'isolation des tests unitaires dans Vitest sans polluer l'OS |

### Option B — Chargement dynamique natif Node.js 24 avec orchestrateur léger (Retenue)

| | |
|---|---|
| Ce qu'elle apporte | **Zéro dépendance npm supplémentaire** : s'appuie sur `node:util.parseEnv` et `node:fs` natifs de Node.js 24 ; logique simple et explicite (~30 lignes) ; résilience sur `env/.env` et fermeté sur `-e` inexistant ; 100 % testable unitairement en mémoire |
| Ce qu'elle coûte | Écriture d'un module d'orchestration dans `src/lib/process/` |
| Ce qu'elle rend difficile plus tard | Rien de bloquant ; extension ultérieure possible si de nouveaux fichiers de profils d'environnement sont requis |

---

## Décision

ClientsBox adopte l'**Option B** : la configuration d'environnement devient **100 % dynamique au runtime**. L'injection statique `define` de Vite est intégralement retirée de `vite.config.ts`.

### 1. Découplage de Build (`vite.config.ts`)
- `vite.config.ts` ne contient plus aucune clause `define` remplaçant `process.env.*`.
- Le build ne vérifie plus la présence de `.env` : `npm run build` réussit sur n'importe quelle machine ou conteneur CI sans configuration préalable.
- Le livrable `dist/clientsbox.js` est universel et distribuable par simple copie (REQ-108).

### 2. Emplacement par défaut : `env/.env` (Résilience totale)
- Au démarrage, ClientsBox recherche le fichier `env/.env` (résolu par rapport au répertoire de travail `workspacePath = process.cwd()`).
- Si le fichier `env/.env` est **absent**, aucune erreur n'est levée. L'application poursuit son amorçage en exploitant les variables déjà présentes dans `process.env` (shell OS, conteneur Docker, CI).

### 3. Option CLI explicite : `-e` ou `--env <chemin>` (Fermeté)
- Formes reconnues par le moteur générique de flags (`args-parser.engine.ts`) selon le schéma `CLIENTSBOX_CLI_SCHEMA` (`src/config/cli-flags.config.ts`) : `-e <path>`, `--env <path>`, `--env=<path>`.
- Si l'opérateur fournit un chemin de fichier et que ce fichier **n'existe pas sur le disque**, ClientsBox s'arrête **immédiatement avec une erreur fatale explicite en français** (`EnvLoadError`), car une configuration expressément demandée ne peut être honorée.

### 4. Architecture Modulaire : Contrats, Schémas Déclaratifs, Moteurs et DAG

Pour garantir la maintenabilité, la réutilisabilité et l'étanchéité architecturale la plus stricte (sans exception dans le DAG), la gestion de la configuration est découpée en 4 strates distinctes découplées par Inversion de Dépendance (DIP) :

1. **Contrats déclaratifs purs (`src/types/contracts/`) :**
   - **`cli-parser.contract.ts`** (`TYPES-014`) : formalise les types des options et du résultat du parsing CLI (`CliOptionSpec`, `CliParserSchema`, `CliParseResult`).
   - **`env-schema.contract.ts`** (`TYPES-015`) : formalise les types des descripteurs de variables d'environnement (`EnvFieldDescriptor`, `EnvSchema`, `EnvEngineResult`).
   - Purement déclaratifs (zéro runtime, zéro I/O), importables par tous.

2. **Configuration déclarative passive (`src/config/`) :**
   - Regroupe les schémas statiques et valeurs par défaut : `constants.config.ts` (constantes et ports par défaut), `cli-flags.config.ts` (`CLIENTSBOX_CLI_SCHEMA`), et `env.config.ts` (`CLIENTSBOX_ENV_SCHEMA`).
   - **Règle de DAG stricte :**
     - **Imports entrants autorisés vers `src/config/` :**
       1. `src/types/` : types purs uniquement (`import type`, ex: `CliParserSchema` per `TYPES-014`, `EnvSchema` per `TYPES-015`).
       2. `src/utils/` : **tout** (types et valeurs : primitives, constantes, utilitaires purs).
       3. `src/lib/` : **STRICTEMENT INTERDIT** (aucun import, ni runtime ni types). `config/` ne connaît aucun module d'infrastructure.
     - **Imports sortants :** `src/config/` ne peut être importé **exclusivement que par `src/services/config/config.service.ts`**.
     - **Interdictions formelles :** Ni `src/domain/` (afin de préserver l'isomorphisme pur sans I/O et d'empêcher toute fuite de configuration serveur vers le frontend navigateur `ui/`), ni `src/index.ts` (qui doit obligatoirement passer par `ConfigService`), ni aucun contrôleur ou composant de `lib/` ou de `ui/` n'a le droit d'importer `src/config/`.

3. **Moteurs génériques purs (`src/lib/process/`) :**
   - **`args-parser/`** (`args-parser.engine.ts`, `args-parser.types.ts`) : moteur agnostique de parsing des options CLI, validant les types (boolean, number, string, enum) et les collisions d'options selon le contrat `CliParserSchema`.
   - **`env/`** (`env.engine.ts`, `env.validators.ts`, `env.layout.ts`, `env.types.ts`) : moteur de validation et d'injection des variables d'environnement interprétant le contrat `EnvSchema`. Il détient l'exclusivité des validations I/O hôte (`requireExecutablePath`).
   - **Monopole d'accès `process.env` / `process.cwd()` :** Seuls `src/lib/process/env/env.engine.ts` et `src/lib/process/env/env.layout.ts` détiennent le droit d'accéder directement à `process.env` et `process.cwd()` (`SPEC-ARCH-03`, `CASE-ARCH-03-5`).

4. **Orchestration et Déploiement applicatif (`src/services/config/`) :**
   - Le service `ConfigService` (`config.service.ts`, `config.types.ts`) est l'unique guichet d'instanciation de la configuration.
   - Sa méthode `deploy(cliArgs)` orchestre l'exécution du parseur de flags CLI, initialise le moteur d'environnement, contrôle l'intégrité globale et produit l'objet immuable et fortement typé `AppConfig`.

### 5. Validation des 3 Binaires d'Agents Obligatoires & Valeurs par Défaut
- **Binaires CLI obligatoires :** Les **trois CLI d'agents embarqués** (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**) sont **tous obligatoires** au démarrage. Chaque exécutable est validé via le validateur `requireExecutablePath` : le fichier doit exister sur le disque hôte et disposer des permissions d'exécution. Si l'un quelconque fait défaut ou est invalide, l'application s'arrête immédiatement avec une erreur fatale explicite renvoyant vers `env/.env.example`.
- **Valeurs par défaut assignées :**
  - `PORT` : `2974` (défaut nominal C-04 / REQ-005)
  - `HOST` : `127.0.0.1` (défaut C-11 / SPEC-SRV-02)
  - `AGENTS_DIR` : `.agents` (défaut ADR-005)
  - `CALL_SCENARIO_MAX_DEPTH` : `-1` (illimité, REQ-041)
  - `NODE_ENV` : `development`
  - `LOGS_DISABLED` : `false`
  - `ANTIGRAVITY_PROBE_TIMEOUT_MS` : `15000`
  - `CODEX_PROBE_TIMEOUT_MS` : `15000`
- **Priorité de résolution du port HTTP :**
  1. Option CLI explicite : `-p <port>` ou `--port <port>` (priorité maximale).
  2. Variable `PORT` (du fichier d'environnement ou de `process.env`).
  3. Constante par défaut `DEFAULT_SERVER_PORT = 2974`.

### 6. Résolution du Kill-Switch des Logs (`LOGS_DISABLED`)
- L'appel à `new ConfigService().deploy(process.argv.slice(2))` est placé en **toute première instruction** de la fonction `main()` dans `src/index.ts`.
- La variable `LOGS_DISABLED=true` (si présente dans `env/.env`, `-e` ou le shell) est ainsi injectée dans `process.env` avant toute importation dynamique ou émission de logs par le système, garantissant le silence absolu de la console dès le démarrage.

---

## Raisons

- **Portabilité :** Permet à un même fichier `dist/clientsbox.js` d'être distribué et exécuté partout sans recompilation.
- **Simplicité & Déterminisme :** L'approche retenue n'embarque aucun framework d'environnement complexe et repose sur des APIs standard de Node.js 24.
- **Résilience opérationnelle :** Permet une exécution transparente en conteneur ou environnement CI (où les variables sont souvent injectées directement dans le shell OS sans fichier `.env`).
- **Fiabilité ergonomique :** Empêche le lancement silencieux avec de mauvais paramètres si l'utilisateur spécifie un fichier `-e` erroné.
- **Conformité architecturale :** Préserve l'isolation stricte des accès système (`CASE-ARCH-03-5`).

---

## Conséquences acceptées

- La détection des binaires d'agents obligatoires manquants ou non exécutables (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**) intervient désormais au **lancement de l'application** et non plus pendant le build.
- Le fichier `env/.env` remplace le `.env` à la racine pour la configuration par défaut (déjà ignoré par `.gitignore`).
- L'inventaire architectural des modules signés et les règles de conformité DAG intègrent formellement la séparation en 3 strates : moteurs génériques sous `src/lib/process/` (`args-parser/`, `env/`), schémas déclaratifs sous `src/config/` (accès réservé exclusivement à `services/config/`), et service orchestrateur `ConfigService` sous `src/services/config/`.
- Si l'utilisateur modifie `env/.env` pendant que ClientsBox tourne, un redémarrage du processus est nécessaire pour prendre en compte les changements.

---

## Ce qui nous ferait revenir dessus

- Besoin exprimé d'un rechargement à chaud (hot reload) des variables d'environnement en cours d'exécution sans redémarrage.
- Nécessité de supporter des formats de configuration alternatifs (JSON, YAML ou TOML).

---

## Liens

- Amende et remplace la section injection d'environnement de l'**ADR-008**.
- Conforme au socle applicatif **ADR-001** et à la persistance **ADR-005**.
- Aligné avec le Cahier des charges **CDC v2.2** (`REQ-046`, `R-50`).
- Respecte le monopole `process.env` **SPEC-ARCH-03** / `CASE-ARCH-03-5`.
