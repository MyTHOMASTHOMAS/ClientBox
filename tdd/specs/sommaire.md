# Sommaire des Spécifications Fonctionnelles & Techniques — ClientsBox

> **Document de référence :** `tdd/specs/sommaire.md`  
> **Statut :** Proposé pour validation  
> **Version :** v1.9 (2026-11-24, CR-014 Conteneurisation Docker / CDC v2.5)
> **Autorité d'arbitrage :** Autrement (`U`)  
> **Ancrage amont :** `tdd/docs/cdc/cahier-des-charges-v2.5.md` (CR-009 à CR-014) + `tdd/docs/adr/ADR-001` à `ADR-022`  
> **Méthodologie TDD :** Gabarit [`domaine.template.md`](./domaine.template.md) — Chaîne `CDC/ADR → SPEC → CASE → TEST → CODE`

---

## 1. Vue d'ensemble & Architecture des Domaines

Le présent sommaire formalise la structure complète des spécifications détaillées de ClientsBox v1.
Il décline les exigences du Cahier des Charges et les décisions d'architecture en **6 Domaines fonctionnels et techniques**, subdivisés en **30 Spécifications unitaires (`SPEC-<DOM>-nn`)**.

```text
tdd/specs/
├── sommaire.md          # Le présent document d'orientation et de traçabilité
├── SRV.md               # Domaine SRV : Socle applicatif & Serveur HTTP (2 specs)
├── DATA.md              # Domaine DATA : Persistance .agents/data/ + export docs (5 specs)
├── ADPT.md              # Domaine ADPT : Contrats d'Adapters, cursor-cli, antigravity, codex-cli & claude-cli (6 specs)
├── ENG.md               # Domaine ENG : Moteur de blocs, Join & Ordonnancement (4 specs)
├── UI.md                # Domaine UI : IHM, Canvas, Terminal & Instructions (4 specs)
└── ARCH.md              # Domaine ARCH : Architecture Technique, DAG, Qualité & Audit (9 specs)
```

---

## 2. Matrice d'Alignement Macro : CDC ↔ ADR ↔ Domaines

| Domaine | Fichier de spec | Responsabilité principale | ADR d'ancrage | Exigences CDC majeures |
| :--- | :--- | :--- | :--- | :--- |
| **`SRV`** | [`SRV.md`](./SRV.md) | Démarrage CLI, configuration d'environnement dynamique, résolution workspace, serveur HTTP local, conteneurisation Docker, routes docs | [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md), [`ADR-017`](../docs/adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md), [`ADR-020`](../docs/adr/ADR-020-cli-exec-scene.md), [`ADR-022`](../docs/adr/ADR-022-chargement-dynamique-environnement.md) | REQ-001 à REQ-006, REQ-044, REQ-046 à REQ-049, R-35, R-48, R-50 à R-53, REQ-113 à REQ-115, Contraintes 1–7, 16–18 |
| **`DATA`** | [`DATA.md`](./DATA.md) | Formats JSON/JS, CRUD ressources, intégrité `.agents/data/`, export `.agents/docs/` | [`ADR-005`](../docs/adr/ADR-005-persistance-data.md), [`ADR-017`](../docs/adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md) | REQ-009 à REQ-012, R-01, R-02, R-05, R-06, R-16, R-36, Annexe A |
| **`ADPT`** | [`ADPT.md`](./ADPT.md) | Contrat `CLIAdapter`, binaire cursor-cli, flux stream, stop, sessions de scénario | [`ADR-002`](../docs/adr/ADR-002-contrat-adapter.md), [`ADR-003`](../docs/adr/ADR-003-adapter-cursor-cli.md) | REQ-008, REQ-013, REQ-021 à 032, R-04, R-18, R-27 à 30, R-34, R-40 |
| **`ENG`** | [`ENG.md`](./ENG.md) | Moteur graphe en mémoire, join `N≥1`, power, pause, prompt R-45, CallScenario, Command | [`ADR-004`](../docs/adr/ADR-004-moteur-blocs.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md), [`ADR-019`](../docs/adr/ADR-019-bloc-command.md) | REQ-014 à REQ-020, REQ-026, REQ-033 à 043, R-08 à 15, R-25, R-42 à 47 |
| **`UI`** | [`UI.md`](./UI.md) | IHM française, Canvas type N8N (6 blocs), terminal live, page Instructions | CDC §6 + [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md) / [`ADR-004`](../docs/adr/ADR-004-moteur-blocs.md) / [`ADR-017`](../docs/adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md) / [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md) / [`ADR-019`](../docs/adr/ADR-019-bloc-command.md) | REQ-007, REQ-008, REQ-014, REQ-024, REQ-025, REQ-030, REQ-039…043, R-26, R-34, R-46, R-47 |
| **`ARCH`** | [`ARCH.md`](./ARCH.md) | Graphe DAG, pureté domaine (zéro-I/O), isolation lib, découplage & erreurs FR | [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md) à [`ADR-006`](../docs/adr/ADR-006-strategie-et-harnais-de-test.md) | Signatures `ROOT`, `TYPES`, `UTILS`, `DOM`, `LIB`, `SVC`, `CTL`, `UI`, REQ-007, C-06 |

---

## 3. Catalogue Détaillé des Domaines et Spécifications

### 3.1 Domaine `SRV` — Socle Applicatif & Serveur HTTP
*Fichier cible :* `tdd/specs/SRV.md` | *ADR rattaché :* `ADR-001`

* **`SPEC-SRV-01` — Démarrage CLI, configuration du port et résolution du workspace**
  * **Exigences :** `REQ-001`, `REQ-002`, `REQ-003`, `REQ-005`, `REQ-006`, `REQ-031`, `REQ-044`, `REQ-046`, `REQ-047`, `REQ-049`, `R-35`, `R-40`, `R-48`, `R-50`, `R-51`, `R-53`, `Contraintes 1, 2, 4, 7, 16, 17, 18`, `REQ-102`, `REQ-108`, `REQ-112`, `REQ-113`, `REQ-114`, `REQ-115`
  * **Règle :** ClientsBox est un livrable standalone JavaScript (`clientsbox.js`). Il démarre sous Node ≥ 24.
    - **Initialisation dynamique de l'environnement et déploiement configuration (runtime) :** déploie la configuration au tout début de `main()` via `ConfigService.deploy(process.argv.slice(2))` selon les schémas de `src/config/`. Recherche de `env/.env` (résilient si absent, repli sur `process.env`) ou chargement explicite via `-e <chemin>` / `--env <chemin>` (rejet fatal immédiat `EnvLoadError` si le fichier spécifié est introuvable). Validation stricte des 4 binaires d'agents obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`) au runtime et assignation des valeurs par défaut (`PORT=2974`, `HOST=127.0.0.1`, `AGENTS_DIR=.agents`, `LOGS_DISABLED=false`, etc.). En environnement conteneurisé Docker officiel (`Dockerfile`), la variable `HOST=0.0.0.0` est nativement injectée afin d'écouter sur toutes les interfaces réseau du conteneur (`R-51`, `REQ-047`, `C-16`), assurant une portabilité 100 % transparente sans aucune modification du code applicatif sous `src/` (`REQ-113`).
    - **Mode Serveur (défaut) :** en l'absence de `--exec-scene`, le port est résolu par priorité (option CLI `-p` / `--port`, puis variable `PORT`, puis défaut `2974`). Si le port est déjà occupé, le processus s'interrompt immédiatement avec un code d'erreur explicite sans tenter de port alternatif.
    - **Mode Headless direct (`--exec-scene`) :** si l'option `--exec-scene <cible>` est fournie, ClientsBox résout le scénario (par `id` prioritaire puis par `name`), et l'exécute directement en streaming console sans instancier de serveur HTTP ni lier de port TCP. Terminaison avec exit code `0` en succès, `1` en erreur, et `130` sur SIGINT (Ctrl+C).
    Le répertoire courant (`cwd`) lors du lancement définit obligatoirement `workspacePath`.
  * **Scénarios nominaux :**
    - Lancement sans argument : écoute sur `http://localhost:2974`, workspace = `process.cwd()`.
    - Lancement avec `--port 8080` : écoute sur `http://localhost:8080`.
    - Lancement avec fichier `env/.env` ou option `-e custom.env` : chargement et validation des variables d'environnement au runtime.
    - Lancement avec `--exec-scene test-step1-dialogue` : exécution headless directe en console sans serveur HTTP, streaming temps réel et sortie exit 0.
  * **Cas limites :**
    - Fichier explicite `-e` inexistant : arrêt fatal immédiat avec message explicite en français.
    - Option `-e` sans argument de chemin : erreur de syntaxe `ServerCliParseError` avec message d'usage.
    - L'un des 4 binaires obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`) absent, vide ou non exécutable : arrêt fatal au démarrage avec renvoi vers `env/.env.example`.
    - Port non numérique ou hors plage (1–65535) : échec immédiat avec message d'usage.
    - Port déjà utilisé (EADDRINUSE) en mode serveur : arrêt immédiat, message d'erreur sur stderr, code exit > 0.
    - Scénario introuvable ou échec de bloc en mode headless : erreur sur stderr, arrêt avec exit 1.
    - Interruption Ctrl+C en mode headless : arrêt d'urgence des sous-processus actifs (SIGTERM/SIGKILL) et exit 130.
  * **Critères d'acceptation :** `AC-SRV-01-1` (port par défaut), `AC-SRV-01-2` (port personnalisé), `AC-SRV-01-3` (échec port occupé), `AC-SRV-01-4` (résolution workspace), `AC-SRV-01-5` (parsing `--exec-scene`), `AC-SRV-01-6` (exécution headless nominale streaming console exit 0), `AC-SRV-01-7` (résilience erreurs et SIGINT exit 1/130), `AC-SRV-01-8` (parsing et validation options `-e`/`--env`), `AC-SRV-01-9` (déploiement via ConfigService, chargement runtime, validation des 4 binaires obligatoires, arrêt fatal si -e inexistant ou exécutable manquant).

