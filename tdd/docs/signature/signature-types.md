# Signature de Domaine — `src/types/` (Palier 1 : Source Déclarative & Contrats)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `TYPES`  
**Couche DAG :** `1-types` *(Source de vérité déclarative — zéro logique runtime)*  
**Peut importer :** *(dépendances externes de types pures uniquement, ex: `NodeJS.ProcessEnv`)*  
**Peut être importé par :** `utils`, `domain`, `lib`, `services`, `controllers`, `ui`, `index.ts` *(tous)*  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`, `SPEC-ARCH-06`), [`SRV.md`](../specs/SRV.md) (`SPEC-SRV-02`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-01`, `SPEC-DATA-03`), [`ENG.md`](../specs/ENG.md) (`SPEC-ENG-01`..`04`), [`ADPT.md`](../specs/ADPT.md) (`SPEC-ADPT-01`), [`UI.md`](../specs/UI.md) (`SPEC-UI-01`..`03`), décisions d'architecture ([`ADR-001`](../adr/ADR-001-socle-applicatif.md), [`ADR-002`](../adr/ADR-002-gestionnaire-de-processus-cli.md), [`ADR-004`](../adr/ADR-004-moteur-de-blocs-en-memoire.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`types/`** constitue le **Palier 1 et la source de vérité déclarative unique** de ClientsBox.
Elle a pour responsabilité exclusive de modéliser les contrats d'interface, les modèles de données statiques et les structures de messages échangées entre les blocs, sans exécuter le moindre octet de code à l'exécution.

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 1

1. **Zéro Logique Runtime (`SPEC-ARCH-01`, `CASE-ARCH-01-2`) :**
   - Aucun fichier de `src/types/` ne contient de code exécuté (`if`, boucle, fonction avec corps, instanciation de classe, `enum` TypeScript non-const, initialisation `export const` valeur runtime).
   - Uniquement des déclarations `interface`, `type` (alias), `const enum` ou types structuraux purs.
2. **Zéro Import depuis les Couches Applicatives (`SPEC-ARCH-01`) :**
   - `types/` ne doit jamais importer depuis `utils/`, `domain/`, `lib/`, `services/`, `controllers/`, `ui/` ou `index.ts`.
3. **Isomorphisme Garanti & Portabilité Universelle :**
   - Tous les types de `types/` sont valides à la fois en contexte Node.js et dans le navigateur moderne (aucune référence à `NodeJS.*` sauf dans les contrats d'adapter signalés explicitement).
4. **Source de Vérité Unique (SSOT) :**
   - Toute constante d'énumération ou union discriminée (ex: valeurs de `policy`, `blockType`, `BlockStatus`) est définie ici et seulement ici — jamais dupliquée dans une autre couche.
5. **Pas de `class` :**
   - Uniquement des types structuraux (`interface`, `type alias`, `const enum`). Les classes appartiennent aux couches `domain/`, `lib/` ou `services/`.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 1 — Racine Déclarative)

Dans le DAG macro, `types/` se situe à la base absolue : tous les autres modules peuvent l'importer, mais lui n'importe aucune couche applicative.

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                       types/ (Palier 1)                       │
       │     Contrats d'interface, modèles statiques, messages         │
       │             Zéro runtime — Zéro import applicatif             │
       └───────────────────────────────▲───────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │    Importable par l'ensemble    │
                      │       des couches amont         │
                      └─────────────────────────────────┘
```

### 2.2 Micro-DAG Intra-Couche (Ordre Topologique Strict)

Au sein de `types/`, les dépendances internes suivent un ordre topologique strict sans cycle direct ni rétro-dépendance :

$$\text{messages} \prec \text{models} \prec \text{contracts}$$

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                       types/messages/                         │
       │    block-message.message.ts, block-status.message.ts,         │
       │    execution-block-status.message.ts                          │
       │    (Structures primitives d'exécution & statuts partagés)     │
       └───────────────────────────────▲───────────────────────────────┘
                                       │
                                       │ (Consommé par input-bag)
                                       │
       ┌───────────────────────────────┴───────────────────────────────┐
       │                        types/models/                          │
       │    agent, profile, prompt, exit-condition, scenario,          │
       │    node, connection, input-bag                                │
       └───────────────────────────────▲───────────────────────────────┘
                                       │
                                       │ (Consommé pour typer les contextes)
                                       │
       ┌───────────────────────────────┴───────────────────────────────┐
       │                      types/contracts/                         │
       │    cli-adapter.contract.ts, http-router.contract.ts           │
       │    (Contrats d'interfaces opposables pour lib et services)    │
       └───────────────────────────────────────────────────────────────┘
```

