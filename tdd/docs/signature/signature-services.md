# Signature de Domaine — `src/services/` (Palier 5 : Orchestration Applicative)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `SERVICES`  
**Couche DAG :** `5-services` *(Orchestration applicative — combine domain/ et lib/ sans connaître le transport réseau)*  
**Peut importer :** `types/`, `utils/`, `domain/`, `lib/`  
**Peut être importé par :** `controllers`, `index.ts`  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-01`..`05`), [`ENG.md`](../specs/ENG.md) (`SPEC-ENG-01`..`04`), [`ADPT.md`](../specs/ADPT.md) (`SPEC-ADPT-01`, `SPEC-ADPT-03`), [`UI.md`](../specs/UI.md) (`SPEC-UI-01`, `SPEC-UI-03`, `SPEC-UI-04`), décisions d'architecture ([`ADR-002`](../adr/ADR-002-gestionnaire-de-processus-cli.md), [`ADR-004`](../adr/ADR-004-moteur-de-blocs-en-memoire.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md), [`ADR-006`](../adr/ADR-006-strategie-et-harnais-de-test.md), [`ADR-017`](../adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`services/`** matérialise le **Palier 5 et le cœur de coordination applicative** de ClientsBox.  
Sa mission exclusive est d'orchestrer les cas d'usage en reliant les algorithmes purs du domaine (`domain/`) aux connecteurs techniques (`lib/`), tout en demeurant complètement agnostique aux protocoles de communication réseau (HTTP/SSE).

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 5

1. **Agnosticisme du Transport Réseau (`SPEC-ARCH-01`) :**
   - Les services ne connaissent ni `http`, ni `net`, ni WebSocket, ni le format de trames SSE.
   - Toute interaction avec le client externe transite par des callbacks injectés ou des structures d'événements mémoire gérées par les contrôleurs.
2. **Volatilité Stricte de l'État Runtime (`R-37`) :**
   - L'état d'exécution d'un scénario (sacs d'entrées, statuts de nœuds `BlockStatus`, cycles d'injection de prompt) réside exclusivement en mémoire vive.
   - Aucune trace d'exécution volatile n'est polluée sur le disque.
3. **Injection de Dépendances Explicite :**
   - Les services reçoivent leurs dépendances concrètes (`CLIAdapter[]`, `workspacePath`) via constructeur, sans jamais lire directement `process.env` ou `process.cwd()`.
4. **Délégation Intégrale de la Persistance à `lib/fs/` :**
   - Aucun service n'invoque directement les primitives système `fs.*`. Toutes les écritures et lectures transitent par `atomic-writer.ts`, `fresh-reader.ts` et `file-remover.ts`.
5. **Cycle de Vie Éphémère du Runner :**
   - Une nouvelle instance de `ScenarioRunnerService` est instanciée pour chaque démarrage de scénario et détruite dès sa complétion ou son arrêt d'urgence.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 5 — Orchestrateur Applicatif)

Dans le DAG macro, `services/` réalise la synthèse unilatérale entre les couches inférieures et alimente les couches d'exposition :

```text
       ┌───────────────┐                 ┌───────────────┐
       │    domain/    │                 │     lib/      │
       │ (Métier pur)  │                 │  (I/O Système)│
       └───────┬───────┘                 └───────┬───────┘
               │                                 │
               └─────────────────┬───────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │services/ (Pal. 5) │
                       │    Cas d'usage    │
                       └─────────┬─────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   controllers/    │
                       └───────────────────┘
```

### 2.2 Micro-DAG Intra-Couche (Ordre Topologique des 5 Sous-Domaines)

Au sein de `services/`, les dépendances internes respectent une hiérarchie stricte sans boucle :

$$\text{resources} \prec \text{adapters} \prec \text{agents} \prec \text{docs} \prec \text{runner}$$

```text
       ┌────────────────────────┐    ┌────────────────────────┐
       │  services/resources/   │    │   services/adapters/   │
       │ resource-store,        │    │ adapter-registry       │
       │ if-script/scenario-st. │    │ (SVC-003)              │
       │ (SVC-002, 006, 007)    │    │                        │
       └───────────┬────────────┘    └───────────┬────────────┘
                   │                             │
                   └──────────────┬──────────────┘
                                  │
                       ┌──────────▼──────────┐
                       │  services/agents/   │
                       │ agent.service.ts    │
                       │ (SVC-004)           │
                       └──────────┬──────────┘
                                  │
       ┌────────────────────────┐ │
       │     services/docs/     │ │
       │ user-docs.service.ts   │ │
       │ (SVC-013)              │ │
       └──────────┬─────────────┘ │
                  │               │
                  └───────┬───────┘
                          │
               ┌──────────▼──────────┐
               │  services/runner/   │
               │ host, graph, blocks,│
               │ process, session,   │
               │ call-scenario       │
               │ (SVC-001, 005,      │
               │  008..012, 014..020)│
               └─────────────────────┘