* **`SPEC-SRV-02` — Serveur HTTP local, exposition de l'API et affichage console**
  * **Exigences :** `REQ-003`, `REQ-004`, `REQ-047`, `REQ-048`, `REQ-049`, `R-51`, `R-52`, `R-53`, `Contraintes 5, 11, 16, 18`, `ADR-017`, `REQ-114`
  * **Règle :** Le serveur HTTP local distribue les fichiers statiques de l'application et les endpoints d'API (REST/SSE ou WebSocket), y compris `GET /api/docs` et `POST /api/docs/export` (source embarquée, export vers `.agents/docs/`). Au démarrage, l'URL d'accès est imprimée dans la console du terminal OS. Aucun navigateur n'est ouvert automatiquement. Aucune couche d'authentification ni sandbox n'est requise (application mono-utilisateur locale). En environnement conteneurisé Docker (Mode 1 Compose per ADR-022 et CDC v2.5), l'exposition sur l'hôte est strictement bornée à `127.0.0.1:2974:2974` (`REQ-114`, `C-16`), et l'exécution conteneurisée requiert le drapeau `--init` (Tini) pour garantir l'arrêt gracieux et la sortie avec le code 130 sur SIGINT (`R-53`, `C-18`).
  * **Scénarios nominaux :**
    - Affichage de la bannière console avec l'URL cliquable dès que l'écoute est effective.
    - Service des routes API et du bundle web statique avec en-têtes HTTP adéquats.
    - Consultation doc embarquée (`GET /api/docs`) et export local (`POST /api/docs/export`).
  * **Cas limites :**
    - Arrêt propre (SIGINT / Ctrl+C) libérant le port et arrêtant les éventuels sous-processus actifs.
    - Échec I/O d'export docs : erreur HTTP en français.
  * **Critères d'acceptation :** `AC-SRV-02-1` (service statique/API), `AC-SRV-02-2` (affichage URL console sans auto-open), `AC-SRV-02-3` (arrêt propre), `AC-SRV-02-4` (mono-utilisateur sans auth/sandbox), `AC-SRV-02-5` (cascade SIGINT/SIGTERM), `AC-SRV-02-9` (résolution répertoire data via AGENTS_DIR), `AC-SRV-02-10` (`CASE-SRV-02-17` GET /api/docs), `AC-SRV-02-11` (`CASE-SRV-02-18` POST /api/docs/export).

---

### 3.2 Domaine `DATA` — Ressources & Persistance sous `.agents/data/`
*Fichier cible :* `tdd/specs/DATA.md` | *ADR rattachés :* `ADR-005`, `ADR-017`