> **Garantie d'acyclicité interne :**  
> `messages/` ne dépend d'aucun autre dossier de `types/` (feuille).  
> `models/` ne dépend que de `messages/` (ex: `input-bag.model.ts` consomme `block-message.message.ts` et `connection.model.ts`).  
> `contracts/` consomme les modèles (`models/`) et types de flux (`AgentStreamEvent`), sans aucun rebouclage.

---

## 3. Inventaire & Arborescence des Fichiers (`src/types/`)

```text
src/types/
├── contracts/                                  # Contrats d'interfaces opposables (ADR-002, ADR-001, ADR-022)
│   ├── cli-adapter.contract.ts                 # [TYPES-001] CLIAdapter, ExecutionContext, AgentStreamEvent
│   ├── cli-parser.contract.ts                  # [TYPES-014] CliOptionSpec, CliParserSchema, CliParseResult
│   ├── env-schema.contract.ts                  # [TYPES-015] EnvSchema, EnvFieldDescriptor, EnvEngineResult
│   └── http-router.contract.ts                 # [TYPES-011] HttpRouter, HttpHandler, HttpMethod, RouteParams
├── messages/                                   # Structures primitives de messages et statuts runtime
│   ├── block-message.message.ts                # [TYPES-009] BlockMessage { blockType, value, power }, BlockType
│   ├── block-status.message.ts                 # [TYPES-012] BlockStatus, RunnerStatus (statuts runtime partagés)
│   └── execution-block-status.message.ts       # [TYPES-013] Statuts d'exécution détaillés de bloc de scénario
└── models/                                     # Schémas TypeScript des ressources déclaratives
    ├── agent.model.ts                          # [TYPES-002] Agent, AgentId
    ├── connection.model.ts                     # [TYPES-008] Connection, ConnectionKey
    ├── exit-condition.model.ts                 # [TYPES-005] ExitCondition, ExitConditionId
    ├── input-bag.model.ts                      # [TYPES-010] BlockInputBag = Record<ConnectionKey, BlockMessage>
    ├── node.model.ts                           # [TYPES-007] ScenarioNode, NodeType, NodePosition, ports
    ├── profile.model.ts                        # [TYPES-003] Profile, ProfileId, ProfilePolicy (3 politiques)
    ├── prompt.model.ts                         # [TYPES-004] Prompt, PromptId
    └── scenario.model.ts                       # [TYPES-006] Scenario, ScenarioId, ScenarioMetadata
```

### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| TYPES-001 | types/contracts/cli-adapter.contract.ts | Contrat d'adapter CLI opposable (ADR-002) : CLIAdapter (buildCommand, parseStreamLine, createSession, listModels), ExecutionContext (workspacePath, agentId, assembledPrompt, sessionId, model, cliOpaque), AgentStreamEvent. |
| TYPES-002 | types/models/agent.model.ts | Schéma TypeScript de la ressource Agent (id, name, profilId, cliId, model). |
| TYPES-003 | types/models/profile.model.ts | Schéma TypeScript de la ressource Profil (id, name, systemPrompt, policy). |
| TYPES-004 | types/models/prompt.model.ts | Schéma TypeScript de la ressource Prompt (id, name, content). |
| TYPES-005 | types/models/exit-condition.model.ts | Schéma TypeScript de la ressource Exit / prompt d'ordre de sortie (id, name, content) conforme R-07 / CR-012. |
| TYPES-006 | types/models/scenario.model.ts | Schéma TypeScript du document de Scénario (id, name, metadata, nodes, connections). |
| TYPES-007 | types/models/node.model.ts | Schéma TypeScript d'un nœud dans le graphe (id, type, position, ports). |
| TYPES-008 | types/models/connection.model.ts | Schéma TypeScript d'une connexion câblée entre deux blocs (source/target, key). |
| TYPES-009 | types/messages/block-message.message.ts | Type du message inter-blocs (blockType, value, power). |
| TYPES-010 | types/models/input-bag.model.ts | Type du sac d'entrées d'un bloc (BlockInputBag = Record<ConnectionKey, BlockMessage>). |
| TYPES-011 | types/contracts/http-router.contract.ts | Contrat d'interface abstrait pour le micro-moteur de routage HTTP (HttpRouter). |
| TYPES-012 | types/messages/block-status.message.ts | Types déclaratifs des statuts d'exécution runtime partagés (BlockStatus, RunnerStatus). |
| TYPES-013 | types/messages/execution-block-status.message.ts | Types déclaratifs des statuts d'exécution de bloc de scénario. |
| TYPES-014 | types/contracts/cli-parser.contract.ts | Contrat d'interface déclaratif du parser CLI (CliOptionType, CliOptionSpec, CliParserSchema, CliParseResult per ADR-022). |
| TYPES-015 | types/contracts/env-schema.contract.ts | Contrat d'interface déclaratif des schémas d'environnement runtime (EnvSchema, EnvFieldDescriptor, EnvEngineResult per ADR-022). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

La couche `types/` ne fournit aucun composant exécutable. Ses spécifications extérieures reposent sur :

