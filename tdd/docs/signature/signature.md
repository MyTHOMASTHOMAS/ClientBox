# Rapport Final de Signature d'Architecture Technique — Socle `src/`

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Référentiel :** [`cahier-des-charges-v1.md`](../cdc/cahier-des-charges-v1.md) (verrouillé), [`sommaire.md`](../specs/sommaire.md) et spécifications de domaines ([`ARCH.md`](../specs/ARCH.md), [`SRV.md`](../specs/SRV.md), [`DATA.md`](../specs/DATA.md), [`ADPT.md`](../specs/ADPT.md), [`ENG.md`](../specs/ENG.md), [`UI.md`](../specs/UI.md)), décisions d'architecture ([`ADR-001`](../adr/ADR-001-socle-applicatif.md) à [`ADR-015`](../adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md)), diagrammes UML ([`tdd/docs/uml/`](../uml/)).

### Signatures détaillées par couche (`src/`)

| Couche | Document |
| :--- | :--- |
| Racine / Composition Root | [`signature-src.md`](./signature-src.md) |
| `types/` | [`signature-types.md`](./signature-types.md) |
| `utils/` | [`signature-utils.md`](./signature-utils.md) |
| `domain/` | [`signature-domain.md`](./signature-domain.md) |
| `lib/` | [`signature-lib.md`](./signature-lib.md) |
| `services/` | [`signature-services.md`](./signature-services.md) |
| `controllers/` | [`signature-controllers.md`](./signature-controllers.md) |
| `ui/` | [`signature-ui.md`](./signature-ui.md) |

---

## 1. Contexte, Rôle & Principes Directeurs

Ce document constitue la **signature maîtresse d'architecture technique** du socle logiciel `src/` pour le projet ClientsBox v1.
Il formalise le découpage modulaire en 8 couches, l'arborescence des fichiers, les frontières d'étanchéité et le graphe acyclique de dépendances (DAG) garantissant la maintenabilité, l'absence totale de cycles et la testabilité TDD intégrale du système.

### 1.1 Principes d'Ingénierie & Règles d'Or du Socle

1. **Étanchéité des couches & Direction unilatérale des dépendances (`SPEC-ARCH-01`) :**
   - Aucune dépendance circulaire n'est tolérée dans l'ensemble de l'arborescence (`cycleCount === 0`).
   - Les contrats et types purs (`types/`) constituent la source de vérité déclarative unique (zéro logique runtime).
   - Les utilitaires purs (`utils/`) ignorent tout concept métier ClientsBox.
2. **Pureté et Isomorphisme du Domaine (`domain/`, `SPEC-ARCH-02`) :**
   - Le cœur de logique métier (`domain/`) est **100 % pur et isomorphe** (compatible Node.js et navigateur moderne).
   - **Zéro I/O** dans `domain/` : interdiction absolue d'importer `fs`, `child_process`, `net`, `http` ou toute autre API système. Tout effet de bord est confiné aux connecteurs techniques (`lib/`).
3. **Monopole des Effets de Bord & Connecteurs Aveugles au Métier (`lib/`, `SPEC-ARCH-03`) :**
   - Les modules `lib/` détiennent le monopole exclusif des accès OS (`fs`, `child_process`, `vm`, `env`).
   - Ils sont strictement aveugles aux concepts métier : ils ignorent la structure des scénarios ou les règles d'évaluation du canvas.
4. **Orchestration Applicative Découplée (`services/`) :**
   - Les services relient la logique pure (`domain/`) aux effets de bord (`lib/`), sans connaître le protocole de transport réseau.
   - Les contrôleurs (`controllers/`) reçoivent les requêtes HTTP/SSE et délèguent exclusivement aux services sans toucher à `domain/` ni à `lib/`.
5. **Stratégie de Test Déterministe (`ADR-006`) :**
   - Mocking en mémoire des sous-processus `child_process.spawn` (flux `stdio`), timers déterministes (`FakeTimers`) pour le délai de grâce 3000 ms, purge explicite des microtâches (`flushPromises()`) pour les boucles événementielles, et immutabilité de `process.cwd()`.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Synthèse des Micro-DAGs)

### 2.1 Positionnement dans le DAG Macro Global

L'architecture s'organise en strates ordonnées unilatéralement, où chaque couche ne peut dépendre que des couches inférieures :