* **`SPEC-DATA-01` — Schémas JSON et validation des ressources déclaratives**
  * **Exigences :** `REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `R-01`, `R-02`, `R-05`, `R-06`, `Annexe A`, `D.3`
  * **Règle :** Chaque ressource sous `.agents/data/` possède son dossier dédié et est enregistrée au format JSON (un fichier = une ressource).
    - `agents/` : `{ id, name, profilId, ... }` (1 agent a strictement 1 profil).
    - `profils/` : `{ id, name, systemPrompt, policy: 'chaque_prompt' | 'debut_scenario' | 'une_fois_jusqu_a_clear', model?: string }` (partageable entre agents, modèle d'IA optionnel).
    - `prompts/` : `{ id, name, content }`.
    - `exit/` : `{ id, name, content }` (prompt d'ordre de sortie additionné en fin de prompt d'un Run per R-07).
  * **Scénarios nominaux :**
    - Création, lecture et validation de chaque type de ressource avec schéma JSON strict.
    - Association d'un profil à plusieurs agents et spécification optionnelle d'un modèle d'IA (`model`).
  * **Cas limites :**
    - Fichier JSON corrompu ou champ obligatoire manquant : rejet propre avec notification d'erreur sans crash du serveur.
    - Enum politique de profil invalide : refus à la validation.
    - Type non-chaîne pour le champ `model` de profil : refus de validation.
  * **Critères d'acceptation :** `AC-DATA-01-1` (schéma agent), `AC-DATA-01-2` (schéma profil et 3 politiques), `AC-DATA-01-3` (schémas prompt/exit), `AC-DATA-01-4` (rejet données invalides), `AC-DATA-01-6` (champ optionnel model sur profil).

* **`SPEC-DATA-02` — Modèle et chargement dynamique des scripts conditionnels JS (`if`)**
  * **Exigences :** `REQ-104`, `R-01`, `R-02`, `R-14`, `Contrainte 9`
  * **Règle :** Les conditions des blocs If résident dans `data/if/<nom>.js`. Elles doivent obligatoirement exporter une fonction JavaScript recevant le sac d'entrées et retournant un booléen : `export default function (sac: BlockInputBag): boolean` (ou `module.exports = function(sac)`). Aucun JSON n'est utilisé pour la ressource `if`.
  * **Scénarios nominaux :**
    - Évaluation d'une fonction testant une valeur dans le sac : `sac.input0.value.includes('OK') => true`.
  * **Cas limites :**
    - Erreur de syntaxe dans le script JS : capture au chargement, échec explicite.
    - Exception levée lors de l'exécution de la fonction `if(sac)` : interceptée, scénario stoppé en erreur.
  * **Critères d'acceptation :** `AC-DATA-02-1` (chargement fichier .js), `AC-DATA-02-2` (évaluation nominale), `AC-DATA-02-3` (gestion d'erreur d'exécution du script).

* **`SPEC-DATA-03` — Format, intégrité et persistance des graphes de scénario**
  * **Exigences :** `REQ-014`, `REQ-034`, `REQ-035`, `REQ-036`, `REQ-039`, `REQ-041`, `REQ-042`, `REQ-043`, `REQ-111`, `R-16`, `R-17`, `R-37`, `R-43`, `R-46`, `R-47`
  * **Règle :** Les scénarios sont persistés dans `data/scenarios/<nom>.json`. Types v2.1 : `start|run|if|clearContext|callScenario|command` (`targetScenarioId` / `commandLine`). Clés d'entrées auto/custom ; no-save via `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`).
  * **Scénarios nominaux :**
    - Sauvegarde d'un graphe complet avec nœuds, liaisons et clés d'entrées.
    - Rechargement fidèle de la structure et du layout visuel.
    - Sérialisation sans les clés no-save ; relecture d'un JSON pollué avec strip.
  * **Cas limites :**
    - Collision de clés sur un même port d'entrée : interdite, rejetée à la sauvegarde.
    - JSON historique contenant `status` : ignoré à la lecture.
    - `commandLine` vide : rejet validation ; `callScenario` self-ref : accepté.
  * **Critères d'acceptation :** `AC-DATA-03-1` … `AC-DATA-03-6`, `AC-DATA-03-7` (CallScenario), `AC-DATA-03-8` (Command).

* **`SPEC-DATA-04` — Synchronisation bidirectionnelle UI ↔ Fichiers et exclusion des logs**
  * **Exigences :** `REQ-009 à 012`, `REQ-034`, `R-36`, `R-37`
  * **Règle :** Toute ressource est modifiable indifféremment via l'IHM ou directement dans le système de fichiers par l'utilisateur (workflow git de Sam). L'UI relit le disque comme unique source de vérité sans cache opaque. Aucun log d'exécution, chunk de stream ni historique d'agent n'est écrit sous `data/`.
  * **Scénarios nominaux :**
    - Modification manuelle d'un prompt sur disque : immédiatement prise en compte par le serveur.
    - Création via UI : création immédiate du fichier correspondant sous `data/`.
  * **Cas limites :**
    - Suppression externe d'un fichier utilisé par un scénario en cours : détection à l'exécution et arrêt propre.
  * **Critères d'acceptation :** `AC-DATA-04-1` (CRUD fichiers et UI), `AC-DATA-04-2` (relecture disque source de vérité), `AC-DATA-04-3` (zéro persistance de logs sous `data/`).

* **`SPEC-DATA-05` — Documentation utilisateur exportée sous `.agents/docs/`**
  * **Exigences :** `REQ-003`, `REQ-007`, `REQ-108`, `ADR-005`, `ADR-012`, `ADR-017`
  * **Règle :** La doc d'utilisation (source `docs/instructions/**/*.md`, embarquée au build) est exportée sur action utilisateur vers `<AGENTS_DIR>/docs/` (défaut `.agents/docs/`), hors `.agents/data/`.
  * **Scénarios nominaux :**
    - Export réussi : miroir Markdown présent sous `.agents/docs/`.
    - Ré-export : miroir aligné sur la source embarquée.
  * **Cas limites :**
    - Dossier absent : création puis écriture.
    - Échec I/O : erreur explicite, pas d'écriture sous `data/`.
  * **Critères d'acceptation :** `AC-DATA-05-1` (présence miroir), `AC-DATA-05-2` (aucune écriture docs sous `data/`), `AC-DATA-05-3` (ré-export).

---

### 3.3 Domaine `ADPT` — Adapters CLI & cursor-cli
*Fichier cible :* `tdd/specs/ADPT.md` | *ADR rattachés :* `ADR-002`, `ADR-003`

* **`SPEC-ADPT-01` — Contrat d'adapter TypeScript et typage des flux d'événements**
  * **Exigences :** `REQ-027`, `REQ-028`, `REQ-103`, `R-18`, `R-29`, `D.1`
  * **Règle :** Tout adapter embarqué implémente l'interface `CLIAdapter`.
    - `buildCommand(ctx: ExecutionContext): { command, args, env?, cwd? }`
    - `parseStreamLine(line: string): AgentStreamEvent | null`
    - `createSession?(ctx: ExecutionContext): Promise<string>`
    - `listModels?(): Promise<readonly string[]>`
    `ExecutionContext` contient `workspacePath`, `agentId`, `assembledPrompt`, `sessionId?: string`, `model?: string` et `cliOpaque?: Record<string, unknown>`.
    `AgentStreamEvent` normalise les événements en `stdout`, `stderr`, `exit`, `error`.
  * **Scénarios nominaux :**
    - Validation statique TypeScript du contrat.
    - Découplage complet entre les blocs du canvas et les commandes brutes CLI.
  * **Cas limites :**
    - Ligne stream inattendue : parsée en fallback `stdout` brut sans crash du parser.
  * **Critères d'acceptation :** `AC-ADPT-01-1` (conformité interface `CLIAdapter`), `AC-ADPT-01-2` (typage `ExecutionContext` et pass-through `cliOpaque`), `AC-ADPT-01-3` (normalisation `AgentStreamEvent`), `AC-ADPT-01-5` (support `listModels` et champ `model`).

* **`SPEC-ADPT-02` — Spécialisation opérationnelle cursor-cli**
  * **Exigences :** `REQ-008`, `REQ-013`, `REQ-029`, `REQ-031`, `REQ-112`, `R-04`, `R-38`, `R-40`
  * **Règle :** L'adapter `cursor-cli` (`cliId = 'cursor-cli'`) est un adapter opérationnel embarqué. La commande est obligatoirement résolue via `process.env.CURSOR_CLI_BIN` (binaire Cursor Agent). Si la variable est absente ou pointe vers un exécutable inexistant, l'exécution échoue immédiatement avec un diagnostic explicite. `buildCommand` produit `-p --resume <sessionId> <assembledPrompt>` en injectant `--model <id>` si `ctx.model` est fourni et non vide ; `createSession` lance `create-chat` et retourne l'identifiant imprimé ; `listModels` extrait les modèles via `--list-models` avec mise en cache Node.js (TTL) et repli sur un tableau vide `[]` sans catalogue statique de secours fictif.
  * **Scénarios nominaux :**
    - `CURSOR_CLI_BIN=/usr/local/bin/cursor-agent` présent : génération de la commande correcte (avec ou sans `--model`) et exécution dans `workspacePath`.
    - Normalisation ligne à ligne des sorties JSON ou texte du CLI Cursor vers `AgentStreamEvent`.
    - Énumération des modèles supportés via `listModels()` avec mémorisation en cache Node.js.
  * **Cas limites :**
    - `CURSOR_CLI_BIN` non défini : blocage au lancement de la commande avec message d'erreur clair.
    - Échec de `--list-models` ou absence de binaire : retour silencieux d'un tableau vide `[]` sans bloquer le serveur.
  * **Critères d'acceptation :** `AC-ADPT-02-1` (résolution `CURSOR_CLI_BIN`), `AC-ADPT-02-2` (commande `-p --resume`), `AC-ADPT-02-3` (parsing stream cursor-cli), `AC-ADPT-02-4` (`createSession` via `create-chat`), `AC-ADPT-02-5` (drapeau `--model` et énumération `listModels` avec cache Node.js).

* **`SPEC-ADPT-03` — Cycle de vie du processus, Stop manuel et sessions de scénario**
  * **Exigences :** `REQ-020`, `REQ-022`, `REQ-023`, `REQ-025`, `R-23`, `R-24`, `R-32`, `R-33`, `R-34`, `R-39`
  * **Règle :**
    - **Session de scénario :** table en mémoire `agentId → sessionId` propre à une exécution ; session créée au premier Run de l'agent, réutilisée ensuite, jamais persistée, abandonnée en fin d'exécution.
    - **ClearContext :** oublie la session de l'agent ; le Run suivant en recrée une. Aucune commande CLI.
    - **Stop manuel (kill) :** tue le processus enfant du CLI (`SIGTERM`/`SIGKILL`) sans créer ni supprimer de session.
    - Aucun reset manuel (ni bouton UI, ni route HTTP).
  * **Scénarios nominaux :**
    - Deux Runs du même agent : 1 seul `createSession`, même `sessionId`.
    - Run → ClearContext → Run : 2 `createSession`, `sessionId` différents.
    - Deux exécutions successives : sessions différentes.
  * **Cas limites :**
    - Stop déclenché pendant qu'un bloc est en pause : pris en compte immédiatement, libère le scénario.
    - Premier Run parallèle du même agent : création de session partagée (1 seul `createSession`).
  * **Critères d'acceptation :** `AC-ADPT-03-1` (Stop sans effet sur les sessions), `AC-ADPT-03-2` (ClearContext → nouvelle session au Run suivant), `AC-ADPT-03-3` (sessions propres à l'exécution, non persistées).

* **`SPEC-ADPT-04` — Spécialisation opérationnelle Antigravity CLI**
  * **Exigences :** `REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-28`, `R-38`, `C-12`
  * **Règle :** L'adapter `antigravity` (`cliId = 'antigravity'`) est un adapter opérationnel embarqué dans ClientsBox. Le binaire est résolu exclusivement via `process.env.ANTIGRAVITY_CLI_BIN`. `buildCommand` produit `--print <assembledPrompt>` avec insertion conditionnelle de `--model <id>` et `--conversation <sessionId>`. `listModels` interroge `agy models` (format tabulaire `<id>\t<label>`), mémorise les modèles en cache Node.js avec TTL et bascule sur un tableau vide `[]` sans imposer de catalogue statique de secours. `parseStreamLine` normalise sans exception les sorties JSON (notamment `text_delta` et `response`) et le texte brut vers `AgentStreamEvent`.
  * **Scénarios nominaux :**
    - `ANTIGRAVITY_CLI_BIN` présent : génération de la commande non interactive avec prompt, modèle optionnel et conversation optionnelle dans `workspacePath`.
    - Normalisation résiliente des flux stream NDJSON et texte brut sans lever d'exception.
    - Énumération des modèles supportés via `listModels()` avec mémorisation en cache Node.js.
  * **Cas limites :**
    - `ANTIGRAVITY_CLI_BIN` non défini ou invalide : échec immédiat avec diagnostic explicite en français.
    - Échec d'exécution de `agy models` ou absence de binaire : retour silencieux d'un tableau vide `[]` sans lever d'exception.
  * **Critères d'acceptation :** `AC-ADPT-04-1` (conformité `cliId = 'antigravity'`), `AC-ADPT-04-2` (résolution `ANTIGRAVITY_CLI_BIN`), `AC-ADPT-04-3` (génération commande `--print`), `AC-ADPT-04-4` (parsing stream), `AC-ADPT-04-5` (énumération `listModels` avec cache Node.js et repli sur `[]`).
  * **Critères d'acceptation :** `AC-ADPT-04-1` (conformité interface `CLIAdapter` et `cliId`), `AC-ADPT-04-2` (résolution `ANTIGRAVITY_CLI_BIN`), `AC-ADPT-04-3` (commande `--print` avec `--model` et `--conversation`), `AC-ADPT-04-4` (décodage flux `text_delta` et texte brut), `AC-ADPT-04-5` (énumération des modèles et fallback résilient).

* **`SPEC-ADPT-05` — Spécialisation opérationnelle Codex CLI**
  * **Exigences :** `REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-28`, `R-38`, `C-12`
  * **Règle :** L'adapter `codex-cli` (`cliId = 'codex-cli'`) est un adapter opérationnel embarqué dans ClientsBox. Le binaire est résolu exclusivement via `process.env.CODEX_CLI_BIN`. `buildCommand` produit `exec` (sans session) ou `exec resume` (avec session) avec les drapeaux `--json` et `--dangerously-bypass-approvals-and-sandbox`, et injection conditionnelle de `--model <id>`. `createSession` ouvre une session native par amorce stream-json (`probeCodexSession`), capture le `thread_id` dès la première ligne (`thread.started`) et attend la terminaison propre du processus. `listModels` interroge `codex debug models`, extrait les slugs JSON, mémorise en cache Node.js avec TTL et bascule sur un tableau vide `[]` en cas d'erreur. `parseStreamLine` décode sans exception les flux JSONL (`item.completed` avec `agent_message`) et le texte brut vers `AgentStreamEvent`.
  * **Scénarios nominaux :**
    - `CODEX_CLI_BIN` présent : génération de la commande non interactive initiale ou de reprise avec prompt et modèle optionnel.
    - Amorce de session stream-json capturant `thread_id` et réutilisation de session dans les scénarios multi-runs.
    - Énumération des modèles supportés via `listModels()` avec mémorisation en cache Node.js.
  * **Cas limites :**
    - `CODEX_CLI_BIN` non défini ou invalide : échec immédiat avec diagnostic explicite en français.
    - Échec d'exécution de `codex debug models` ou absence de binaire : retour silencieux d'un tableau vide `[]`.
  * **Critères d'acceptation :** `AC-ADPT-05-1` (conformité interface `CLIAdapter` et `cliId = 'codex-cli'`), `AC-ADPT-05-2` (résolution `CODEX_CLI_BIN`), `AC-ADPT-05-3` (commande `exec` / `exec resume` avec `--model`), `AC-ADPT-05-4` (décodage flux JSONL `item.completed` et texte brut), `AC-ADPT-05-5` (énumération des modèles et fallback résilient), `AC-ADPT-05-6` (amorce de session `createSession` et capture `thread_id`).

* **`SPEC-ADPT-06` — Spécialisation opérationnelle Claude CLI**
  * **Exigences :** `REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-18`, `R-28`, `R-38`, `R-40`, `C-12`
  * **Règle :** L'adapter `claude-cli` (`cliId = 'claude-cli'`) est un adapter opérationnel embarqué dans ClientsBox. Le binaire est résolu exclusivement via `process.env.CLAUDE_CLI_BIN` (validé comme 4ᵉ binaire obligatoire au boot). `buildCommand` génère la commande non interactive headless avec `--print`, `--output-format stream-json`, `--verbose`, `--include-partial-messages`, `--dangerously-skip-permissions`, `--model <id>` optionnel, et `--resume <sessionId>` conditionnel à la présence de la session (exclusion mutuelle stricte sans `--session-id` sur la CLI). `extractSessionId` intercepte paresseusement (*lazy capture*) l'identifiant de session dès la 1ʳᵉ ligne JSONL d'initialisation (`system` / `init`) au premier Run sans prompt d'amorce préalable. `listModels` énumère les modèles officiels Claude supportés avec mémoisation en cache LRU et repli sur `[]`. `parseStreamLine` décode sans exception les flux JSONL (`content_block_delta` et `assistant`) et le texte brut. `parseOutput` extrait le texte net consolidé pour le SAC et les blocs avals.
  * **Scénarios nominaux :**
    - `CLAUDE_CLI_BIN` présent : génération de la commande initiale (sans session) ou de reprise avec prompt et modèle optionnel.
    - Capture paresseuse de session conversationnelle au 1er Run et réutilisation inter-runs en scénario.
    - Découverte des modèles supportés via `listModels()` avec cache LRU.
    - Épuration stricte de la sortie textuelle dans `parseOutput`.
  * **Cas limites :**
    - `CLAUDE_CLI_BIN` non défini ou invalide : arrêt fatal au démarrage avec diagnostic explicite en français renvoyant vers `env/.env.example`.
    - Ligne tronquée ou JSON corrompu : fallback silencieux sans exception dans `parseStreamLine`.
  * **Critères d'acceptation :** `AC-ADPT-06-1` (conformité `CLIAdapter` et `cliId = 'claude-cli'`), `AC-ADPT-06-2` (résolution `CLAUDE_CLI_BIN`), `AC-ADPT-06-3` (commande headless `--print`, `stream-json`, `--verbose`, `--include-partial-messages`, `--dangerously-skip-permissions`, exclusion mutuelle `--resume`), `AC-ADPT-06-4` (décodage flux streaming), `AC-ADPT-06-5` (énumération des modèles et cache LRU), `AC-ADPT-06-6` (épuration textuelle `parseOutput`), `AC-ADPT-06-7` (capture paresseuse de session et reprise).

---

### 3.4 Domaine `ENG` — Moteur de Blocs, Join & Ordonnancement
*Fichier cible :* `tdd/specs/ENG.md` | *ADR rattaché :* `ADR-004`, `ADR-018`

* **`SPEC-ENG-01` — Messages inter-blocs et sac d'entrées**
  * **Exigences :** `REQ-033`, `REQ-034`, `R-10`, `R-11`, `R-44`, `Contrainte 10`, `Annexe B.2`, `D.2`
  * **Règle :** Un message de sortie émis par un port est un `BlockMessage` : `{ blockType: string, value: unknown, power: number }`. Les sorties n'ont pas de clé. Sur chaque port d'entrée câblé, le message reçu est stocké dans le sac d'entrées associé à sa clé : `BlockInputBag = Record<key, BlockMessage>`.
  * **Scénarios nominaux :**
    - Émission d'un Run émettant `{ blockType: 'run', value: 'résultat', power: 1 }`.
    - Réception sur deux entrées avec clés `inputA` et `inputB` formant le sac `{ inputA: msg1, inputB: msg2 }`.
  * **Cas limites :**
    - Entrée non connectée : n'apparaît pas dans le sac.
  * **Critères d'acceptation :** `AC-ENG-01-1` (structure `BlockMessage` sans key), `AC-ENG-01-2` (composition `BlockInputBag` avec keys).

* **`SPEC-ENG-02` — Algorithme de Join, calcul de Power, Pause et règle N=0**
  * **Exigences :** `REQ-017`, `REQ-037`, `R-42`, `R-42b`, `R-42c`, `R-42d`, `Contrainte 15`, `Annexe B.3`
  * **Règle :**
    - Pour tout bloc ayant $N$ entrées câblées :
      1. Si $N = 0$ (hors Start) : le bloc ne démarre jamais et n'émet aucun message/power en sortie (`R-42d`).
      2. Si $N \ge 1$ : le moteur attend la réception d'un message sur chacune des $N$ entrées câblées (y compris power 0).
      3. Dès les $N$ messages reçus : si $\sum power === N$, le bloc est déclenché.
      4. Si $\sum power < N$, le bloc bascule en **pause** en attendant une mise à jour ultérieure d'un message d'entrée.
    - Start est la seule exception : 0 entrée, départ immédiat.
  * **Scénarios nominaux :**
    - Join 2 entrées avec power 1 et power 1 : somme = 2 = N -> exécution immédiate.
    - Join 2 entrées avec power 1 et power 0 : somme = 1 < 2 -> état pause.
  * **Cas limites :**
    - Bloc Run ou ClearContext orphelin (0 entrée) : reste inactif, aucune émission.
    - Déblocage d'une pause suite à une nouvelle émission d'un bloc If en amont : réévaluation immédiate du join.
  * **Critères d'acceptation :** `AC-ENG-02-1` (règle join $N \ge 1$ et $\sum power === N$), `AC-ENG-02-2` (mise en pause si sum < N), `AC-ENG-02-3` (règle $N=0$ stricte).

* **`SPEC-ENG-03` — Comportement des 6 types de blocs spécialisés**
  * **Exigences :** `REQ-015`, `REQ-016`, `REQ-018`, `REQ-019`, `REQ-020`, `REQ-038`, `REQ-039…043`, `R-08`, `R-09`, `R-10b`, `R-12 à 15`, `R-19 à 22`, `R-39`, `R-46`, `R-47`, `Annexe B.4`
  * **Règle :**
    - **Start :** 0 entrée, paramètres statiques aucun, émet $N$ sorties en power 1 au lancement.
    - **Run :** paramètres statiques (agent, prompt, exit optionnel), ne lit pas le sac ; attend la fin naturelle du CLI et émet sur ses $0..N$ sorties `{ blockType: 'run', value: outputCLI, power: 1 }`. Si 0 sortie -> agit comme endpoint.
    - **If :** 1..N entrées, lit le sac, évalue `if(sac)`. Possède 2 familles de sorties : branche prise (0..N sorties émises en power 1), branche non prise (0..N sorties émises en power 0).
    - **ClearContext :** paramètre statique (agent), ne lit pas le sac. Oublie la session de scénario de l'agent (nouvelle session au Run suivant). Émet `{ blockType: 'clearContext', value: null, power: 1 }`.
    - **CallScenario :** paramètre `targetScenarioId`, ne lit pas le sac ; await sous-runner in-process (ADR-018) ; émet `{ blockType: 'callScenario', value: null, power: 1 }` ; échec enfant ⇒ R-25.
    - **Command :** paramètre `commandLine`, ne lit pas le sac ; spawn shell OS (`cwd` = workspace) ; exit 0 ⇒ `{ blockType: 'command', value: null, power: 1 }` ; exit ≠ 0 ⇒ R-25.
  * **Scénarios nominaux :**
    - Exécution d'un If retournant `true` : émission de power 1 sur la branche vraie, et power 0 sur la branche fausse.
    - CallScenario nominal : await enfant puis power 1 / value null.
    - Command nominal : await process exit 0 puis power 1 / value null.
  * **Cas limites :**
    - Run sans sortie (endpoint) : termine sa branche sans propager de message.
    - Enfant en erreur / dépassement de `CALL_SCENARIO_MAX_DEPTH` (si ≥ 0) : échec bloc + halt racine ; auto-appel autorisé.
    - Command exit ≠ 0 ou `commandLine` vide : échec bloc + halt racine.
  * **Critères d'acceptation :** `AC-ENG-03-1` (Start fan-out), `AC-ENG-03-2` (Run exécution/endpoint), `AC-ENG-03-3` (If double famille power 1/0), `AC-ENG-03-4` (ClearContext), `AC-ENG-03-5` (CallScenario), `AC-ENG-03-6` (relay chunks nested → terminal racine), `AC-ENG-03-7` (Command).

* **`SPEC-ENG-04` — Assemblage du prompt, politiques de profil et arrêt global sur erreur**
  * **Exigences :** `REQ-022`, `REQ-023`, `REQ-026`, `REQ-032`, `R-06`, `R-25`, `R-45`, `D.3`
  * **Règle :**
    - Le moteur assemble le prompt (`assembledPrompt` : `systemPrompt` selon politique + `prompt.content` + `exit.content` si `exitId` défini) **avant** d'appeler l'adapter, selon les politiques de profil configurées :
      * `chaque_prompt` : injecte systématiquement le prompt système du profil.
      * `debut_scenario` : injecte le profil uniquement au premier appel de l'agent dans le scénario.
      * `une_fois_jusqu_a_clear` : injecte le profil une seule fois tant qu'aucun clear n'est intervenu.
    - Lors de `prepareRunContext`, le modèle d'IA cible configuré sur le profil (`res.profile?.model`) est transmis dans `ExecutionContext`.
    - Si l'exécution d'un bloc échoue (exit code en erreur, exception runtime, timeout) : **arrêt global immédiat du scénario**, annulation des branches en cours et statut d'erreur global.
  * **Scénarios nominaux :**
    - Assemblage conforme du prompt système + prompt utilisateur et propagation du modèle.
    - Arrêt d'urgence de tout le graphe dès qu'un bloc Run échoue.
  * **Cas limites :**
    - Erreur survenant sur une branche pendant qu'une autre est en cours d'exécution : interruption de tous les process actifs.
  * **Critères d'acceptation :** `AC-ENG-04-1` (assemblage prompt R-45 et modèle), `AC-ENG-04-2` (politiques profil 3 modes), `AC-ENG-04-3` (arrêt global sur erreur R-25).

---

### 3.5 Domaine `UI` — Interface Utilisateur, Canvas & Terminal Live
*Fichier cible :* `tdd/specs/UI.md` | *ADR rattaché :* CDC §6, [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md), [`ADR-012`](../docs/adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../docs/adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../docs/adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md), [`ADR-017`](../docs/adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md)

* **`SPEC-UI-01` — IHM en français, navigation et formulaires de gestion CRUD**
  * **Exigences :** `REQ-007`, `REQ-008`, `REQ-009 à 012`, `R-04`, `R-07`, `R-36`
  * **Règle :** L'interface utilisateur est entièrement rédigée en français. Elle offre des formulaires pour créer, éditer et supprimer les agents, profils, prompts, conditions exit et scénarios. Le sélecteur de CLI dans la configuration d'un agent n'affiche que les adapters opérationnels (filtrage strict sur `cursor-cli` en v1). Elle intègre un composant générique d'autocomplétion libre (`<AutocompleteInput />`) pour pré-remplir les champs via une recherche modulaire locale/distante tout en autorisant la saisie libre, y compris pour le choix du modèle d'IA sur les profils.
  * **Scénarios nominaux :**
    - Navigation fluide entre les onglets Scénarios, Agents, Profils, Prompts.
    - Création d'un agent avec sélection de son profil et de l'adapter `cursor-cli`.
    - Autocomplétion et pré-remplissage avec maintien de la saisie libre.
    - Saisie assistée du modèle d'IA dans le formulaire profil et affichage dans la table des profils.
  * **Cas limites :**
    - Saisie d'un identifiant déjà existant : affichage d'un message d'erreur explicite en français.
    - Fermeture du menu d'autocomplétion sur Échap ou clic externe sans altérer la valeur.
  * **Critères d'acceptation :** `AC-UI-01-1` (interface 100% en français), `AC-UI-01-2` (formulaires CRUD complets), `AC-UI-01-3` (menu CLI restreint aux adapters opérationnels), `AC-UI-01-4` (restitution visuelle E2E des ressources IHM), `AC-UI-01-5` (composant générique d'autocomplétion libre), `AC-UI-01-6` (sélection assistée de modèle d'IA sur profil).

* **`SPEC-UI-02` — Canvas d'orchestration visuel (style N8N)**
  * **Exigences :** `REQ-014`, `REQ-015`, `REQ-030`, `REQ-035`, `REQ-039`, `REQ-041`, `REQ-042`, `REQ-043`, `REQ-045`, `R-08 à 15`, `R-43`, `R-46`, `R-47`, `R-49`
  * **Règle :** Le canvas permet de glisser-déposer les **6** types de blocs (CallScenario + dropdown `targetScenarioId` ; Command + champ `commandLine`), de les relier par des câbles (entrées/sorties), d'afficher et d'éditer les clés d'entrée (`keys`).
    - **Navigation spatiale Pan & Zoom :** déplacement de caméra par clic-glissé sur le fond vide (`cursor: grab` / `grabbing`) sans altérer les coordonnées persistées des nœuds ; zoom continu centré sur le curseur à la molette (0.25x à 2.0x, défaut 100%) ; projection `clientToCanvas` isomorphe assurant la précision absolue du câblage et du drag de blocs sous tout zoom/pan (`REQ-045`, `R-49`).
    - L'unicité du bloc Start est garantie (interdiction d'en insérer un second).
    - Les deux familles de sorties du bloc If (branche vraie / branche fausse) sont visuellement distinctes (codes couleurs ou libellés clairs).
    - Un câble se retire en deux clics : 1er clic affiche « Supprimer », 2e clic sur l'option retire la connexion ; un clic ailleurs annule.
    - Un bloc sélectionné se supprime via le bouton « Supprimer ce bloc » de l'inspecteur ou la touche Suppr/Backspace, retirant en cascade ses liaisons et fermant l'inspecteur.
    - Lors de l'exécution, l'état de chaque nœud est affiché en direct (inactif, en cours, pause, terminé, erreur) — volatile, hors document persisté (`SPEC-DATA-03` / `DOM-018`).
    - Enregistrer / charger un scénario applique le strip des clés `SCENARIO_NODE_NO_SAVE_KEYS`.
    - Pendant un run actif (`isRunning` / `launchLocked` / snapshot `busy`), édition du graphe et Enregistrer sont verrouillés côté front ; Stop reste disponible ; Pan et Zoom restent libres pour inspecter le graphe.
  * **Scénarios nominaux :**
    - Composition d'un scénario Start -> Run -> If -> ClearContext.
    - Déplacement de caméra (Pan) sur fond vide sans altération de position des nœuds.
    - Zoom molette centré au curseur borné entre 25% et 200%.
    - Câblage et drag de nœuds précis au pixel près sous zoom 150%.
    - Visualisation de l'état "en pause" sur un bloc en attente de join.
    - Suppression d'un câble via sélection puis option « Supprimer ».
    - Suppression d'un bloc sélectionné et retrait en cascade de ses câbles.
    - Enregistrer un graphe dont un nœud a `status` runtime : le payload exclut les clés no-save.
    - Tentative d'édition / Enregistrer pendant un run : contrôles désactivés.
  * **Cas limites :**
    - Tentative de boucle non autorisée ou de liaison circulaire non prise en charge : signalement visuel.
    - Saisie dans un champ texte préservée lors de la frappe Suppr / Backspace (pas de suppression accidentelle de bloc).
    - Clic sur nœud ou port lors d'un drag : Pan inhibé au profit de l'interaction nœud/port.
    - Fin de run ou `busy=false` : levée du verrou.
  * **Critères d'acceptation :** `AC-UI-02-1` … `AC-UI-02-10`, `AC-UI-02-11` (CallScenario), `AC-UI-02-12` (Command), `AC-UI-02-13` (Pan fond vide grab/grabbing), `AC-UI-02-14` (Zoom molette centré 0.25x-2.0x), `AC-UI-02-15` (isomorphisme câblage et drag sous zoom).

* **`SPEC-UI-03` — Terminal live non persisté et contrôles d'exécution**
  * **Exigences :** `REQ-024`, `REQ-025`, `REQ-040`, `R-26`, `R-34`
  * **Règle :** Terminal live volatil ; Stop en run/pause ; Stop racine halt aussi CallScenario ; pas de recovery / pastilles de l'état interne enfant (`REQ-040`).
  * **Scénarios nominaux :**
    - Streaming fluide du terminal lors du déroulement d'une commande Cursor.
    - Clic sur "Stop" : arrêt immédiat, passage du scénario à l'état stoppé.
  * **Cas limites :**
    - Déconnexion ou rafraîchissement de la page web : le flux live reprend ou affiche l'état courant sans bloquer le moteur serveur.
    - Canvas enfant pendant CallScenario : idle / foreign run.
  * **Critères d'acceptation :** `AC-UI-03-1` (terminal streaming live), `AC-UI-03-2` (Stop fonctionnel en run et pause), `AC-UI-03-3` (pas de reset manuel contexte), `AC-UI-03-4` (non-recovery enfant), `AC-UI-03-5` (chunks CLI nested dans terminal racine).

* **`SPEC-UI-04` — Page Instructions et export local de la documentation**
  * **Exigences :** `REQ-004`, `REQ-007`, `C-06`, `ADR-012`, `ADR-013`, `ADR-017`
  * **Règle :** Page Instructions en français, accessible depuis la barre de navigation (`#/instructions`) ; bouton **« Enregistrer dans le dossier local »** déclenchant l'export vers `.agents/docs/` avec feedback succès/échec.
  * **Scénarios nominaux :**
    - Navigation vers la vue Instructions + lecture des sections.
    - Clic export → message de succès avec chemin cible.
  * **Cas limites :**
    - Échec HTTP/I/O : message d'erreur en français.
  * **Critères d'acceptation :** `AC-UI-04-1` (navigation in-place), `AC-UI-04-2` (affichage sections), `AC-UI-04-3` (export + feedback).

