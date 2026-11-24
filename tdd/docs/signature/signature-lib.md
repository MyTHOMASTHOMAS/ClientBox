# Signature de Domaine — `src/lib/` (Palier 4 : I/O & Connecteurs Techniques Système)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `LIB`  
**Couche DAG :** `4-lib` *(I/O & Infrastructure OS — Monopole des interactions avec le système de fichiers, processus et réseau)*  
**Peut importer :** `types/`, `utils/`  
**Peut être importé par :** `services`, `index.ts`  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`, `SPEC-ARCH-03`), [`SRV.md`](../specs/SRV.md) (`SPEC-SRV-01`, `SPEC-SRV-02`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-01`, `SPEC-DATA-02`, `SPEC-DATA-04`, `SPEC-DATA-05`), [`ADPT.md`](../specs/ADPT.md) (`SPEC-ADPT-01`..`03`), décisions d'architecture ([`ADR-001`](../adr/ADR-001-socle-applicatif.md), [`ADR-002`](../adr/ADR-002-gestionnaire-de-processus-cli.md), [`ADR-003`](../adr/ADR-003-cursor-cli-adapter.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md), [`ADR-006`](../adr/ADR-006-strategie-et-harnais-de-test.md), [`ADR-012`](../adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-017`](../adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`lib/`** matérialise le **Palier 4 et le monopole exclusif des entrées/sorties système** de ClientsBox.  
Sa responsabilité unique est de fournir des connecteurs techniques robustes pour le système de fichiers, les sous-processus CLI, les variables d'environnement et le serveur HTTP local, tout en restant strictement aveugle aux règles métier des scénarios.

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 4

1. **Monopole des Effets de Bord (`SPEC-ARCH-03`, `CASE-ARCH-03-1`) :**
   - `lib/` est l'unique couche autorisée à importer les modules système Node.js : `fs`, `child_process`, `os`, `path`, `net`, `http`, `url`, `vm`, `module`, `process`.
   - Tout import d'I/O en dehors de `lib/` est une violation architecturale bloquante.
2. **Aveugle au Domaine Métier (`SPEC-ARCH-03`, `CASE-ARCH-03-3`) :**
   - Les modules de `lib/` ne connaissent ni les entités du domaine (`Agent`, `Scenario`, `BlockMessage`), ni les algorithmes de join, ni la topologie du canvas.
   - Ils n'importent jamais `domain/`.
3. **Écriture Atomique & Résilience aux Pannes (`SPEC-DATA-04`, `CASE-DATA-04-1`) :**
   - Tout fichier JSON écrit sous `.agents/data/` transite obligatoirement par `json-atomic-writer.fs.ts` (écriture dans un fichier `.tmp` adjacent + `fs.renameSync` atomique).
4. **Lecture Fraîche Sans Cache Opaque (`disk-as-truth`) :**
   - Aucune fonction de lecture ne conserve de cache en mémoire : chaque appel consulte l'état frais du disque pour garantir la fidélité multi-processus.
5. **Déterminisme des Tests & Mocking Systématique (`ADR-006`) :**
   - Les sous-processus `child_process.spawn` sont systématiquement mockés en tests unitaires via des simulateurs d'`EventEmitter` (`stdout`, `stderr`, `exit`).

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 4 — Connecteurs Système)

Dans le DAG macro, `lib/` dépend de `types/` et `utils/`, n'a aucun lien avec `domain/`, et est consommé par `services/` et `index.ts` :

```text
       ┌───────────────────────────────┐
       │       types/ & utils/         │
       └───────────────▲───────────────┘
                       │
                       │ (Contrats et primitives pures)
                       │
       ┌───────────────┴───────────────┐
       │        lib/ (Palier 4)        │ ◄─── Monopole exclusif des I/O
       │   fs, process, adapters, http │      Zéro connaissance du domaine
       └───────▲───────────────▲───────┘
               │               │
               │               └───────────────────────────────┐
               │                                               │
       ┌───────┴───────┐                               ┌───────┴───────┐
       │   services/   │                               │   index.ts    │
       └───────────────┘                               └───────────────┘
```