```text
                     ┌───────────┐
                     │   types   │ ◄─────────────────────────────────────────┐ (Importable par TOUS)
                     └─────┬─────┘                                           │
                           │                                                 │
                     ┌─────▼─────┐                                           │
                     │   utils   │ (Utilitaires purs sans état)              │
                     └─────┬─────┘                                           │
         ┌─────────────────┼─────────────────┐                               │
         │ (Tout utils)    │ (Tout utils)    │ (Tout utils)                  │
   ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐                         │
   │  domain   │     │  config   │     │    lib    │                         │
   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘                         │
         │ (Métier pur)    │ (Import         │ (I/O)                         │
         │                 │  exclusif)      │                               │
         │           ┌─────▼─────────────────▼┐                              │
         ├──────────►│        services        │ (Dont ConfigService)         │
         │           └─────────────┬──────────┘                              │
         │                         │                                         │
         │                  ┌──────▼──────┐                                  │
         │                  │ controllers │ (HTTP / SSE)                     │
         │                  └──────┬──────┘                                  │
         │                         │                                         │
         │                  ┌──────▼──────┐                                  │
         │                  │  index.ts   │ (Composition Root serveur)       │
         │                  └──────┬──────┘                                  │
         │                         │ (distribution in-memory)                │
         ▼                         ▼                                         │
   ┌───────────────────────────────────────────┐                             │
   │                    ui                     │ (Navigateur — Preact TSX) ──┘
   └───────────────────────────────────────────┘
```