---

### 3.6 Domaine `ARCH` — Architecture Technique, DAG & Intégrité Modulaire
*Fichier cible :* `tdd/specs/ARCH.md` | *ADR rattachés :* `ADR-001` à `ADR-015`, `ADR-017` | *Signatures :* `signature.md` et associées

* **`SPEC-ARCH-01` — Graphe acyclique de dépendances (DAG), étanchéité des couches logicielles et Micro-DAG Front**
  * **Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`
  * **Règle :** L'architecture sous `src/` est strictement un DAG unilatéral à 8 couches : `types` [1] → `utils` [2] → (`domain` [3] ∥ `lib` [4]) → `services` [5] → `controllers` [6] ; `ui` [7] importe `types`/`utils`/`domain` uniquement (feuille navigateur, jamais importée par `controllers`) ; `index.ts` [8] est l'unique Composition Root qui importe toutes les couches. Zéro dépendance circulaire. La couche `types/` est déclarative pure (zéro runtime). `controllers/` n'accèdent jamais directement à `domain/` ni à `lib/`. La couche `ui/` n'accède à aucune API Node.js ni aux couches serveur (`lib/`, `services/`) et respecte un Micro-DAG Front en 5 niveaux par dossier ($\text{api} \parallel \text{i18n} \parallel \text{types} \prec \text{hooks} \prec \text{components} \prec \text{pages} \prec \text{app.tsx}$).
  * **Critères d'acceptation :** `AC-ARCH-01-1` (acyclicité DAG intégrale), `AC-ARCH-01-2` (pureté types/ : allow-list `interface`|`type`|`const enum`|types structuraux ; zéro runtime ; imports bornés), `AC-ARCH-01-3` (étanchéité controllers/ ↛ domain/ et lib/), `AC-ARCH-01-4` (étanchéité ui/ ↛ lib/, services/ et Node.js), `AC-ARCH-01-5` (conformité allow-list imports `signature.md` §5), `AC-ARCH-01-6` (étanchéité stricte du Micro-DAG Front en 5 niveaux par dossier sans rétro-imports ni JSX dans les hooks).

* **`SPEC-ARCH-02` — Pureté, zéro-I/O et isomorphisme de la couche Domaine (`domain/`)**
  * **Exigences :** `REQ-014` à `REQ-020`, `REQ-026`, `REQ-033` à `REQ-038`, `R-06` à `R-17`, `R-20`, `R-42` à `R-45`, `C-09`, `C-10`, `C-14`, `C-15`, `ADR-004`, `ADR-005`, signatures `DOM-001..019`
  * **Règle :** Les modules de `src/domain/` (`DOM-001..008`, `DOM-010..020`) forment le cœur logique pur de ClientsBox. Ils sont 100 % isomorphes (exécutables dans Node.js et navigateur) et exempts d'I/O (aucun import système). Évaluation join, orphan guard, prompt assembly (incluant `exit` optionnel), policy state machine, gestion de clés (assignation, renumérotation, collision) et validation structurelle du graphe sont déterministes, synchrones et sans effet de bord.
  * **Critères d'acceptation :** `AC-ARCH-02-1` (zéro module système/I/O/`process.env|cwd`/`fetch`/`WebSocket` dans domain/), `AC-ARCH-02-2` (pureté et déterminisme des fonctions de calcul et validation), `AC-ARCH-02-3` (isomorphisme garanti Node.js et navigateur sans polyfills), `AC-ARCH-02-4` (validation topologique Start unique et degré entrant 0 sans accès disque).

* **`SPEC-ARCH-03` — Isolation des effets de bord et connecteurs techniques aveugles (`lib/`)**
  * **Exigences :** `REQ-001` à `REQ-006`, `REQ-008`, `REQ-013`, `REQ-021` à `REQ-023`, `REQ-025`, `REQ-027` à `REQ-032`, `REQ-101` à `REQ-104`, `REQ-112`, `R-04`, `R-18`, `R-23` à `R-24`, `R-27` à `R-35`, `R-36` à `R-40`, `C-01` à `C-05`, `C-07`, `C-08`, `C-11` à `C-13`, `ADR-001` à `ADR-003`, `ADR-005`, `ADR-006`, signatures `LIB-001..022`
  * **Règle :** La couche `src/lib/` monopolise toutes les I/O système (`fs`|`node:fs`, `child_process`|`node:child_process`, `os`|`node:os`, `path`|`node:path`, `net`|`node:net`, `http`|`node:http`, `url`|`node:url`, `vm`|`node:vm`, `module`|`node:module`, `process`|`node:process`, et accès `process.env` / `process.cwd()` via `LIB-005`). Elle est aveugle au domaine métier. Persistance atomique anti-corruption JSON (`LIB-001`), lectures fraîches sans cache (`LIB-002`), suppression physique idempotente (`LIB-011`), spawner de processus avec escalade `SIGTERM` → `SIGKILL` à `STOP_GRACE_MS = 3000 ms` (`LIB-004`), micro-serveur HTTP local lié à `127.0.0.1` (`LIB-010`).
  * **Critères d'acceptation :** `AC-ARCH-03-1` (monopole des imports I/O `node:X`|`X` incl. `process` dans lib/ ; index.ts sans ces imports, process.on signaux OK ; CLI/stdout-stderr via ROOT-001), `AC-ARCH-03-2` (cécité métier : lib/ n'importe aucun élément de domain/), `AC-ARCH-03-3` (persistance atomique .tmp + renameSync anti-corruption), `AC-ARCH-03-4` (isolation du spawner et escalade SIGTERM/SIGKILL 3000 ms), `AC-ARCH-03-5` (monopole process.env/cwd via LIB-005).

* **`SPEC-ARCH-04` — Découplage par interfaces, Composition Root et conformité des erreurs**
  * **Exigences :** `REQ-001`, `REQ-003`, `REQ-005`, `REQ-007`, `REQ-021`, `REQ-025`, `R-03` à `R-05`, `R-28`, `R-30`, `R-35`, `C-06`, `C-11`, `ADR-001`, `ADR-002`, `ADR-006`, signatures `ROOT-001`, `TYPES-001`, `TYPES-011`, `TYPES-012`, `SVC-001..013`, `CTL-001..007`
  * **Règle :** Découplage strict des contrôleurs via l'interface `HttpRouter` (`TYPES-011`). Découplage des adaptateurs via `CLIAdapter` (`TYPES-001`). `src/index.ts` est l'unique Composition Root instanciant les composants, câblant le holder des runners, gérant l'immuable `workspacePath` et arrêtant le serveur et les runners sur `SIGINT`/`SIGTERM`. Tous les messages d'erreur exposés à l'utilisateur sont en français (`REQ-007`, `C-06`). Les tests respectent les exigences de déterminisme d'ADR-006.
  * **Critères d'acceptation :** `AC-ARCH-04-1` (contrôleurs enregistrés contre l'interface HttpRouter pure), `AC-ARCH-04-2` (Composition Root unique index.ts et gestion signaux OS), `AC-ARCH-04-3` (100% des messages d'erreur HTTP contrôleurs+routeur LIB-007, applicatifs et opérateur ROOT-001 en français), `AC-ARCH-04-4` (déterminisme du harnais de test ADR-006).

* **`SPEC-ARCH-05` — Volumétrie de code, compacité et exemptions TSDoc**
  * **Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`
  * **Règle :** Prédicats déterministes :
    - Fichiers standards (`.ts` hors TSX) : ≤ 150 PASS / 151–200+premier bloc TSDoc démarrant en L1 contenant `@fileExemption` / > 200 FAIL (sauf `ROOT-001`+même locus).
    - Fichiers Preact TSX (`*.tsx`) : ≤ 250 PASS / 251–300+premier bloc TSDoc démarrant en L1 contenant `@fileExemption` / > 300 FAIL.
    - Fonctions et méthodes standards (`.ts` hors TSX) : ≤ 35 PASS / 36–40+`@functionExemption` dans le TSDoc immédiatement précédent / > 40 FAIL.
    - Fonctions et composants Preact TSX (`*.tsx`) : ≤ 200 PASS / 201–250+`@functionExemption` dans le TSDoc immédiatement précédent / > 250 FAIL.
    - Prédicats physiques identiques : commentaires non-TSDoc inclus ; séquence de blancs consécutifs = 0 ; blanc isolé = 1 ; corps BlockStatement = span entre accolades hors lignes `{`/`}` seules ; Expression fléchée = lignes du nœud Expression. Arité ≤ 3 paramètres positionnels (au-delà, objet d'options typé, y compris exports des signatures).
  * **Critères d'acceptation :** `AC-ARCH-05-1` (prédicat fichier standard ≤ 150/200, TSX ≤ 250/300 + TSDoc en-tête L1 `@fileExemption` ; > 200/300 FAIL), `AC-ARCH-05-2` (prédicat fonction standard ≤ 35/40, TSX ≤ 200/250 + `@functionExemption` TSDoc précédent ; > 40/250 FAIL), `AC-ARCH-05-3` (arité ≤ 3 ou objet d'options, y compris exports signés).