### 2.2 Micro-DAG Intra-Couche (Ordre Topologique des 4 Sous-Systèmes)

Au sein de `lib/`, les dépendances internes suivent un ordre topologique unilatéral strict interdisant tout retour en arrière :

$$\text{fs} \prec \text{process} \prec \text{adapters} \prec \text{http}$$

```text
       ┌───────────────────────────────┐
       │             fs/               │ (Écriture atomique, lecture fraîche, suppression)
       └───────────────▲───────────────┘
                       │
       ┌───────────────┴───────────────┐
       │           process/            │ (spawner child_process, env-resolver)
       └───────────────▲───────────────┘
                       │
       ┌───────────────┴───────────────┐
       │           adapters/           │ (CursorCLIAdapter consommant env-resolver & spawner)
       └───────────────▲───────────────┘
                       │
       ┌───────────────┴───────────────┐
       │             http/             │ (MiniRouter, body-parser, static-handler, http-server)
       └───────────────────────────────┘
```

> **Garanties d'acyclicité dans `src/lib/` :**  
> `fs/` est la feuille technique (zéro dépendance interne dans `lib/`).  
> `process/` manipule les flux OS et variables d'environnement sans importer `adapters/` ni `http/`.  
> `adapters/` assemble les binaires CLI (`cursor/`, `antigravity/`, `codex/`) en consommant `process/child-process.spawner.ts` et `process/env/env.layout.ts`.  
> `http/` assure l'écoute locale et la distribution statique de façon étanche.

---

## 3. Inventaire & Arborescence des Fichiers (`src/lib/`)

```text
src/lib/
├── fs/                                         # Micro-DAG 4.1 : Accès disque atomique & chargement module
│   ├── json-atomic-writer.fs.ts                # [LIB-001] Écriture JSON atomique (.tmp + renameSync)
│   ├── text-atomic-writer.fs.ts                # [LIB-019] Écriture texte/Markdown atomique (ex-docs-writer)
│   ├── json-fresh-reader.fs.ts                 # [LIB-002] Lecture fraîche JSON sans cache disque
│   ├── file-remover.fs.ts                      # [LIB-011] Suppression physique sécurisée et idempotente
│   └── dynamic-module-loader.fs.ts             # [LIB-003] Import dynamique JS CJS/ESM (ex-if-loader)
├── process/                                    # Micro-DAG 4.2 : Sous-processus OS, signaux & environnement
│   ├── args-parser/                            # Moteur générique de parsing d'options CLI selon schéma
│   │   ├── args-parser.engine.ts               # [LIB-012] Moteur de parsing CLI selon schéma déclaratif
│   │   ├── args-parser.error.ts                # [LIB-029] Erreur typée ServerCliParseError du parseur CLI
│   │   ├── args-parser.matcher.ts              # [LIB-030] Détection et appariement des options de tokens CLI
│   │   ├── args-parser.types.ts                # [LIB-023] Contrats et types des options et du schéma CLI
│   │   └── index.ts                            # [LIB-024] Façade publique du moteur de parsing CLI
│   ├── env/                                    # Moteur de chargement dynamique et validation d'environnement
│   │   ├── env.engine.ts                       # [LIB-025] Moteur de chargement env/.env et injection process.env
│   │   ├── env.executable.ts                   # [LIB-032] Validation des binaires exécutables sur le système hôte
│   │   ├── env.layout.ts                       # [LIB-005] Résolution variables d'env et chemins workspace
│   │   ├── env.types.ts                        # [LIB-026] Types et interfaces du moteur d'environnement
│   │   ├── env.validators.ts                   # [LIB-027] Primitives de validation scalaires et exécutables
│   │   └── index.ts                            # [LIB-028] Façade publique du moteur d'environnement
│   ├── startup-banner.printer.ts               # [LIB-014] Affichage console de la bannière loopback
│   ├── graceful-shutdown.manager.ts            # [LIB-013] Interception SIGINT/SIGTERM et arrêt propre
│   ├── process-stream.handle.ts                # [LIB-015] Attache stdout/stderr et poignée stop (ex-spawn-agent-handle)
│   ├── command-shell.spawner.ts                # [LIB-031] Spawner de sous-processus shell natif OS
│   └── child-process.spawner.ts                # [LIB-004] Spawn processus avec grâce 3000ms SIGTERM->SIGKILL
├── adapters/                                   # Micro-DAG 4.3 : Implémentations concrètes des binaires CLI
│   ├── cursor/
│   │   └── cursor-cli.adapter.ts               # [LIB-006] Adapter CLI Cursor (buildCommand, reprise session)
│   ├── antigravity/
│   │   ├── antigravity-stream.extractor.ts     # [LIB-018] Extracteur de session stream-json Antigravity
│   │   ├── antigravity-session.helper.ts       # [LIB-017] Helper d'amorce et capture de session Antigravity
│   │   └── antigravity-cli.adapter.ts          # [LIB-016] Adapter CLI Antigravity
│   ├── codex/
│   │   ├── codex-stream.extractor.ts           # [LIB-022] Extracteur thread_id stream-json Codex
│   │   ├── codex-session.helper.ts             # [LIB-021] Helper d'amorce et capture de session Codex
│   │   └── codex-cli.adapter.ts                # [LIB-020] Adapter CLI Codex
│   └── claude/
│       ├── claude-cli.adapter.ts               # [LIB-033] Adapter CLI Claude (buildCommand, listModels)
│       ├── claude-session.helper.ts            # [LIB-034] Helper d'amorce et capture de session Claude CLI
│       └── claude-stream.extractor.ts          # [LIB-035] Parseur et extracteur session_id Claude stream-json
└── http/                                       # Micro-DAG 4.4 : Serveur HTTP loopback & routage
    ├── json-body.parser.ts                     # [LIB-009] Parsing sécurisé du corps JSON avec garde-fou taille
    ├── in-memory-static.handler.ts             # [LIB-008] Distribution des assets UI in-memory (MIME, 404)
    ├── mini-http.router.ts                     # [LIB-007] Micro-routeur HTTP sans dépendance externe
    └── loopback-http.server.ts                 # [LIB-010] Serveur node:http sur 127.0.0.1:2974
```


### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| LIB-001 | lib/fs/json-atomic-writer.fs.ts | Écriture atomique d'un objet JSON sur disque (.tmp + renommage atomique). |
| LIB-002 | lib/fs/json-fresh-reader.fs.ts | Lecture fraîche sans cache des ressources JSON sur disque. |
| LIB-003 | lib/fs/dynamic-module-loader.fs.ts | Chargement dynamique de script conditionnel JavaScript (ex-if-loader). |
| LIB-004 | lib/process/child-process.spawner.ts | Exécution de sous-processus child_process avec streaming stdout/stderr et arrêt gracieux 3000ms. |
| LIB-005 | lib/process/env/env.layout.ts | Résolution des variables d'environnement de base, process.cwd() et layout AgentsLayout (agentsDir, dataRoot, docsRoot). |
| LIB-006 | lib/adapters/cursor/cursor-cli.adapter.ts | Implémentation concrète de l'adapter CLI Cursor (buildCommand avec reprise session et --model, createSession, listModels). |
| LIB-007 | lib/http/mini-http.router.ts | Micro-moteur de routage HTTP sans dépendance externe. |
| LIB-008 | lib/http/in-memory-static.handler.ts | Distribution des fichiers statiques in-memory de l'UI avec types MIME et gestion 404. |
| LIB-009 | lib/http/json-body.parser.ts | Parsing sécurisé du corps JSON avec garde-fou mémoire. |
| LIB-010 | lib/http/loopback-http.server.ts | Serveur HTTP local node:http sur 127.0.0.1:2974 (LISTEN_HOST loopback) avec arrêt gracieux. |
| LIB-011 | lib/fs/file-remover.fs.ts | Suppression sécurisée et idempotente de fichiers disque. |
| LIB-012 | lib/process/args-parser/args-parser.engine.ts | Moteur générique pur de parsing des options CLI selon schéma déclaratif. |
| LIB-013 | lib/process/graceful-shutdown.manager.ts | Gestionnaire de signaux système SIGINT/SIGTERM pour l'arrêt gracieux (`shouldBindProcessSignals` : si `false`, ROOT-001 attache `process.on` — CASE-ARCH-04-2). |
| LIB-014 | lib/process/startup-banner.printer.ts | Bannière de démarrage HTTP loopback et affichage d'informations terminal. |
| LIB-015 | lib/process/process-stream.handle.ts | Attache flux stdout/stderr et fabrique la poignée stop d'un spawn (ex-spawn-agent-handle, compagnon LIB-004). |
| LIB-016 | lib/adapters/antigravity/antigravity-cli.adapter.ts | Implémentation concrète de l'adapter CLI Antigravity (buildCommand avec reprise session et --model, createSession, listModels). |
| LIB-017 | lib/adapters/antigravity/antigravity-session.helper.ts | Helper d'amorce, timeout et capture de session Antigravity CLI. |
| LIB-018 | lib/adapters/antigravity/antigravity-stream.extractor.ts | Parseur et extracteur d'identifiant de session Antigravity stream-json. |
| LIB-019 | lib/fs/text-atomic-writer.fs.ts | Écriture atomique de fichiers texte/Markdown sous docsRoot (.agents/docs/) (ex-docs-writer). |
| LIB-020 | lib/adapters/codex/codex-cli.adapter.ts | Implémentation concrète de l'adapter CLI Codex CLI (buildCommand avec exec/resume et --model, createSession, listModels). |
| LIB-021 | lib/adapters/codex/codex-session.helper.ts | Helper d'amorce, timeout et capture de session Codex CLI. |
| LIB-022 | lib/adapters/codex/codex-stream.extractor.ts | Parseur et extracteur d'identifiant de session thread_id Codex stream-json. |
| LIB-023 | lib/process/args-parser/args-parser.types.ts | Types, interfaces et contrats d'options du parseur CLI générique. |
| LIB-024 | lib/process/args-parser/index.ts | Point d'entrée public et exports du moteur de parsing CLI. |
| LIB-025 | lib/process/env/env.engine.ts | Moteur de chargement dynamique d'environnement et d'injection process.env (SPEC-SRV-01, ADR-022). |
| LIB-026 | lib/process/env/env.types.ts | Types, interfaces de contexte et contrats de validateurs d'environnement. |
| LIB-027 | lib/process/env/env.validators.ts | Primitives déclaratives de validation des variables d'environnement et exécutables. |
| LIB-028 | lib/process/env/index.ts | Point d'entrée public et exports du moteur d'environnement. |
| LIB-029 | lib/process/args-parser/args-parser.error.ts | Classe d'erreur ServerCliParseError levée en cas d'argument CLI invalide ou manquant. |
| LIB-030 | lib/process/args-parser/args-parser.matcher.ts | Primitives pures de détection et appariement des tokens d'arguments selon schéma. |
| LIB-031 | lib/process/command-shell.spawner.ts | Spawner de commandes shell natives OS avec streaming temps réel (ADR-019 / LIB-004). |
| LIB-032 | lib/process/env/env.executable.ts | Primitives de vérification d'existence et de permissions d'exécution de binaires hôtes. |
| LIB-033 | lib/adapters/claude/claude-cli.adapter.ts | Implémentation concrète de l'adapter CLI Claude CLI (buildCommand avec reprise session et --model, createSession, listModels). |
| LIB-034 | lib/adapters/claude/claude-session.helper.ts | Helper d'amorce, timeout et capture de session Claude CLI. |
| LIB-035 | lib/adapters/claude/claude-stream.extractor.ts | Parseur et extracteur d'identifiant de session Claude stream-json. |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