- **`power: number` et valeurs v1 :** le type déclaratif est `number` conformément au CDC (§8 R-10b, Annexe D.2) et à `SPEC-ENG-01`. En v1, les composants du moteur manipulent et valident exclusivement les valeurs binaires `{0, 1}`.
- **`ProfilePolicy` (3 valeurs canoniques) et `Agent.model?: string` :** le mode `toujours` est fusionné dans `chaque_prompt` (CDC §8 R-06 + Annexe D.3). Le type expose strictement les 3 valeurs canoniques (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`). La propriété optionnelle `model?: string` associe un modèle d'IA directement à l'Agent en fonction de son CLI hôte.
- **`ExecutionContext`, `model` et `cliOpaque` :** le contexte d'exécution regroupe les champs définis par ADR-002, SPEC-ADPT-01 et CR-003 (`workspacePath`, `agentId`, `assembledPrompt`, `sessionId?: string`, `model?: string`, et `cliOpaque?: Record<string, unknown>` servant de relais opaque de session).
- **`CLIAdapter.listModels` :** méthode optionnelle `listModels?(): Promise<readonly string[]>` permettant l'énumération des modèles supportés pour l'autocomplétion UI.
- **`value: unknown` dans `BlockMessage` :** le type exact de `value` varie selon `blockType` (`string` pour `run`, `null` pour `start` et `clearContext`). Il reste `unknown` en v1 — l'affinement par discriminant est réservé aux specs (R-41), les couches consommatrices effectuant un cast typé sécurisé.
- **NodeType vs BlockType :** `NodeType` (TYPES-007) est le type de configuration statique persistée (`start` | `run` | `if` | `clearContext`) ; `BlockType` (TYPES-009) est le type du runtime dans les messages.
- **Champs nœud non persistés :** le statut d'exécution (`BlockStatus` / `status`) et tout champ listé par `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`) n'appartiennent pas au schéma JSON scénario (`TYPES-006` / `TYPES-007`) ; ils enrichissent uniquement le view-model canvas / le runner (`SPEC-DATA-03`, `AC-DATA-03-6`).
- **Sorties de bloc If (R-15) :** `NodeOutputPort.branch?: 'true' | 'false'` matérialise l'appartenance à la branche avec convention d'index `0: Vrai, 1: Faux`.
- **Portabilité pure de `HttpRouter` (TYPES-011) :** exempt de toute référence à `NodeJS.*`, `IncomingMessage` ou types spécifiques de `node:http`.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`types`** | Types externes purs uniquement (`NodeJS.ProcessEnv` isolé) | Toute logique runtime (`if`, boucles, instanciations), modules système Node.js (`fs`, `child_process`), `utils/`, `domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts` | **TOUS** (`utils`, `domain`, `lib`, `services`, `controllers`, `ui`, `index.ts`) | Violation bloquante détectée par `CASE-ARCH-01-2` (interdiction absolue de runtime dans les types) et `CASE-ARCH-01-1` (DAG unilatéral). |
| **`types/messages`** | Types structuraux purs internes | `models/`, `contracts/`, et toute couche applicative externe | `models/`, `contracts/`, `domain/`, `services/`, `ui/` | Ordre topologique strict $\text{messages} \prec \text{models} \prec \text{contracts}$. |
| **`types/models`** | `types/messages` | `contracts/`, et toute couche applicative externe | `contracts/`, `domain/`, `lib/`, `services/`, `controllers/`, `ui/` | Contrôlé par l'analyseur de cycles statiques Vitest (`CASE-ARCH-01-1`). |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `TYPES-001` | `SPEC-ADPT-01` | `ADR-002` | `CASE-ADPT-01-1`, `CASE-ADPT-01-2`, `CASE-ADPT-01-3` |
| `TYPES-002` | `SPEC-DATA-01`, `SPEC-UI-01` | `ADR-005` | `CASE-DATA-01-1`, `CASE-UI-01-3` |
| `TYPES-003` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-2` |
| `TYPES-004` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-3` |
| `TYPES-005` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-3` |
| `TYPES-006` | `SPEC-DATA-03` | `ADR-004`, `ADR-005` | `CASE-DATA-03-1` |
| `TYPES-007` | `SPEC-DATA-03`, `SPEC-ENG-03`, `SPEC-UI-02` | `ADR-004`, `ADR-005` | `CASE-DATA-03-1`, `CASE-ENG-03-1..4`, `CASE-UI-02-3` |
| `TYPES-008` | `SPEC-DATA-03` | `ADR-004`, `ADR-005` | `CASE-DATA-03-1`, `CASE-DATA-03-2`, `CASE-DATA-03-3`, `CASE-DATA-03-4` |
| `TYPES-009` | `SPEC-ENG-01` | `ADR-004` | `CASE-ENG-01-1`, `CASE-ENG-01-2` |
| `TYPES-010` | `SPEC-ENG-01`, `SPEC-ENG-02` | `ADR-004` | `CASE-ENG-01-2`, `CASE-ENG-02-1`, `CASE-ENG-02-2` |
| `TYPES-011` | `SPEC-SRV-02` | `ADR-001` | `— (contrat d'interface pure)` |
| `TYPES-012` | `SPEC-UI-02`, `SPEC-UI-03`, `SPEC-ENG-04` | `— (découplage engine/UI)` | `CASE-UI-02-4`, `CASE-UI-03-1`, `CASE-ENG-04-3` |
| `TYPES-013` | `SPEC-ENG-03`, `SPEC-ENG-04` | `— (statuts fins de blocs)` | `CASE-ENG-03-6` |
| `TYPES-014` | `SPEC-SRV-01`, `SPEC-ARCH-01` | `ADR-022` | `CASE-SRV-01-8`, `CASE-ARCH-01-1` |
| `TYPES-015` | `SPEC-SRV-01`, `SPEC-ARCH-01` | `ADR-022` | `CASE-SRV-01-9`, `CASE-ARCH-01-1` |

### 6.2 Sceau Formel d'Attestation

Le présent document engage contractuellement la pureté déclarative de la couche **`types/`** :
1. Les 15 modules listés dans le tableau normalisé `TYPES-001` à `TYPES-015` sont certifiés sans aucun effet de bord runtime ni classe exécutée (`CASE-ARCH-01-2`).
2. Le Micro-DAG interne $\text{messages} \prec \text{models} \prec \text{contracts}$ est strictement respecté.
3. L'ensemble des contrats est validé par la suite de tests d'architecture automatisée Vitest (`tests/arch/`).

*Document validé et scellé pour le Palier 1 (`src/types/`).*