* **`SPEC-ARCH-06` — Inférence automatique de typage, pureté des retours et bannissement de any**
  * **Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`
  * **Règle :** Inférence automatique native stricte des types de retour de fonction (interdiction d'annoter le type de retour, sauf exception documentée via `@returnTypeExemption`). Bannissement absolu du mot-clé `any` (`no-explicit-any`) au profit d'`unknown` avec rétrécissement de type (*type guard*). Immutabilité des arguments d'entrée (zéro mutation *in-place*).
  * **Critères d'acceptation :** `AC-ARCH-06-1` (inférence automatique des retours sans typage explicite), `AC-ARCH-06-2` (exemption documentée obligatoire via `@returnTypeExemption`), `AC-ARCH-06-3` (bannissement strict de `any` au profit d'`unknown`), `AC-ARCH-06-4` (immutabilité des arguments d'entrée).

* **`SPEC-ARCH-07` — Complexité algorithmique, conventions de nommage et documentation**
  * **Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`
  * **Règle :** Complexité cyclomatique CC ≤ 10 par fonction selon la formule scellée de `SPEC-ARCH-07` (ou `@complexityExemption <motif>` dans le TSDoc immédiatement précédent). Profondeur d'imbrication ≤ 3 niveaux selon l'allow-list AST de `SPEC-ARCH-07` (non exemptable ; *early returns* recommandés). Conventions de nommage des fichiers (`kebab-case.suffixe.ts` ou `.tsx`) et des identifiants (`camelCase`, `PascalCase`, `UPPER_SNAKE_CASE`, préfixes booléens `is*`/`has*`/`should*`/`can*`). Documentation TSDoc obligatoire sur tous les exports publics selon prédicat par kind AST (cf. `SPEC-ARCH-07`) et zéro effet de bord à l'importation.
  * **Critères d'acceptation :** `AC-ARCH-07-1` (CC ≤ 10 selon formule scellée ou `@complexityExemption` ; imbrication ≤ 3 sans exemption), `AC-ARCH-07-2` (conventions de nommage des fichiers et symboles), `AC-ARCH-07-3` (TSDoc par kind AST sur exports publics et zéro effet de bord à l'import).