- **`STOP_GRACE_MS = 3000 ms` constante nommée :** l'escalade `SIGTERM` $\to$ `SIGKILL` respecte scrupuleusement la constante (exportée via `child-process.spawner.ts` / `process-stream.handle.ts` `LIB-015`), validée par faux timers déterministes (`ADR-006`).
- **`shouldBindProcessSignals` (`LIB-013`) :** défaut `true` (harnais `emit`) ; `false` lorsque `index.ts` enregistre lui-même `SIGINT`/`SIGTERM` et délègue à `registration.emit` (`CASE-ARCH-04-2`, `AC-SRV-02-3`).
- **`dynamic-module-loader.fs.ts` (`LIB-003`) sépare chargement et évaluation :** il importe dynamiquement le module sans exécuter `if(sac)`, confiant l'évaluation protégée au runner (`SVC-001`).
- **`json-fresh-reader.fs.ts` (`LIB-002`) garantit le `disk-as-truth` :** aucun cache n'est mis en place dans `lib/`, tout cache éventuel relèverait du niveau applicatif.
- **`env.layout.ts` (`LIB-005`) et `env.engine.ts` (`LIB-025`) guichets uniques d'environnement (`SPEC-ARCH-03`, `ADR-022`) :** aucune autre couche n'accède directement à `process.env` ou `process.cwd()`, recevant ces valeurs par injection de dépendances.
- **`AgentsLayout.docsRoot` (`LIB-005`, `ADR-017`) :** `resolveAgentsLayout` expose `docsRoot = path.join(agentsDir, 'docs')` en plus de `dataRoot`, sans confondre documentation utilisateur et ressources `data/`.
- **`text-atomic-writer.fs.ts` (`LIB-019`) :** écriture sécurisée (tmp + rename) de contenus texte sous `docsRoot` uniquement ; ne remplace pas `json-atomic-writer.fs.ts` pour le JSON de `data/`.
- **Sécurisation de l'écoute réseau locale :** le serveur HTTP écoute exclusivement sur l'adresse loopback `127.0.0.1:2974` pour empêcher toute exposition réseau intempestive.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`lib`** | `types/`, `utils/`, modules Node.js natifs (`fs`, `child_process`, `http`, `url`, `vm`, `os`, `path`) | `domain/`, `services/`, `controllers/`, `ui/`, `index.ts` | `services/`, `index.ts`, `config/` *(types purs uniquement `import type`)* | Violation bloquante détectée par `CASE-ARCH-03-1` (monopole I/O), `CASE-ARCH-03-3` (aveugle au domaine) et `CASE-ARCH-01-1`. |
| **`lib/fs`** | `node:fs`, `node:path`, `types/` | `lib/process/`, `lib/adapters/`, `lib/http/` | `lib/process/`, `services/`, `index.ts` | Ordre topologique strict $\text{fs} \prec \text{process} \prec \text{adapters} \prec \text{http}$. |
| **`lib/process`** | `node:child_process`, `node:fs`, `node:path`, `node:process`, `types/` | `lib/adapters/`, `lib/http/` | `lib/adapters/`, `services/`, `index.ts`, `config/` *(types purs `import type`)* | Contrôlé par l'analyseur de cycles statiques Vitest. |
| **`lib/adapters`**| `lib/process/`, `types/contracts/` | `lib/http/`, `domain/`, `services/` | `services/`, `index.ts` | Détecté par le harnais `tests/arch/`. |
| **`lib/http`** | `node:http`, `node:url`, `types/` | `domain/`, `services/`, `controllers/` | `index.ts` | Câblé exclusivement au démarrage par la Composition Root. |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `LIB-001` | `SPEC-DATA-04` | `ADR-005` | `CASE-DATA-04-1` |
| `LIB-002` | `SPEC-DATA-01`, `SPEC-DATA-02`, `SPEC-DATA-04` | `ADR-005` | `CASE-DATA-01-4`, `CASE-DATA-02-1`, `CASE-DATA-04-2` |
| `LIB-003` | `SPEC-DATA-02` | `ADR-005` | `CASE-DATA-02-3` (volet chargement dynamique / syntaxe) |
| `LIB-004` | `SPEC-ADPT-03` | `ADR-002`, `ADR-003`, `ADR-006` | `CASE-ADPT-03-1` |
| `LIB-005` | `SPEC-SRV-01`, `SPEC-ADPT-02`, `SPEC-DATA-05` | `ADR-001`, `ADR-003`, `ADR-017`, `ADR-022` | `CASE-SRV-01-4`, `CASE-ADPT-02-1`, `CASE-DATA-05-1` |
| `LIB-006` | `SPEC-ADPT-01`, `SPEC-ADPT-02`, `SPEC-ADPT-03` | `ADR-002`, `ADR-003` | `CASE-ADPT-01-1..3`, `CASE-ADPT-02-1..3`, `CASE-ADPT-03-2` |
| `LIB-007` | `SPEC-SRV-02` | `ADR-001` | — (micro-routeur sans dépendance, primitive de transport) |
| `LIB-008` | `SPEC-SRV-02` | `ADR-001`, `ADR-012` | `CASE-SRV-02-1` (distribution in-memory) |
| `LIB-009` | `SPEC-SRV-02` | `ADR-001` | — (primitive HTTP de transport) |
| `LIB-010` | `SPEC-SRV-01`, `SPEC-SRV-02` | `ADR-001` | `CASE-SRV-01-1`, `CASE-SRV-01-2`, `CASE-SRV-01-3`, `CASE-SRV-02-1`, `CASE-SRV-02-3` |
| `LIB-011` | `SPEC-DATA-04` | `ADR-005` | `CASE-DATA-04-1` (volet suppression) |
| `LIB-012` | `SPEC-SRV-01` | `ADR-001`, `ADR-022` | `CASE-SRV-01-1`, `CASE-SRV-01-8` |
| `LIB-013` | `SPEC-SRV-01` | `ADR-001` | `CASE-SRV-01-2`, `CASE-ARCH-04-2` |
| `LIB-014` | `SPEC-SRV-01` | `ADR-001` | `CASE-SRV-01-3` |
| `LIB-015` | `SPEC-ADPT-03` | `ADR-002`, `ADR-006` | `CASE-ADPT-03-1` |
| `LIB-016` | `SPEC-ADPT-04` | `ADR-002`, `ADR-003` | `CASE-ADPT-04-1..6` |
| `LIB-017` | `SPEC-ADPT-04` | `ADR-002` | `CASE-ADPT-04-6` |
| `LIB-018` | `SPEC-ADPT-04` | `ADR-002` | `CASE-ADPT-04-6` |
| `LIB-019` | `SPEC-DATA-05` | `ADR-017` | `CASE-DATA-05-1`, `CASE-DATA-05-3` |
| `LIB-020` | `SPEC-ADPT-05` | `ADR-002`, `ADR-003` | `CASE-ADPT-05-1..5` |
| `LIB-021` | `SPEC-ADPT-05` | `ADR-002` | `CASE-ADPT-05-5` |
| `LIB-022` | `SPEC-ADPT-05` | `ADR-002` | `CASE-ADPT-05-5` |
| `LIB-023` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-8` |
| `LIB-024` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-8` |
| `LIB-025` | `SPEC-SRV-01`, `SPEC-ARCH-03` | `ADR-022` | `CASE-SRV-01-9`, `CASE-ARCH-03-5` |
| `LIB-026` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-9` |
| `LIB-027` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-9` |
| `LIB-028` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-9` |
| `LIB-029` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-3` |
| `LIB-030` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-2`, `CASE-SRV-01-5` |
| `LIB-031` | `SPEC-ARCH-03` | `ADR-019` | `CASE-ENG-04-12` |
| `LIB-032` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-9` |
| `LIB-033` | `SPEC-ADPT-06` | `ADR-002`, `ADR-003` | `CASE-ADPT-06-1..5` |
| `LIB-034` | `SPEC-ADPT-06` | `ADR-002` | `CASE-ADPT-06-5` |
| `LIB-035` | `SPEC-ADPT-06` | `ADR-002` | `CASE-ADPT-06-3`, `CASE-ADPT-06-5` |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste contractuellement de l'étanchéité et du monopole d'I/O du socle **`src/lib/`** :
1. Les 35 modules `LIB-001` à `LIB-035` détiennent l'exclusivité totale des effets de bord système du projet (`CASE-ARCH-03-1`).
2. Aucun concept métier n'est connu ni importé au sein de cette couche (`CASE-ARCH-03-3`).
3. L'ordre topologique interne $\text{fs} \prec \text{process} \prec \text{adapters} \prec \text{http}$ est strictement acyclique et vérifié en continu.

*Document validé et scellé pour le Palier 4 (`src/lib/`).*