```

> **Garantie d'acyclicité interne :**  
> `resources/` et `adapters/` constituent le socle de base de la couche.  
> `agents/` s'appuie sur `resources/` et `adapters/` pour garantir l'intégrité relationnelle.  
> `docs/` orchestre la lecture du manifeste et l'export local.  
> `runner/` orchestre l'exécution runtime complète sans qu'aucun service subalterne n'ait connaissance de son existence.

---

## 3. Inventaire & Arborescence des Fichiers (`src/services/`)

```text
src/services/
├── resources/                                           # Micro-DAG 5.1 : Persistance & validation des ressources
│   ├── if-script-storage.helper.ts                      # [SVC-006] Lecture/résolution sécurisée des scripts If
│   ├── scenario-storage.helper.ts                       # [SVC-007] Persistance scénarios et nettoyage no-save
│   └── resource-store.service.ts                        # [SVC-002] Façade CRUD typée vers .agents/data/
├── adapters/                                            # Micro-DAG 5.2 : Registre des connecteurs CLI
│   └── adapter-registry.service.ts                      # [SVC-003] Registre des adapters CLI et modèles disponibles
├── agents/                                              # Micro-DAG 5.3 : Gestion du cycle de vie des agents
│   └── agent.service.ts                                 # [SVC-004] Intégrité référentielle profils/agents et clearContext
├── docs/                                                # Micro-DAG 5.4 : Documentation utilisateur embarquée
│   └── user-docs.service.ts                             # [SVC-013] Lecture du manifeste et export vers .agents/docs/
├── config/                                              # Micro-DAG 5.6 : Initialisation & déploiement de configuration
│   ├── config.service.ts                                # [SVC-021] Service orchestrateur de parsing CLI et d'environnement
│   ├── config.types.ts                                  # [SVC-022] Contrats et typage de configuration applicative
│   └── index.ts                                         # [SVC-023] Façade publique du service de configuration
└── runner/                                              # Micro-DAG 5.5 : Moteur d'exécution de scénario en mémoire
    ├── scenario-runner.service.ts                       # [SVC-001] Façade d'orchestration runtime complète du scénario
    ├── scenario-runner.types.ts                         # [SVC-018] Contrats d'options et handlers du ScenarioRunner
    ├── host/
    │   └── runner-host.bindings.ts                      # [SVC-017] Câblage processBag / lifecycleDeps / événements
    ├── graph/
    │   ├── runner-graph.scheduler.ts                    # [SVC-009] Ordonnanceur topologique d'acheminement des messages
    │   └── runner-lifecycle.manager.ts                  # [SVC-010] Validation de départ, finalisation et arrêt des blocs
    ├── blocks/
    │   ├── runner-block.executors.ts                    # [SVC-008] Exécuteurs spécialisés Run, If, ClearContext, CallScenario
    │   └── runner-block.processor.ts                    # [SVC-015] Traitement d'un nœud de graphe (statut + exécution)
    ├── command/
    │   └── runner-command.executor.ts                   # [SVC-024] Exécuteur du bloc Command (commande shell native OS)
    ├── process/
    │   ├── runner-process.spawner.ts                    # [SVC-005] Résolution de contexte et lancement CLI par bloc
    │   ├── runner-process.handlers.ts                   # [SVC-011] Écouteurs de flux et de fin de sous-processus
    │   └── runner-active-processes.ts                   # [SVC-014] Suivi spawns CLI et sous-runners CallScenario
    ├── session/
    │   └── runner-session.registry.ts                   # [SVC-012] Table mémoire des sessions conversationnelles du run
    └── call-scenario/
        ├── runner-call-scenario.helper.ts               # [SVC-016] Sous-exécution CallScenario nested in-process
        ├── runner-call-scenario.host.ts                 # [SVC-019] Câblage CallScenario depuis l'hôte runner
        └── runner-nested-child.factory.ts               # [SVC-020] Fabrique sous-runner + relay chunks CLI parent