> **Ordre topologique macro :**  
> $\text{types} \prec \text{utils} \prec \text{config} \prec (\text{domain} \parallel \text{lib}) \prec \text{services} \prec \text{controllers} \prec (\text{ui} \parallel \text{index.ts})$  
> *(avec $\text{utils} \prec \text{config}$ car `config` peut importer tout `utils`, et restriction d'importation sortante de $\text{config}$ confinée strictement à $\text{services/config/}$)*

### 2.2 Synthèse des Ordres Topologiques Intra-Couches (Micro-DAGs)

Pour prévenir tout couplage silencieux ou cycle masqué, chaque couche interne applique un ordre topologique strict ($\prec$) :

1. **`types/` :** $\text{messages} \prec \text{models} \prec \text{contracts}$ (15 modules `TYPES-001..015`)
2. **`config/` :** $\text{constants} \prec \text{schemas}$ (schémas et constantes purs, zéro I/O, importé exclusivement par `ConfigService`, zéro import depuis `lib/`)
3. **`utils/` :** Primitives techniques et services partagés sans cycle : $\text{primitives} \parallel \text{cache} \parallel \text{logger}$ (31 modules `UTILS-001..031`)
4. **`domain/` :** $\text{schemas} \parallel \text{keys} \parallel \text{messages} \parallel \text{join} \parallel \text{prompt} \prec \text{graph}$ (6 sous-domaines officiels, 19 modules `DOM-001..008` + `DOM-010..020` ; `DOM-009` abrogé per CR-012)
5. **`lib/` :** $\text{fs} \prec \text{process} \prec \text{adapters} \prec \text{http}$ avec partitionnement des connecteurs CLI par fournisseur (`cursor/`, `antigravity/`, `codex/`) et moteurs modulaires d'exécution (`args-parser/`, `env/`)
6. **`services/` :** $\text{config} \prec \text{resources} \prec \text{adapters} \prec \text{agents} \prec \text{docs} \prec \text{runner}$ (`ConfigService` déployant la configuration avant les autres cas d'usage)
7. **`controllers/` :** $\text{shared} \prec \text{http (crud, docs, execution)} \prec \text{sse}$ (7 modules `CTL-001..007`)
8. **`ui/` (DAG Front par dossier à 5 niveaux) :** $\text{Niveau 0 (api, i18n, types)} \prec \text{Niveau 1 (hooks)} \prec \text{Niveau 2 (components)} \prec \text{Niveau 3 (pages)} \prec \text{Niveau 4 (app.tsx)}$ (59 modules `UI-001..059`)
9. **Racine :** `ROOT-001` (`index.ts`) agit comme unique Composition Root unilatérale.

---

## 3. Inventaire & Arborescence des Fichiers

### 3.1 Arborescence du Socle (`src/`)

```text
src/
├── index.ts                               # [ROOT-001] Point d'entrée v1 / Composition Root (déploiement ConfigService, démarrage HTTP, graceful shutdown)
├── types/                                 # Couche 1 — Contrats, modèles et messages déclaratifs stricts (source de vérité, zéro logique runtime, 15 modules)
├── config/                                # Couche déclarative — Schémas d'environnement, flags CLI et constantes (importé exclusivement par ConfigService)
├── utils/                                 # Couche 2 — Primitives techniques pures, cache LRU et logger structuré (agnostiques au domaine, 31 modules)
├── domain/                                # Couche 3 — Cœur de logique métier pur et règles de décision (6 sous-domaines, 100% isomorphe, zéro I/O, 19 modules)
├── lib/                                   # Couche 4 — Connecteurs techniques, moteurs d'exécution et monopole exclusif I/O OS (fs, process, env, args-parser, adapters, http, 32 modules)
├── services/                              # Couche 5 — Cas d'usage et orchestration applicative (config, resources, adapters, agents, docs, runner, 24 modules)
├── controllers/                           # Couche 6 — Exposition réseau et transport (shared, CLI headless, points d'entrée HTTP REST, flux temps réel SSE, 8 modules)
└── ui/                                    # Couche 7 — Interface utilisateur web pour navigateur moderne (Clean Code Preact TSX, DAG à 5 niveaux, 61 modules UI-001..061)
```

> **Note de partitionnement modulaire :**  
> L'arborescence ci-dessus présente le découpage macroscopique à la racine de `src/`. Les arborescences et inventaires détaillés fichier par fichier sont documentés dans leurs signatures dédiées respectives :  
> - [`signature-src.md`](./signature-src.md) — Palier 8 : Composition Root Unique (`ROOT-001`)  
> - [`signature-types.md`](./signature-types.md) — Palier 1 : Types & Contrats purs (`TYPES-001..015`)  
> - [`signature-config.md`](./signature-config.md) — Palier Configuration : Schémas & Constantes déclaratives (`CONFIG-001..004`)  
> - [`signature-utils.md`](./signature-utils.md) — Palier 2 : Utilitaires purs (`UTILS-001..031`)  
> - [`signature-domain.md`](./signature-domain.md) — Palier 3 : Métier pur isomorphe (`DOM-001..020`)  
> - [`signature-lib.md`](./signature-lib.md) — Palier 4 : Connecteurs & Effets de bord (`LIB-001..032`)  
> - [`signature-services.md`](./signature-services.md) — Palier 5 : Orchestration & Services (`SVC-001..024`)  
> - [`signature-controllers.md`](./signature-controllers.md) — Palier 6 : Contrôleurs HTTP/SSE/CLI (`CTL-001..008`)  
> - [`signature-ui.md`](./signature-ui.md) — Palier 7 : Interface Utilisateur Web (`UI-001..061`)  

### 3.2 Tableau Normalisé d'Inventaire Racine & Couches

<!-- SIGNATURE-INVENTORY-START -->
| fileId / Identifiant | filepath / Dossier | file description |
| :--- | :--- | :--- |
| ROOT-001 | index.ts | Point d'entrée v1 / Composition Root (déploiement configuration, démarrage HTTP, graceful shutdown). |
| TYPES-LAYER | types/ | Couche 1 — Contrats, modèles et messages déclaratifs stricts (source de vérité unique, zéro logique runtime, 15 modules). |
| CONFIG-LAYER | config/ | Couche déclarative — Schémas d'environnement, flags CLI et constantes (consommée exclusivement par ConfigService). |
| UTILS-LAYER | utils/ | Couche 2 — Primitives techniques pures, cache LRU et logger structuré (agnostiques au domaine ClientsBox, 31 modules). |
| DOM-LAYER | domain/ | Couche 3 — Cœur de logique métier pur et règles de décision (6 sous-domaines, 100 % isomorphe Node/Browser, zéro I/O, 19 modules ; DOM-009 abrogé). |
| LIB-LAYER | lib/ | Couche 4 — Connecteurs techniques, moteurs génériques et monopole exclusif I/O (fs, process, env, args-parser, adapters, http, 32 modules). |
| SVC-LAYER | services/ | Couche 5 — Cas d'usage et orchestration applicative (config, resources, adapters, agents, docs, runner, 24 modules). |
| CTL-LAYER | controllers/ | Couche 6 — Exposition réseau et transport (shared, CLI headless, points d'entrée HTTP REST et flux temps réel SSE, 8 modules). |
| UI-LAYER | ui/ | Couche 7 — Interface utilisateur web navigateur (Clean Code Preact TSX, DAG à 5 niveaux par dossier, 61 modules UI-001..061). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

Le socle logiciel ClientsBox v1 assure l'exécution autonome, contrôlée et visuelle de graphes d'agents d'intelligence artificielle :

1. **Exposition Réseau Locale & Étanchéité Transport :**
   - Le serveur HTTP local écoute exclusivement sur `127.0.0.1:2974` (`SPEC-SRV-02`).
   - Toutes les réponses API retournent un corps JSON rédigé en français (`REQ-007`).
2. **Isolation Temporelle & Zéro Persistance Volatile :**
   - Les exécutions de scénarios vivent exclusivement en mémoire vive (`R-37`).
   - Le flux textuel des terminaux est volatil et disparaît au rafraîchissement client (`R-26`).
3. **Persistance Disque Atomique & Intégrité Référentielle :**
   - Toute ressource JSON stockée sous `.agents/data/` est manipulée par écriture atomique (`atomicWriteJson`) et relecture fraîche (`readJsonFile`).
   - L'intégrité relationnelle empêche la suppression d'un profil lié à un agent existant (erreur 409 Conflict).
4. **Cycle de Vie des Processus & Protection Système :**
   - Tout arrêt d'agent ou de scénario dispose d'un délai de grâce de 3000 ms (`SIGTERM`) avant escalade forcée (`SIGKILL`).

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`types`** | Types externes purs (ex: `NodeJS.ProcessEnv`) | Toute logique runtime, modules Node.js, `config/`, `utils/`, `domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts` | **TOUS** (`config`, `utils`, `domain`, `lib`, `services`, `controllers`, `ui`, `index.ts`) | Violation bloquante détectée par `CASE-ARCH-01-2` (zéro runtime dans types) et `CASE-ARCH-01-1`. |
| **`config`** | `types/` (types purs `import type`), `utils/` (tout : valeurs et types) | `lib/` (**strictement interdit**, y compris `import type`), modules Node.js I/O directs, `domain/`, `services/`, `controllers/`, `ui/`, `index.ts` | **`services/config/` (`ConfigService`) EXCLUSIVEMENT** (interdit formellement à `domain`, `index.ts`, `controllers`, `lib`, `ui`) | Violation bloquante détectée par `CASE-ARCH-01-1`. |
| **`utils`** | `types/`, bibliothèques utilitaires génériques pures | Tout concept métier ClientsBox, modules Node.js I/O, `config/`, `domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts` | `config`, `domain`, `lib`, `services`, `controllers`, `ui`, `index.ts` | Violation bloquante détectée par `CASE-ARCH-01-1` (DAG unilatéral). |
| **`domain`** | `types/`, `utils/`, bibliothèques pures isomorphes | Modules Node.js (`fs`, `child_process`, `net`, `http`, `os`), `config/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts` | `services/`, `ui/` (calculs partagés isomorphes), `index.ts` | Violation bloquante détectée par `CASE-ARCH-02-1` (zéro I/O) et `CASE-ARCH-01-1` (DAG unilatéral). |
| **`lib`** | `types/`, `utils/`, modules système Node.js (`fs`, `child_process`, `http`, `url`, `vm`, `os`, `path`) | `config/`, `domain/`, `services/`, `controllers/`, `ui/`, `index.ts` | `services/`, `index.ts` | Violation bloquante détectée par `CASE-ARCH-03-1..5` (monopole effets de bord, aveugle au domaine) et `CASE-ARCH-01-1`. |
| **`services`** | `types/`, `config/` *(réservé à `services/config/`)*, `utils/`, `domain/`, `lib/` | Modules de transport réseau (`node:http`, `node:net`), `controllers/`, `ui/`, `index.ts` | `controllers/`, `index.ts` | Violation bloquante détectée par `CASE-ARCH-01-1` (absence de dépendance ascendante). |
| **`controllers`** | `types/`, `utils/`, `services/` | Modules système Node.js direct (`fs`, `child_process`), `config/`, `domain/`, `lib/`, `ui/`, `index.ts` | `index.ts` | Violation bloquante détectée par `CASE-ARCH-01-3` (étanchéité controllers ↛ domain/lib). |
| **`ui`** | `types/`, `utils/`, `domain/` (isomorphe) | Modules Node.js (`fs`, `child_process`), `config/`, `lib/`, `services/`, `controllers/`, `index.ts` | *Navigateur Web*, compilation in-memory dans `embedded-assets.generated.ts` (Preact TSX déclaratif + Tailwind per ADR-012/013/015, exclue d'un import direct par index.ts) | Violation bloquante détectée par `CASE-ARCH-01-4` (étanchéité UI navigateur). |
| **`index.ts`** | `services/`, `controllers/`, `lib/`, `domain/`, `utils/`, `types/` | `config/` *(import direct interdit : obligation de passer par `ConfigService`)*, `ui/` *(servie via assets in-memory `LIB-008`)* | *Aucun module* (point d'entrée exécutable unique) | Violation bloquante détectée par `CASE-ARCH-04-1` (composition root unique) et `CASE-ARCH-01-1`. |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice Globale de Traçabilité des Domaines

| Domaine / Règle | Implémentation Architecturale | Couverture Vitest | Statut |
| :--- | :--- | :---: | :---: |
| **ARCH** (`SPEC-ARCH-01`..`09`) | Ensemble de `src/`, signatures `tdd/docs/signature/`, harnais `tests/arch/` | `CASE-ARCH-01-1` à `CASE-ARCH-09-5` (38 cas) | **CONFORME** |
| **SRV** (`SPEC-SRV-01`, `02`) | `src/index.ts`, `src/lib/process/env-resolver.ts`, `src/lib/http/`, `src/controllers/http/` | `CASE-SRV-01-1..4`, `CASE-SRV-02-1..8` | **CONFORME** |
| **DATA** (`SPEC-DATA-01`..`04`) | `src/lib/fs/`, `src/domain/keys/`, `src/services/resource-store.service.ts` | `CASE-DATA-01-1..6` à `CASE-DATA-04-1..3` | **CONFORME** |
| **ADPT** (`SPEC-ADPT-01`..`03`) | `src/types/contracts/`, `src/lib/adapters/`, `src/lib/process/`, `src/services/adapter-registry.service.ts` | `CASE-ADPT-01-1..3` à `CASE-ADPT-03-1..3` | **CONFORME** |
| **ENG** (`SPEC-ENG-01`..`04`) | `src/domain/join/`, `src/domain/prompt/`, `src/domain/graph/`, `src/services/scenario-runner.service.ts` | `CASE-ENG-01-1..2` à `CASE-ENG-04-1..4`, `CASE-ENG-04-13` | **CONFORME** |
| **UI** (`SPEC-UI-01`..`04`) | `src/ui/app.tsx`, `src/ui/api/`, `src/ui/i18n/`, `src/ui/types/`, `src/ui/hooks/`, `src/ui/components/`, `src/ui/pages/`, `src/ui/docs/` | `CASE-UI-01-1..12`, `CASE-UI-02-1..13`, `CASE-UI-03-1..8`, `CASE-UI-04-1..3` (59 modules `UI-001..059`) | **CONFORME** |
| **ADR-001…017** | Bundling standalone, CLIAdapter, cursor-cli, moteur join, persistance `.agents/data/`, mocks/fake timers/flush TU, E2E Playwright, front in-memory exclusif, IHM Preact + Tailwind v4, cache LRU, doc embarquée | Conforme | **CONFORME** |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste formellement que l'architecture technique du socle **ClientsBox v1** est scellée, vérifiée et conforme à l'intégralité du cahier des charges et des spécifications d'architecture (`SPEC-ARCH-01` à `SPEC-ARCH-09`) :

1. L'arborescence physique sous `src/` compte exactement **200 modules canoniques signés**, inventoriés de façon univoque par identifiants pérennes (`ROOT-001`, `TYPES-001..015`, `CONFIG-001..004`, `UTILS-001..031`, `DOM-001..008`, `DOM-010..020`, `LIB-001..035`, `SVC-001..024`, `CTL-001..008`, `UI-001..063`). Le module `DOM-009` (`domain/exit/exit-matcher.evaluator.ts`) est abrogé (CR-012).
2. Le graphe de dépendances statique est strictement unilatéral, acyclique (`0 cycle`), et vérifié de manière continue par la suite d'architecture Vitest.
3. Les règles d'étanchéité (pureté sans I/O de `domain/`, monopole de `lib/`, isolation des `controllers/`, conformité déclarative de `types/`, isolation navigateur de `ui/`) sont universellement opposables.

*Document validé et scellé pour le socle ClientsBox v1.*