* **`SPEC-ARCH-08` — Conformité d'inventaire avec les signatures officielles et gestion des transitions (*.added, *.del)**
  * **Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`
  * **Règle :** Les 172 modules canoniques des signatures (`tdd/docs/signature/*.md`, 113 backend + 59 front en extensions `.(ts|tsx)`) constituent l'unique Source de Vérité. Tout fichier officiel doit exister dans `src/` et aucun fichier non répertorié ne peut subsister sans flag. Tout fichier portant l'extension `*.generated.ts` (notamment `src/lib/http/embedded-assets.generated.ts`) ou la feuille de style `src/ui/styles/app.css` est un artefact de compilation ou ressource CSS exclu de l'inventaire des 172 modules TypeScript/TSX signés et exempté des audits de code statique. Les suppressions imminentes portent le flag `*.del.{ext}` (statut `PASS` + `WARNING`). Les ajouts préliminaires portent le flag `*.added.{ext}` (statut `PASS` + `WARNING`). Tout fichier manquant ou intrus non flaggé provoque l'échec bloquant (`FAIL`).
  * **Critères d'acceptation :** `AC-ARCH-08-1` (fichiers signés existent sous nommage canonique **ou** `*.del.{ext}` — WARNING via AC-ARCH-08-3, sans FAIL), `AC-ARCH-08-2` (échec bloquant sur fichier non répertorié et non flaggé), `AC-ARCH-08-3` (tolérance des fichiers *.added.* et *.del.* avec émission d'avertissement).

* **`SPEC-ARCH-09` — Génération du rapport d'audit et de conformité d'architecture (dossier out/)**
  * **Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`
  * **Règle :** Génération automatique d'un rapport complet d'audit dans `out/` (`out/rapport-arch.md` et `out/arch-report.json`) à l'issue des tests. Il consolide le résumé des tests, le bilan des signatures (fichiers conformes, `*.added.*`, `*.del.*`), l'étanchéité du DAG (incluant le Micro-DAG Front en 5 niveaux), le registre exhaustif de toutes les exemptions TSDoc (`@fileExemption`, `@functionExemption`, `@returnTypeExemption`, `@complexityExemption`) avec justifications, ainsi que les erreurs et métriques de qualité.
  * **Critères d'acceptation :** `AC-ARCH-09-1` (génération automatique de out/rapport-arch.md à la fin des tests), `AC-ARCH-09-2` (synthèse globale, erreurs bloquantes et avertissements), `AC-ARCH-09-3` (registre complet de l'ensemble des exemptions TSDoc avec justifications), `AC-ARCH-09-4` (génération concomitante de out/arch-report.json incluant la matrice d'étanchéité 8 couches et Micro-DAG Front), `AC-ARCH-09-5` (bilan d'étanchéité DAG / matrice 8 couches dans out/rapport-arch.md).

---

## 4. Matrice de Traçabilité Globale (Exigences CDC ↔ Spécifications)

### 4.1 Exigences fonctionnelles Must (REQ-001…REQ-043)

| Exigence / Règle CDC | Domaine & Spécification(s) couvrante(s) | Statut de couverture |
| :--- | :--- | :---: |
| **REQ-001, REQ-002, REQ-005, REQ-006, R-35** | `SPEC-SRV-01` | **Complet** |
| **REQ-003, REQ-004** | `SPEC-SRV-02` | **Complet** |
| **REQ-039, REQ-040, REQ-041, R-46** | `SPEC-ENG-03`, `SPEC-ENG-04`, `SPEC-UI-02`, `SPEC-UI-03`, `SPEC-SRV-02`, `SPEC-DATA-03`, `SPEC-ADPT-03`, ADR-018 | **Complet (CASEs CR-008 CallScenario)** — `CASE-ENG-03-7`, `CASE-ENG-04-11`, `CASE-DATA-03-7`, `CASE-ADPT-03-6`, `CASE-UI-02-18`, `CASE-UI-03-10`, `CASE-SRV-02-19` |
| **REQ-042, REQ-043, R-47** | `SPEC-ENG-03`, `SPEC-ENG-04`, `SPEC-UI-02`, `SPEC-UI-03`, `SPEC-DATA-03`, ADR-019 | **Complet (CASEs Command rédigés)** — `CASE-ENG-03-9`, `CASE-ENG-04-12`, `CASE-UI-02-19`, `CASE-DATA-03-8` |
| **REQ-044, R-48** | `SPEC-SRV-01`, ADR-020 | **Complet (CR-009 CLI Exec Scene)** — exécution directe console headless sans serveur HTTP |
| **REQ-045, R-49** | `SPEC-UI-02`, ADR-021 | **Complet (CR-010 Canvas Pan & Zoom)** — déplacement fond vide, zoom molette centré au curseur (0.25x-2.0x) |
| **REQ-007, REQ-008** | `SPEC-UI-01`, `SPEC-ARCH-04` (erreurs FR HTTP/applicatives) | **Complet** |
| **REQ-009, REQ-010, REQ-011, REQ-012, R-01, R-02, R-05, R-06** | `SPEC-DATA-01` | **Complet** |
| **REQ-013, REQ-008, REQ-029, REQ-031, REQ-112, R-04, R-38, R-40** | `SPEC-ADPT-02` | **Complet** |
| **REQ-014, REQ-034, REQ-035, REQ-036, R-16, R-17, R-43** | `SPEC-DATA-03` | **Complet** |
| **REQ-014, REQ-015, REQ-030, REQ-035, R-08 à 15, R-43** | `SPEC-UI-02` | **Complet** |
| **REQ-015, REQ-016, REQ-018, REQ-019, REQ-020, REQ-038, REQ-039…043, R-08, R-09, R-10b, R-12…15, R-19…22, R-39, R-46, R-47** | `SPEC-ENG-03` | **Complet** (CallScenario verts ; CASEs Command rédigés) |
| **REQ-017, REQ-037, R-42, R-42b, R-42c, R-42d** | `SPEC-ENG-02` | **Complet** |
| **REQ-020, REQ-025, R-23, R-24, R-34, R-39** | `SPEC-ADPT-03` | **Complet** (REQ-021 / R-30 retirées le 2026-11-03) |
| **REQ-024, REQ-025, R-26, R-34** | `SPEC-UI-03` | **Complet** |
| **REQ-022, REQ-023, REQ-026, REQ-032, R-06, R-25, R-45** | `SPEC-ENG-04` | **Complet** |
| **REQ-027, REQ-028, REQ-103, R-18, R-27, R-28, R-29** | `SPEC-ADPT-01` | **Complet** |
| **REQ-033, REQ-034, R-10, R-11, R-44** | `SPEC-ENG-01` | **Complet** |
| **REQ-104, R-14** | `SPEC-DATA-02` | **Complet** |

### 4.2 Règles métier (R-01…R-47)

| Règle CDC | Domaine & Spécification(s) couvrante(s) | Statut de couverture |
| :--- | :--- | :---: |
| **R-01, R-02, R-05, R-06** | `SPEC-DATA-01` | **Complet** |
| **R-03** | `SPEC-UI-01`, `SPEC-ADPT-02` | **Complet** — implicite menu CLI (agent → 1 CLI) |
| **R-04** | `SPEC-UI-01`, `SPEC-ADPT-02` | **Complet** |
| **R-07** | `SPEC-UI-01` | **Complet** |
| **R-08, R-09** | `SPEC-ENG-03`, `SPEC-UI-02` | **Complet** |
| **R-10, R-11** | `SPEC-ENG-01` | **Complet** |
| **R-10b** | `SPEC-ENG-02`, `SPEC-ENG-03` | **Complet** — sémantique power (1 / 0 If) |
| **R-12, R-13** | `SPEC-ENG-03`, `SPEC-DATA-03` | **Complet** |
| **R-14, R-15** | `SPEC-DATA-02`, `SPEC-ENG-03` | **Complet** |
| **R-16, R-17** | `SPEC-DATA-03` | **Complet** |
| **R-18** | `SPEC-ADPT-01` | **Complet** |
| **R-19, R-21, R-22** | `SPEC-ENG-03` | **Complet** |
| **R-20** | `SPEC-ENG-03`, `SPEC-ARCH-02` | **Complet** — comportement Start (ENG) + validation structurelle zéro-I/O `DOM-008` (ARCH) |
| **R-23, R-24** | `SPEC-ADPT-03` | **Complet** |
| **R-25** | `SPEC-ENG-04` | **Complet** |
| **R-26** | `SPEC-UI-03` | **Complet** |
| **R-27** | `SPEC-ADPT-01` | **Complet** — wrapper / adapter construit la commande |
| **R-28** | `SPEC-ADPT-02`, `SPEC-UI-01` | **Complet** — CLI listé ssi adapter opérationnel |
| **R-29** | `SPEC-ADPT-01` | **Complet** |
| **R-30** | — | **Retirée (2026-11-03)** — plus de reset manuel UI ; seul le bloc ClearContext efface la mémoire (`SPEC-ADPT-03`, `SPEC-UI-03`) |
| **R-31** | — | **Retirée (2026-11-03)** — remplacée par la session spécifique à l'exécution de scénario (`SPEC-ADPT-03`) |
| **R-32** | `SPEC-ADPT-03` | **Complet** — destruction externe CLI hors responsabilité ClientsBox |
| **R-33** | `SPEC-ADPT-03` | **Complet** — parallélisme même agent, pas de sérialisation, course = ressort CLI |
| **R-34** | `SPEC-ADPT-03`, `SPEC-UI-03` | **Complet** |
| **R-35** | `SPEC-SRV-01` | **Complet** |
| **R-36** | `SPEC-DATA-04`, `SPEC-UI-01` | **Complet** |
| **R-37** | `SPEC-DATA-04`, `SPEC-DATA-03`, `SPEC-UI-02`, `SPEC-UI-03` | **Complet** — logs exclus de `data/` ; champs nœud no-save (`status`, …) exclus du JSON scénario (`AC-DATA-03-6`, `AC-UI-02-8`) |
| **R-38** | `SPEC-ADPT-02` | **Complet** |
| **R-39** | `SPEC-ADPT-03`, `SPEC-ENG-03` | **Complet** |
| **R-40** | `SPEC-ADPT-02` | **Complet** |
| **R-41** | Méta-règle (schémas value, enums profil → specs) | **Complet** — traité dans les SPEC concernées |
| **R-42, R-42b, R-42c, R-42d** | `SPEC-ENG-02` | **Complet** |
| **R-43** | `SPEC-DATA-03`, `SPEC-UI-02` | **Complet** |
| **R-44** | `SPEC-ENG-01` | **Complet** |
| **R-45** | `SPEC-ENG-04` | **Complet** |
| **R-46** | `SPEC-ENG-03`, `SPEC-ENG-04`, `SPEC-UI-02`, `SPEC-SRV-02`, `SPEC-DATA-03`, ADR-018 | **Complet (CASEs CR-008 CallScenario)** |
| **R-47** | `SPEC-ENG-03`, `SPEC-ENG-04`, `SPEC-UI-02`, `SPEC-UI-03`, `SPEC-DATA-03`, ADR-019 | **Complet (CASEs Command rédigés)** |
| **R-48** | `SPEC-SRV-01`, ADR-020 | **Complet (CR-009)** — résolution id/name, streaming console Option B, codes de sortie 0/1/130 |
| **R-49** | `SPEC-UI-02`, ADR-021 | **Complet (CR-010)** — invariance des coordonnées `position` des nœuds lors du Pan & Zoom |

### 4.3 Contraintes (C-01…C-15)

| Contrainte CDC | Domaine & Spécification(s) couvrante(s) | Statut de couverture |
| :--- | :--- | :---: |
| **C-01** | `SPEC-SRV-01`, `SPEC-ADPT-01` | **Complet** — Runtime Node ≥ 24, application TypeScript |
| **C-02** | `SPEC-SRV-01` | **Complet** — Standalone ClientsBox, copie manuelle, JS précompilé |
| **C-03** | `SPEC-DATA-01`, `SPEC-DATA-04` | **Complet** — Usage typique sous `.agents/`, données sous `data/` |
| **C-04** | `SPEC-SRV-01` | **Complet** — Serveur local, port 2974 par défaut (`-p` / `--port`) |
| **C-05** | `SPEC-SRV-01` | **Complet** — Lien d'accès affiché dans le terminal OS au démarrage |
| **C-06** | `SPEC-UI-01`, `SPEC-ARCH-04` | **Complet** — UI en français ; messages d'erreur HTTP/applicatifs/opérateur ROOT-001 en français |
| **C-07** | `SPEC-SRV-01` | **Complet** — Workspace = `cwd` de la commande de démarrage |
| **C-08** | `SPEC-DATA-01` | **Complet** — Un fichier par ressource, formats homogènes par type |
| **C-09** | `SPEC-DATA-02` | **Complet** — Ressource If en JavaScript (`data/if/*.js`), autres configs en JSON |
| **C-10** | `SPEC-ENG-01`, `SPEC-ENG-03` | **Complet** — Sortie `blockMessage`, entrée sac `{ [key]: blockMessage }` |
| **C-11** | `SPEC-SRV-02` | **Complet** — Mono-utilisateur local, pas d'auth, pas de sandbox |
| **C-12** | `SPEC-ADPT-01`, `SPEC-ADPT-02` | **Complet** — Adapters embarqués, premier CLI = cursor-cli, `CURSOR_CLI_BIN` obligatoire |
| **C-13** | `SPEC-ADPT-01` | **Complet** — ClientsBox ne remplace pas les CLI tiers |
| **C-14** | `SPEC-ENG-01`, `SPEC-DATA-03` | **Complet** — Schémas `value` des payloads définis dans les specs |
| **C-15** | `SPEC-ENG-02` | **Complet** — Exécution ssi `N ≥ 1`, join complet et `sum(power) === N` |

### 4.4 Exigences non-fonctionnelles (REQ-101…REQ-112)

| NFR CDC | Domaine & Spécification(s) couvrante(s) | Statut de couverture |
| :--- | :--- | :---: |
| **REQ-101** | `SPEC-DATA-01`, `SPEC-ADPT-03` | **Complet** — Persistance fiable de `data/` et des contextes agent |
| **REQ-102** | `SPEC-SRV-01` | **Complet** — Démarrage simple + URL dans le terminal OS |
| **REQ-103** | `SPEC-ADPT-01` | **Complet** — Nouvel adapter = code embarqué, sans changer le modèle des blocs |
| **REQ-104** | `SPEC-DATA-01`, `SPEC-DATA-04` | **Complet** — Fichiers `data/` éditables à la main et versionnables |
| **REQ-105** | `SPEC-ENG-01`, `SPEC-ENG-03` | **Couvert implicitement** — Payloads inter-blocs stables pour scénario/données identiques |
| **REQ-106** | `SPEC-SRV-02` | **Couvert implicitement** — C-11 / Mono-utilisateur local, pas d'auth |
| **REQ-107** | `SPEC-UI-02` | **Couvert implicitement** — Édition canvas non triviale (Start + Run/If/ClearContext/CallScenario/Command) |
| **REQ-108** | `SPEC-SRV-01` | **Couvert implicitement** — C-02 / Copie manuelle du livrable JS |
| **REQ-109** | `SPEC-SRV-02` | **Couvert implicitement** — C-11 / Pas de sandbox |
| **REQ-110** | `SPEC-UI-03` | **Couvert implicitement** — Live visible dans le terminal UI (temporaire, non persisté) |
| **REQ-111** | `SPEC-SRV-02`, `SPEC-DATA-04`, `SPEC-DATA-03` | **Couvert** — R-37 / pas de journalisation fichier des exécutions ; champs runtime nœud exclus du JSON scénario (`AC-DATA-03-6`) |
| **REQ-112** | `SPEC-ADPT-02` | **Complet** — `CURSOR_CLI_BIN` obligatoire (build/dev/runtime adapter) |

### 4.5 Exigences d'Architecture Technique & Signatures (`SPEC-ARCH-01` à `SPEC-ARCH-09`)

| Thème architectural | Spécification(s) couvrante(s) | Modules de signature & Statut |
| :--- | :--- | :---: |
| **Graphe acyclique de dépendances (DAG) & étanchéité des couches** | `SPEC-ARCH-01` | Intégration de la couche déclarative `src/config/` (consommée exclusivement par `ConfigService`), Micro-DAG Front par dossier — **Complet** |
| **Pureté, zéro-I/O & isomorphisme du Domaine (`domain/`)** | `SPEC-ARCH-02` | `DOM-001` à `DOM-019` — **Complet** |
| **Monopole des I/O, écriture atomique & spawner aveugle (`lib/`)** | `SPEC-ARCH-03` | Monopole `process.env` / `process.cwd()` confiné à `src/lib/process/env/` (`env.engine.ts`, `env.layout.ts`) — **Complet** |
| **Découplage HttpRouter, Composition Root unique & Erreurs FR** | `SPEC-ARCH-04` | `ROOT-001`, `TYPES-001`, `TYPES-011`, `TYPES-012`, `SVC-001..013`, `CTL-001..007` — **Complet** |
| **Volumétrie de code, compacité & exemptions TSDoc** | `SPEC-ARCH-05` | Tous modules `src/`, plafonds fichiers/fonctions, `@fileExemption` — **Complet** |
| **Inférence automatique de typage & bannissement de any** | `SPEC-ARCH-06` | Tous modules `src/`, inférence retours, `@returnTypeExemption`, no-any — **Complet** |
| **Complexité algorithmique, conventions de nommage & TSDoc** | `SPEC-ARCH-07` | Tous modules `src/`, CC ≤ 10, nommage kebab/camel/Pascal, TSDoc exports — **Complet** |
| **Conformité inventaire signatures, transitions (@pendingAudit) & extraction machine-lisible** | `SPEC-ARCH-08` | 172 modules signés, .(ts\|tsx), réconciliation Lcode ↔ Ldoc, détection @pendingAudit / @deprecated — **Complet** |
| **Génération du rapport d'audit d'architecture sous out/arch/** | `SPEC-ARCH-09` | `out/arch/rapport-arch.md`, `out/arch/arch-report.json`, registre des exemptions — **Complet** |

---

## 5. Prochaine Étape : Validation Multi-Agents

Le présent document constitue le contrat directeur des domaines `SRV`, `DATA`, `ADPT`, `ENG`, `UI` et `ARCH`.
L'intégration du domaine `ARCH` et la non-régression du sommaire sont soumises au débat multi-agents de la partie **`61-validation_spec_architecture_et_sommaire`**.