```


### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| SVC-001 | services/runner/scenario-runner.service.ts | Orchestrateur runtime du graphe de scénario (join, pause, stop, streaming, timers, CallScenario). |
| SVC-002 | services/resources/resource-store.service.ts | Façade CRUD vers .agents/data/ avec validation de schéma et persistance atomique. |
| SVC-003 | services/adapters/adapter-registry.service.ts | Registre des adapters CLI embarqués et énumération des modèles supportés (listOperationalModels). |
| SVC-004 | services/agents/agent.service.ts | Logique applicative des agents (contrôle profilId, intégrité suppression profil, clearContext). |
| SVC-005 | services/runner/process/runner-process.spawner.ts | Exécution de sous-processus CLI, résolution de contexte et transmission du modèle de profil (SPEC-ENG-04). |
| SVC-006 | services/resources/if-script-storage.helper.ts | Accès disque aux scripts conditionnels If (répertoire data/if). |
| SVC-007 | services/resources/scenario-storage.helper.ts | CRUD scénarios pour ResourceStoreService (sanitize no-save + collisions clés). |
| SVC-008 | services/runner/blocks/runner-block.executors.ts | Exécution des blocs Run, If, ClearContext et CallScenario pour ScenarioRunnerService (SPEC-ENG-03). |
| SVC-009 | services/runner/graph/runner-graph.scheduler.ts | Ordonnanceur de graphe de SVC-001 : acheminement des messages par connexion. |
| SVC-010 | services/runner/graph/runner-lifecycle.manager.ts | Cycle de vie d'un run : validation topologie, finalisation et arrêt blocs. |
| SVC-011 | services/runner/process/runner-process.handlers.ts | Gestionnaires d'écouteurs de flux et de fin d'exécution du spawner de runner. |
| SVC-012 | services/runner/session/runner-session.registry.ts | Table des sessions conversationnelles d'une exécution de scénario (SPEC-ADPT-03). |
| SVC-013 | services/docs/user-docs.service.ts | Documentation utilisateur : liste le manifeste embarqué et exporte le miroir Markdown vers docsRoot (.agents/docs/). |
| SVC-014 | services/runner/process/runner-active-processes.ts | Suivi des spawns CLI et sous-runners CallScenario (arrêt d'urgence, fail de bloc). |
| SVC-015 | services/runner/blocks/runner-block.processor.ts | Traitement d'un nœud de graphe : exécution, statut et délégation spawn/CallScenario. |
| SVC-016 | services/runner/call-scenario/runner-call-scenario.helper.ts | Sous-exécution CallScenario nested in-process (borne `CALL_SCENARIO_MAX_DEPTH`, track/untrack enfant, ADR-018). |
| SVC-017 | services/runner/host/runner-host.bindings.ts | Câblage processBag, lifecycleDeps et pont d'événements du ScenarioRunnerService. |
| SVC-018 | services/runner/scenario-runner.types.ts | Contrats d'options et handlers d'événement du ScenarioRunnerService. |
| SVC-019 | services/runner/call-scenario/runner-call-scenario.host.ts | Câblage CallScenario depuis l'hôte ScenarioRunnerService (ADR-018 / REQ-040). |
| SVC-020 | services/runner/call-scenario/runner-nested-child.factory.ts | Fabrique de sous-runner CallScenario + relay des chunks CLI vers le parent (AC-ENG-03-6). |
| SVC-021 | services/config/config.service.ts | Service orchestrateur de parsing CLI, chargement d'environnement et production de AppConfig (ADR-022, SPEC-SRV-01). |
| SVC-022 | services/config/config.types.ts | Types, interfaces et options de déploiement de configuration applicative. |
| SVC-023 | services/config/index.ts | Point d'entrée public et exports du service de configuration. |
| SVC-024 | services/runner/command/runner-command.executor.ts | Exécuteur spécialisé du bloc Command : commande shell native OS (ADR-019 / SPEC-ENG-03 / SPEC-ENG-04). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

- **Instanciation par exécution de scénario :** `ScenarioRunnerService` n'est pas un singleton : il est instancié à la demande lors d'un appel `POST /api/scenarios/:id/run` et référencé de manière éphémère par le contrôleur d'exécution (`CTL-002`).
- **Gestion des microtâches en TU (`flushPromises`) :** l'asynchronisme de la boucle de distribution de messages requiert de purger les promesses en attente avant d'affirmer l'état d'un bloc (`ADR-006`).
- **Intégrité référentielle à la suppression :** `AgentService.deleteProfile` bloque formellement la suppression de profils orphelins avec message en français et code 409 (`R-05`).
- **Distribution binaire de puissance If (`R-15`) :** `SVC-001` garantit que l'une des branches reçoit `power = 1` et l'autre `power = 0` conformément au résultat du script conditionnel.
- **Ordonnancement topologique et moteur de graphe (`SVC-001`) :** Le runner résout l'exécution pas à pas en suivant les connexions réelles entre blocs. Il évalue dynamiquement les scripts conditionnels `if(sac)` via `dynamic-module-loader.fs.ts` (`LIB-003`), gère la mise en attente (`Waiting`/`pause`) des blocs `Join` tant que les dépendances amont ne sont pas satisfaites ($N \ge 1$) sans avancer prématurément le scheduler sur ce nœud, exécute les blocs `ClearContext` en émettant un `BlockMessage` avec `{ power: 1 }` sur leurs connexions de sortie, met à jour explicitement l'état d'injection de la politique de prompt (`PolicyInjectionState`) dans une map mémoire par agent après toute injection réussie de `systemPrompt`, et accepte `AgentService` injecté dans ses options d'exécution.
- **Règles de consommation du sac d'entrées (`inputs`) :** Les blocs `Run` et `ClearContext` ne lisent pas le sac d'entrées ; le bloc conditionnel `If` lit impérativement le sac d'entrées pour son évaluation. En cas d'erreur lors de l'exécution d'un script `If`, le runner émet un statut de bloc erreur en français (`BlockStatus` explicite) sans jamais faire crasher le processus Node.js.
- **Découplage Clear vs Stop & Arrêt d'urgence (`SVC-001`, `SVC-004`) :** Ni la commande HTTP de réinitialisation (`POST /api/agents/:id/clear`) ni le bloc `ClearContext` n'invoquent `stop()` sur le runner actif ; ils déclenchent la réinitialisation de l'historique conversationnel et réinitialisent l'état de politique locale de l'agent concerné (`onClearContext`). L'arrêt d'urgence global du runner applique un délai de grâce `STOP_GRACE_MS = 3000` via `child-process.spawner.ts` (`LIB-004`) avant terminaison forcée.
- **Lecture et résolution des scripts de ressources (`SVC-002`) :** `ResourceStoreService` expose les méthodes `readIfScript(id: string): string` (lecture textuelle fraîche sans cache) et `resolveIfScriptPath(id: string): string` pour l'inspection et l'exécution de scripts personnalisés, avec vérification de l'absence de chemin hors du dossier autorisé. L'I/O If et le sanitize scénario (strip no-save `DOM-018`) sont délégués à `SVC-006` / `SVC-007`.
- **Cycle de vie runner (`SVC-001`) :** validation topologie / finalisation / stop idle sont délégués à `SVC-010` via callbacks immuables (pas de mutation de paramètre).
- **Réinitialisation réelle de contexte (`SVC-004`) :** `AgentService.clearContext(agentId)` réinitialise effectivement l'état conversationnel de l'agent spécifié.
- **Export documentation utilisateur (`SVC-013`, `ADR-017`) :** reçoit `docsRoot` par injection ; expose `listDocs()` (contenu embarqué) et `exportDocs()` (écriture via `text-atomic-writer.fs.ts` `LIB-019` sous `.agents/docs/`, hors `data/`) ; aucun export automatique au boot.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`services`** | `types/`, `utils/`, `domain/`, `lib/` | Modules système de transport réseau direct (`node:http`), `controllers/`, `ui/`, `index.ts` | `controllers/`, `index.ts` | Violation bloquante détectée par `CASE-ARCH-01-1` (interdiction formelle de dépendance ascendante). |
| **`services/resources`** | `types/models/`, `utils/`, `domain/keys/`, `lib/fs/` | Autres services de `services/` | `agents/`, `runner/`, `controllers/` | Ordre topologique strict interne. |
| **`services/adapters`** | `types/contracts/`, `types/models/` | `resources/`, `agents/`, `runner/`, `controllers/` | `agents/`, `runner/`, `controllers/`, `index.ts` | Ordre topologique strict interne. |
| **`services/agents`** | `types/`, `resources/`, `adapters/` | `runner/` | `controllers/`, `index.ts` | Contrôlé par l'absence de cycles statiques. |
| **`services/runner`** | `types/`, `utils/`, `domain/`, `lib/`, `resources/`, `adapters/`, `agents/` | `controllers/`, `ui/`, `index.ts` | `controllers/execution.controller.ts`, `index.ts` | Interdiction formelle de dépendance descendante inverse (`CASE-ARCH-01-1`). |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `SVC-001` | `SPEC-ENG-01..04`, `SPEC-DATA-01..03`, `SPEC-ADPT-03` | `ADR-002`, `ADR-004`, `ADR-006` | `CASE-ENG-01-1..2`, `CASE-ENG-02-1..3`, `CASE-ENG-03-1..4`, `CASE-ENG-04-1..3`, `CASE-DATA-01-3`, `CASE-DATA-02-2..3`, `CASE-ADPT-03-1` |
| `SVC-002` | `SPEC-DATA-01..04` | `ADR-005` | `CASE-DATA-01-1..4`, `CASE-DATA-02-1`, `CASE-DATA-03-1`, `CASE-DATA-03-4`, `CASE-DATA-04-1..3` |
| `SVC-003` | `SPEC-ADPT-01`, `SPEC-UI-01` | `ADR-002`, `ADR-003` | `CASE-UI-01-3` |
| `SVC-004` | `SPEC-DATA-01`, `SPEC-UI-01`, `SPEC-UI-03`, `REQ-021`, `R-05` | `ADR-005` | `CASE-DATA-01-1`, `CASE-DATA-01-5` (rejet 409 suppression profil lié), `CASE-UI-01-3`, `CASE-UI-03-3` |
| `SVC-005` | `SPEC-ENG-04`, `SPEC-ADPT-03` | `ADR-002` | `CASE-ENG-04-1..3`, `CASE-ADPT-03-1` |
| `SVC-006` | `SPEC-DATA-02` | `ADR-005` | `CASE-DATA-02-1..3` |
| `SVC-007` | `SPEC-DATA-03` | `ADR-005` | `CASE-DATA-03-1`, `CASE-DATA-03-6` |
| `SVC-008` | `SPEC-ENG-01`, `SPEC-ENG-03` | `ADR-004` | `CASE-ENG-01-1..2`, `CASE-ENG-03-1..6` |
| `SVC-009` | `SPEC-ENG-01`, `SPEC-ENG-03` | `ADR-004` | `CASE-ENG-01-1`, `CASE-ENG-03-1` |
| `SVC-010` | `SPEC-ENG-03` | `ADR-004` | `CASE-ENG-03-1..4` |
| `SVC-011` | `SPEC-ENG-03`, `SPEC-ADPT-03` | `ADR-002`, `ADR-006` | `CASE-ENG-03-1..4`, `CASE-ADPT-03-1` |
| `SVC-012` | `SPEC-ADPT-03` | `ADR-002` | `CASE-ADPT-03-1..2` |
| `SVC-013` | `SPEC-DATA-05`, `SPEC-SRV-02`, `SPEC-UI-04` | `ADR-012`, `ADR-017` | `CASE-DATA-05-1..3`, `CASE-SRV-02-17..18` |
| `SVC-014` | `SPEC-ENG-03`, `SPEC-ENG-04`, `SPEC-ADPT-03` | `ADR-002`, `ADR-018` | `CASE-ENG-03-7`, `CASE-ENG-04-11`, `CASE-ADPT-03-6` |
| `SVC-015` | `SPEC-ENG-03`, `SPEC-ENG-04` | `ADR-004`, `ADR-018` | `CASE-ENG-03-7`, `CASE-ENG-04-4` |
| `SVC-016` | `SPEC-ENG-03`, `SPEC-ENG-04`, `REQ-040`, `REQ-041` | `ADR-018` | `CASE-ENG-03-7`, `CASE-ENG-04-11` |
| `SVC-017` | `SPEC-ENG-04` | `ADR-004` | `CASE-ENG-04-4`, `CASE-ENG-04-10` |
| `SVC-018` | `SPEC-ENG-04` | `ADR-004` | `CASE-ENG-04-4` |
| `SVC-019` | `SPEC-ENG-03`, `REQ-040`, `REQ-041` | `ADR-018` | `CASE-ENG-03-7`, `CASE-ENG-03-8` |
| `SVC-020` | `SPEC-ENG-03`, `AC-ENG-03-6`, `REQ-040` | `ADR-018` | `CASE-ENG-03-8` |
| `SVC-021` | `SPEC-SRV-01`, `SPEC-ARCH-01` | `ADR-022` | `CASE-SRV-01-8`, `CASE-SRV-01-9` |
| `SVC-022` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-9` |
| `SVC-023` | `SPEC-SRV-01` | `ADR-022` | `CASE-SRV-01-9` |
| `SVC-024` | `SPEC-ENG-03`, `SPEC-ENG-04` | `ADR-019` | `CASE-ENG-04-12` |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste contractuellement de l'intégrité de l'orchestration applicative **`src/services/`** :
1. Les 24 services `SVC-001` à `SVC-024` relient de manière acyclique la logique du domaine aux connecteurs techniques.
2. Zéro état runtime persistant sur disque (`R-37`).
3. La couverture est vérifiée en continu par l'ensemble des suites `tests/eng/`, `tests/data/`, `tests/adpt/`, `tests/srv/` et `tests/arch/`.

*Document validé et scellé pour le Palier 5 (`src/services/`).*
