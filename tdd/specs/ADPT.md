# Spécifications — Adapters CLI & cursor-cli

**Domaine :** `ADPT`  
**Document maître :** `tdd/specs/sommaire.md`  
**ADR d'ancrage :** [`ADR-002`](../docs/adr/ADR-002-contrat-adapter.md), [`ADR-003`](../docs/adr/ADR-003-adapter-cursor-cli.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.1.md` (CR-008)  

---

## SPEC-ADPT-01 — Contrat d'adapter TypeScript et typage des flux d'événements

**Exigences :** `REQ-027`, `REQ-028`, `REQ-103`, `R-18`, `R-27`, `R-28`, `R-29`, `C-01`, `C-12`, `C-13`, `Annexe D.1`  
**Statut :** proposé  
**Version :** v1.5 (2026-11-23, intégration de Claude CLI per CR-005 / CR-013)  

### Règle

> Tout adapter embarqué dans ClientsBox implémente obligatoirement l'interface TypeScript `CLIAdapter`.
> L'adapter fournit la méthode `buildCommand(ctx: ExecutionContext)` pour construire la commande de spawn (`command`, `args`, `env`, `cwd`), la méthode `parseStreamLine(line: string)` normalisant les lignes de sortie en `AgentStreamEvent` (`stdout`, `stderr`, `exit`, `error`), la méthode optionnelle `parseOutput?(rawOutput: string): string` normalisant la sortie globale accumulée du processus pour restituer strictement la réponse textuelle de l'agent (en éliminant toute métadonnée ou événement de contrôle de flux sous-jacent) vers le SAC et les blocs avals, la méthode optionnelle `extractSessionId?(line: string): string | null` permettant d'extraire dynamiquement l'identifiant de session conversationnelle au vol dès le premier Run, la méthode optionnelle `createSession?(ctx: ExecutionContext): Promise<string>` qui ouvre une nouvelle session conversationnelle native du CLI et retourne son identifiant, et la méthode optionnelle `listModels?(): Promise<readonly string[]>` qui énumère les identifiants de modèles supportés ou disponibles.
> Tous les adaptateurs (`codex-cli`, `antigravity`, `cursor-cli`, `claude-cli`) configurent leur binaire pour émettre un flux JSON structuré (`--json`, `--output-format stream-json`, `--output-format json`). La méthode `parseOutput` de chaque adaptateur prend en charge le décodage et l'épuration de ce flux JSON afin de garantir que le SAC et les blocs avals (`If`, conditionnelles) reçoivent exclusivement le texte produit par l'IA.
> Afin de préserver les ressources système de la machine hôte et de garantir une réactivité maximale (0 ms), les modèles résolus avec succès par `listModels()` sont mémorisés en mémoire vive côté Node.js via un cache LRU multi-domaines avec TTL (ADR-016). Les appels ultérieurs sont servis depuis ce cache sans respawner de sous-processus. Si le CLI hôte est absent, inaccessible ou échoue, `listModels()` renvoie obligatoirement un tableau vide `[]` sans imposer de catalogue statique de secours fictif ni bloquer le serveur.
> `ExecutionContext` porte le champ optionnel `sessionId?: string` (identifiant de session conversationnelle à reprendre) et le champ optionnel `model?: string` (identifiant du modèle d'IA cible configuré sur le profil). Un adapter sans support de modèle ou sans `createSession` applique ses valeurs d'environnement par défaut.
> L'interface garantit un découplage total entre les blocs du canvas et la syntaxe spécifique des CLI sous-jacents : le moteur transmet un prompt déjà assemblé (`assembledPrompt`) et un contexte d'exécution sans exécuter de commande shell directe.

### Portée

- Couvre la définition statique TypeScript des interfaces `ExecutionContext`, `AgentStreamEvent` et `CLIAdapter`.
- Couvre le champ optionnel `model?: string` dans `ExecutionContext` pour cibler un modèle d'IA spécifique.
- Couvre la méthode optionnelle `listModels?(): Promise<readonly string[]>` sur l'interface `CLIAdapter`.
- Couvre le pass-through optionnel `cliOpaque?: Record<string, unknown>` pour les relais de contexte spécifiques (ex. identifiant de session CLI natif) sans en faire un store persisté.
- Couvre la normalisation des flux de sortie brute (`stdout`, `stderr`, `exit`, `error`) vers l'UI ou le moteur.
- Couvre l'extensibilité du socle (ajout d'un nouvel adapter par module embarqué sans impacter le moteur de blocs).
- Ne couvre pas la spécialisation spécifique à `cursor-cli` → `SPEC-ADPT-02`.
- Ne couvre pas le cycle de vie des processus (spawn/kill) ni la gestion des sessions de scénario → `SPEC-ADPT-03`.
- Ne couvre pas l'assemblage amont du prompt système et utilisateur → `SPEC-ENG-04`.

### Scénarios nominaux

```gherkin
Scénario : Validation du contrat de construction de commande CLI avec modèle
  Étant donné un contexte d'exécution "ctx" contenant workspacePath "/app", agentId "dev-agent", assembledPrompt "Refactorise le module" et model "gpt-5.3-codex"
  Quand le moteur appelle "adapter.buildCommand(ctx)"
  Alors l'adapter retourne un objet valide contenant la commande, le tableau d'arguments, et cwd positionné sur "/app"
  Et les blocs du scénario n'ont aucune connaissance de la syntaxe de la commande

Scénario : Normalisation des flux sortants en événements typés
  Étant donné une ligne de texte émise par le processus CLI sur stdout
  Quand "adapter.parseStreamLine(line)" est exécuté
  Alors la ligne est convertie en événement AgentStreamEvent de type "stdout", "stderr", "exit" ou "error"
  Et l'événement peut être consommé directement par le bus d'événements live
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Ligne de flux stream inattendue ou corrompue (non conforme au format JSON/protocolaire du CLI) | Fallback gracieux : la ligne est convertie en événement `{ type: 'stdout', chunk: line }` brut sans déclencher d'exception dans le parseur. |
| 2 | Valeur `cliOpaque` absente du contexte d'exécution | L'adapter traite l'absence sans erreur et applique son comportement par défaut. |
| 3 | Présence d'un adapter non opérationnel ou mal typé à la compilation | Détection immédiate à la vérification statique TypeScript (`tsc`) empêchant la construction du livrable. |
| 4 | Modèle non spécifié dans le contexte (`ctx.model` indéfini ou vide) | L'adapter utilise le modèle par défaut du CLI sans injecter de drapeau `--model`. |
| 5 | `listModels()` appelé alors que le CLI est absent ou échoue | Interception silencieuse et retour d'un tableau vide `[]` sans propager d'exception ni inventer de catalogue factice. |

### Ce qui n'est pas défini

- *2026-09-22* — Protocole de plugins chargeables dynamiquement : exclu en v1, tout adapter est obligatoirement embarqué et précompilé dans le livrable standalone (`C-12`).

### Critères d'acceptation

- [ ] `AC-ADPT-01-1` — L'interface `CLIAdapter` exporte les méthodes `buildCommand`, `parseStreamLine`, et optionnellement `createSession` et `listModels` (`CASE-ADPT-01-1`).
- [ ] `AC-ADPT-01-2` — Le type `ExecutionContext` fournit `workspacePath`, `agentId`, `assembledPrompt`, le champ optionnel `sessionId`, le champ optionnel `model` et le relais optionnel `cliOpaque` (`CASE-ADPT-01-2`).
- [ ] `AC-ADPT-01-3` — La fonction `parseStreamLine` normalise toute sortie texte en `AgentStreamEvent` typé (`CASE-ADPT-01-3`).
- [ ] `AC-ADPT-01-5` — Le contrat `CLIAdapter` supporte la méthode optionnelle `listModels?(): Promise<readonly string[]>` qui mémorise les modèles en cache Node.js avec TTL et renvoie `[]` en cas d'absence de binaire ou d'échec (`CASE-ADPT-01-1` / `CASE-ADPT-01-2`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la stricte préservation de `assembledPrompt` déjà construit | Acceptée | Conforme au CDC §8 R-45 et ADR-002. |

---

## SPEC-ADPT-02 — Spécialisation opérationnelle cursor-cli

**Exigences :** `REQ-008`, `REQ-013`, `REQ-029`, `REQ-031`, `REQ-112`, `R-03`, `R-04`, `R-28`, `R-38`, `R-40`, `C-12`  
**Statut :** proposé  
**Version :** v1.3 (2026-11-10, sortie JSON unifiée et parseOutput pour le SAC per CR-007)  

### Règle

> L'adapter `cursor-cli` (`cliId = 'cursor-cli'`) est un adapter opérationnel embarqué dans ClientsBox.
> Le chemin vers le binaire du CLI Cursor est résolu exclusivement à partir de la variable d'environnement `process.env.CURSOR_CLI_BIN`.
> Si `CURSOR_CLI_BIN` n'est pas définie ou pointe vers un fichier inexistant/non exécutable, l'exécution échoue immédiatement avec un diagnostic explicite.
> `CURSOR_CLI_BIN` désigne le binaire Cursor Agent (`agent` / `cursor-agent`).
> `buildCommand` génère la commande non interactive en format JSON `-p --output-format json --resume <ctx.sessionId> <ctx.assembledPrompt>` et positionne `cwd` sur `ctx.workspacePath`. Si `ctx.model` est fourni et non vide (après `trim()`), `buildCommand` insère l'option `--model <ctx.model.trim()>` avant la reprise de session. Si `ctx.sessionId` est absent, `buildCommand` lève une erreur explicite en français : cursor-cli n'exécute jamais un Run hors session.
> `createSession` invoque `<CURSOR_CLI_BIN> create-chat` (cwd = `ctx.workspacePath`) et résout avec l'identifiant de chat imprimé sur stdout (première ligne non vide, espaces retirés). Code de sortie non nul ou sortie vide → rejet avec erreur explicite en français. Cette création native ne consomme aucun token LLM d'amorce.
> `listModels` interroge le binaire Cursor via `<CURSOR_CLI_BIN> --list-models` pour extraire la liste des identifiants disponibles. En cas d'indisponibilité du binaire ou d'erreur, elle renvoie une liste de modèles de repli prédéfinis sans planter le serveur.
> `parseStreamLine` décode les sorties produites par le binaire Cursor pour alimenter le flux d'événements live.
> `parseOutput(rawOutput: string)` prend en charge la normalisation de la sortie JSON globale accumulée émise par Cursor. Elle décode le JSON ou extrait le fragment textuel utile (par exemple `content` dans `{ type: 'text', content: '...' }` ou le texte encapsulé) afin de restituer strictement le texte pur produit par l'agent au SAC et aux blocs avals, en éliminant toute métadonnée JSON. En cas de texte brut, elle replie fidèlement sur la chaîne d'entrée.

### Portée

- Couvre la résolution et la validation de la variable d'environnement `CURSOR_CLI_BIN`.
- Couvre la génération des arguments de commande pour l'exécution d'un prompt via cursor-cli, avec format JSON (`--output-format json`), reprise de session (`--resume`) et modèle optionnel (`--model`).
- Couvre la création d'une session native via `create-chat` (`createSession`).
- Couvre l'énumération des modèles supportés via `listModels()`.
- Couvre le décodage du flux stream de cursor-cli vers `AgentStreamEvent`.
- Couvre la normalisation de la sortie globale pour le SAC via `parseOutput()`.
- Ne couvre pas la gestion des signaux Stop ni l'implémentation de `clearContext` → `SPEC-ADPT-03`.
- Ne couvre pas le rendu dans le terminal web de l'IHM → `SPEC-UI-03`.

### Scénarios nominaux

```gherkin
Scénario : Résolution nominale du binaire et génération de la commande cursor-cli avec modèle et JSON
  Étant donné la variable d'environnement CURSOR_CLI_BIN pointant vers "/opt/cursor/bin/cursor-agent"
  Et un contexte d'exécution avec workspacePath "/home/user/project", prompt "Exécute les tests", sessionId "chat-123" et model "gpt-5.3-codex"
  Quand le moteur sollicite l'adapter "cursor-cli"
  Alors "buildCommand" retourne command "/opt/cursor/bin/cursor-agent", les arguments ["-p", "--output-format", "json", "--model", "gpt-5.3-codex", "--resume", "chat-123", "Exécute les tests"], et cwd "/home/user/project"

Scénario : Génération de commande cursor-cli sans modèle spécifié avec JSON
  Étant donné la variable d'environnement CURSOR_CLI_BIN pointant vers "/opt/cursor/bin/cursor-agent"
  Et un contexte d'exécution avec workspacePath "/home/user/project", prompt "Exécute les tests", sessionId "chat-123" et sans champ model
  Quand "buildCommand" est appelé
  Alors les arguments retournés sont ["-p", "--output-format", "json", "--resume", "chat-123", "Exécute les tests"] sans drapeau "--model"

Scénario : Énumération des modèles disponibles via listModels avec mise en cache Node.js
  Étant donné l'adaptateur CursorCLIAdapter sollicité pour ses modèles
  Quand la méthode "listModels()" est invoquée pour la première fois
  Alors le CLI Cursor est exécuté avec "--list-models", la liste des modèles est parsée, stockée en cache Node.js avec TTL et retournée
  Et un second appel à "listModels()" retourne immédiatement la liste depuis le cache mémoire sans réexécuter le processus CLI

Scénario : Création d'une session native cursor-cli sans consommation de prompt
  Étant donné CURSOR_CLI_BIN pointant vers un binaire qui imprime "chat-123" sur "create-chat"
  Quand le moteur appelle "createSession(ctx)"
  Alors le binaire est lancé avec l'argument unique "create-chat"
  Et la promesse résout "chat-123"

Scénario : Normalisation de la sortie JSON Cursor pour le SAC via parseOutput
  Étant donné une sortie brute JSON émise par le CLI Cursor :
    '{"type":"text","content":"Résultat du refactoring"}'
  Quand "adapter.parseOutput(rawOutput)" est exécuté
  Alors la méthode retourne strictement "Résultat du refactoring" sans structure JSON
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Variable `CURSOR_CLI_BIN` non définie dans l'environnement | Échec immédiat de l'opération avec message d'erreur explicite indiquant l'absence de `CURSOR_CLI_BIN` (`REQ-031`, `REQ-112`). |
| 2 | Chemin spécifié par `CURSOR_CLI_BIN` inexistant ou inaccessible en exécution | Détection à l'initialisation/invocation, levée d'erreur claire sans blocage indéfini du serveur. |
| 3 | Prompt assemblé volumineux ou multi-lignes | Injection fidèle dans les arguments ou stdin selon le mode d'invocation du binaire Cursor sans troncature. |
| 4 | `buildCommand` appelé sans `ctx.sessionId` | Erreur explicite en français ; aucun spawn. |
| 5 | `create-chat` sort en code non nul ou n'imprime aucun identifiant | Rejet de `createSession` avec erreur explicite en français ; le bloc Run échoue (`R-25`). |
| 6 | `ctx.model` composé uniquement d'espaces (`"   "`) | `buildCommand` ignore la valeur et n'injecte aucun drapeau `--model`. |
| 7 | `listModels()` appelé alors que le binaire Cursor échoue ou est absent | Interception de l'erreur et retour d'un tableau vide `[]` sans bloquer le serveur ni injecter de faux modèles factices. |

### Ce qui n'est pas défini

- *2026-09-22* — Flags spécifiques évolutifs du binaire cursor-cli : encapsulés dans le module adapter sans modifier le contrat global `CLIAdapter`.
- *2026-11-06 (CR-003)* — Pas de validation syntaxique des crochets `[...]` : l'identifiant est transmis tel quel à l'argument `--model`.

### Critères d'acceptation

- [ ] `AC-ADPT-02-1` — Le système valide la présence et l'accessibilité de `CURSOR_CLI_BIN` avant toute exécution (`CASE-ADPT-02-1`).
- [ ] `AC-ADPT-02-2` — `buildCommand` produit `-p --output-format json --resume <sessionId> <prompt>` avec cwd = workspace, et refuse un contexte sans `sessionId` (`CASE-ADPT-02-2`).
- [ ] `AC-ADPT-02-3` — `parseStreamLine` extrait et normalise correctement les flux de sortie du CLI Cursor (`CASE-ADPT-02-3`).
- [ ] `AC-ADPT-02-4` — `createSession` lance `create-chat` et retourne l'identifiant imprimé sans prompt, ou rejette explicitement en cas d'échec (`CASE-ADPT-02-4`).
- [ ] `AC-ADPT-02-5` — `buildCommand` injecte `['--model', ctx.model.trim()]` si le modèle est présent et non vide, et l'omet quand il est absent ou vide ; `listModels` énumère les modèles disponibles, les met en mémoire cache Node.js avec TTL et bascule sur un tableau vide `[]` en cas d'erreur ou d'absence de binaire (`CASE-ADPT-02-5`).
- [ ] `AC-ADPT-02-6` — `parseOutput` normalise la sortie JSON Cursor pour renvoyer le texte pur de l'agent au SAC (`CASE-ADPT-01-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Confirmer l'absence de fallback automatique en cas de `CURSOR_CLI_BIN` absent | Acceptée | Conforme aux exigences strictes REQ-031, REQ-112 et ADR-003. |
| Mocking des flux `stdio` en TU (`AC-ADPT-02-1`) | Précisée | Les tests unitaires simulent `child_process.spawn` en mémoire ; la résolution réelle de binaire est réservée aux tests d'intégration (ADR-006). |

---

## SPEC-ADPT-03 — Cycle de vie du processus, Stop manuel et sessions de scénario

**Exigences :** `REQ-020`, `REQ-022`, `REQ-025`, `REQ-040`, `R-23`, `R-24`, `R-32`, `R-33`, `R-34`, `R-39`, `R-46`, `REQ-101`  
**Statut :** proposé  
**Version :** v2.1 (2026-11-13, CR-008 — isolation sessions sous-runner CallScenario)  

### Règle

> ClientsBox gère le cycle de vie des processus enfants spawnés pour les commandes CLI, en distinguant strictement l'interruption d'exécution (**Stop**) de l'effacement de mémoire conversationnelle (**ClearContext**).
> - **Session de scénario :** la mémoire conversationnelle d'un agent est **spécifique à une exécution de scénario**. Le runner tient en mémoire vive une table `agentId → sessionId`, vide au lancement de chaque exécution et abandonnée à sa fin (succès, erreur ou Stop). Au premier Run d'un agent dans l'exécution, le runner obtient une session via `adapter.createSession(ctx)` ; tous les Runs suivants de cet agent reçoivent le même `ctx.sessionId`. Deux exécutions successives d'un même scénario ne partagent jamais de session.
> - **CallScenario (sous-runner) :** chaque sous-exécution dispose de sa **propre** table de sessions, isolée de celle du runner parent. Aucun partage de `sessionId` parent↔enfant en V1 de la feature (`REQ-040`, ADR-018).
> - **ClearContext :** retire l'entrée de l'agent dans la table **du runner courant** (parent ou sous-runner). Aucune commande CLI n'est lancée ; le Run suivant de cet agent dans **ce** runner provoque un nouvel appel `createSession` (nouvelle mémoire vierge). L'ancienne session native est abandonnée, pas détruite.
> - **Stop manuel (kill) :** tue le processus enfant actif via signal système (`SIGTERM` / `SIGKILL`) et termine l'exécution ; il ne crée ni ne supprime aucune session native (`R-23`, `R-24`, `R-34`). Un Stop du run racine propage l'arrêt aux sous-runners CallScenario et à leurs spawns.
> - **Non-persistance :** la table de sessions n'est jamais écrite sur disque (ni sous `.agents/`, ni ailleurs) ; l'historique conversationnel lui-même reste stocké par le CLI natif (`REQ-101`, `R-32`).
> - **Pas de reset manuel :** aucun bouton UI ni route HTTP ne permet d'effacer le contexte d'un agent hors scénario ; le seul mécanisme est le bloc ClearContext (et le lancement d'une nouvelle exécution).

### Portée

- Couvre le spawn, la surveillance et l'interruption des processus enfants CLI.
- Couvre l'opération de Stop manuel tuant le process enfant sans créer ni supprimer de session native.
- Couvre la table de sessions en mémoire du runner : création paresseuse au premier Run, réutilisation, oubli sur ClearContext, abandon en fin d'exécution.
- Couvre l'isolation des tables de sessions entre runner parent et sous-runner CallScenario.
- Couvre la non-persistance de cette table sur disque.
- Ne couvre pas le bouton graphique Stop dans le navigateur → `SPEC-UI-03`.
- Ne couvre pas la logique de pause et reprise du graphe → `SPEC-ENG-02`.
- Ne couvre pas la syntaxe `create-chat` / `--resume` de cursor-cli → `SPEC-ADPT-02`.

### Scénarios nominaux

```gherkin
Scénario : Interruption manuelle d'un processus en cours d'exécution (Stop)
  Étant donné un processus cursor-cli actif exécutant un bloc Run
  Quand l'utilisateur déclenche l'action Stop
  Alors le sous-processus reçoit un signal SIGTERM (ou SIGKILL si non répondu) et s'interrompt immédiatement
  Et aucun appel createSession n'est effectué

Scénario : Mémoire conservée entre deux Runs du même agent
  Étant donné un scénario Start --> Run-1(agent-a) --> Run-2(agent-a)
  Quand le scénario est exécuté
  Alors createSession est appelé exactement 1 fois pour agent-a
  Et Run-1 et Run-2 reçoivent le même sessionId

Scénario : ClearContext impose une nouvelle mémoire
  Étant donné un scénario Start --> Run-1(agent-a) --> ClearContext(agent-a) --> Run-2(agent-a)
  Quand le scénario est exécuté
  Alors createSession est appelé 2 fois pour agent-a
  Et Run-2 reçoit un sessionId différent de celui de Run-1

Scénario : Sessions spécifiques à l'exécution
  Étant donné un scénario Start --> Run-1(agent-a) exécuté deux fois de suite
  Alors chaque exécution appelle createSession pour agent-a
  Et les deux exécutions utilisent des sessionId différents
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Action Stop déclenchée alors que le processus CLI refuse de s'arrêter sur `SIGTERM` | Escalade après délai raisonnable vers `SIGKILL` pour forcer la libération des ressources. |
| 2 | Action Stop déclenchée pendant qu'un bloc est en état de pause | Prise en compte immédiate : le scénario est arrêté et l'attente est libérée (`R-25`, `R-34`). |
| 3 | Deux Runs du même agent déclenchés en parallèle alors que l'agent n'a pas encore de session | Un seul `createSession` : la création est partagée (même promesse), les deux Runs reçoivent le même `sessionId`. |
| 4 | Deux Runs du même agent s'exécutant en parallèle sur une session existante | Deux processus distincts lancés sans sérialisation forcée par ClientsBox ; la cohérence des accès concurrents relève du CLI natif (`R-33`). |
| 5 | ClearContext exécuté pendant qu'un Run du même agent est en cours | Le Run en cours n'est ni tué ni modifié (il termine sur l'ancienne session) ; seul le Run démarré après le ClearContext obtient une nouvelle session. |
| 6 | Échec de `createSession` (binaire inaccessible, sortie invalide) | Échec du bloc Run concerné, arrêt global du scénario en erreur (`R-25`). |
| 7 | Adapter sans `createSession` | Les Runs s'exécutent sans `sessionId` (pas de mémoire) ; ClearContext se limite à l'oubli de l'entrée (no-op). |
| 8 | Même `agentId` utilisé dans le parent et dans un sous-scénario CallScenario | Tables de sessions distinctes : les `sessionId` ne sont pas partagés (`REQ-040`, ADR-018). |

### Ce qui n'est pas défini

- *2026-09-22* — Délais d'escalade SIGTERM -> SIGKILL : fixés par défaut à une valeur standard (ex. 3000ms) dans le gestionnaire de processus.
- *2026-11-03* — Nettoyage des sessions natives abandonnées dans le stockage du CLI : hors périmètre ClientsBox.
- *2026-11-13* — Partage volontaire de sessions parent↔enfant : hors scope V1 CallScenario.

### Critères d'acceptation

- [ ] `AC-ADPT-03-1` — L'action Stop tue le processus enfant sans créer ni supprimer de session native (`CASE-ADPT-03-1`).
- [ ] `AC-ADPT-03-2` — Après un ClearContext, le Run suivant du même agent obtient une nouvelle session via `createSession` ; avant, la session est réutilisée (`CASE-ADPT-03-2`).
- [ ] `AC-ADPT-03-3` — La table de sessions est propre à une exécution, jamais persistée sur disque, et une nouvelle exécution repart de sessions neuves (`CASE-ADPT-03-3`).
- [ ] `AC-ADPT-03-4` — Un sous-runner CallScenario utilise une table de sessions isolée du parent (`CASE-ADPT-03-6`, `REQ-040`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Confirmer la distinction nette entre Stop (kill process) et Clear (reset session) | Acceptée | Conforme au CDC §8 R-23, R-24, R-34 et ADR-002/003. |
| `cursor --clear-context` n'existe pas dans cursor-cli ; `-p` seul est sans mémoire | Acceptée (2026-11-03) | Décision utilisateur : session native via `create-chat` + `--resume`, mémoire spécifique au scénario. Remplace R-31 (contexte survivant aux scénarios) et R-30 (reset manuel UI), retirés. |
| Simulation déterministe de l'escalade SIGKILL (`AC-ADPT-03-1`) | Précisée | Utilisation de faux timers (`FakeTimers`) pour valider le timeout de 3000 ms sans attente active réelle (ADR-006). |
| Isolation sessions CallScenario | Acceptée | 2026-11-13 — CR-008 / ADR-018. |

---

## SPEC-ADPT-04 — Spécialisation opérationnelle Antigravity CLI

**Exigences :** `REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-28`, `R-38`, `C-12`  
**Statut :** proposé  
**Version :** v1.1 (2026-11-10, sortie JSON stream-json, suppression de l'amorce ping, capture Lazy Session et parseOutput per CR-007)  

### Règle

> L'adapter `antigravity` (`cliId = 'antigravity'`) est un adapter opérationnel embarqué dans ClientsBox.
> Le chemin vers le binaire du CLI Antigravity est résolu exclusivement à partir de la variable d'environnement `process.env.ANTIGRAVITY_CLI_BIN`.
> Si `ANTIGRAVITY_CLI_BIN` n'est pas définie ou pointe vers un fichier inexistant ou non exécutable, l'exécution échoue immédiatement avec un diagnostic explicite en français.
> `ANTIGRAVITY_CLI_BIN` désigne le binaire exécutable Antigravity (`agy` / `agy.exe`).
> `buildCommand` génère la commande non interactive en utilisant le flag d'auto-approbation headless `--dangerously-skip-permissions`, le format JSON obligatoire `--output-format stream-json`, et le flag `--print <ctx.assembledPrompt>`, avec positionnement de `cwd` sur `ctx.workspacePath` :
> - Si `ctx.model` est fourni et non vide (après `trim()`), `buildCommand` insère l'option `--model <ctx.model.trim()>`.
> - Si `ctx.sessionId` est fourni et non vide (après `trim()`), `buildCommand` insère l'option `--conversation <ctx.sessionId.trim()>` pour rattacher l'exécution à une session conversationnelle existante.
> - Si `ctx.sessionId` est absent ou vide, `buildCommand` génère la commande initiale sans flag `--conversation`.
> `extractSessionId(line: string)` permet la capture dynamique et paresseuse (Lazy Session) de l'identifiant `conversation_id` dès la première ligne émise lors du premier Run de l'agent (`agy --dangerously-skip-permissions --output-format stream-json --print <vrai_prompt>`), sans nécessiter d'amorce préalable ni de prompt artificiel `ping`. Ce `conversation_id` est enregistré dans la table de session du scénario et réutilisé par les Runs suivants de cet agent (`--conversation <conversation_id>`). Un bloc `ClearContext` efface cet identifiant de la mémoire vive pour amorcer un nouveau fil conversationnel au Run suivant.
> `createSession` reste disponible comme méthode de secours optionnelle ouvrant une session conversationnelle native Antigravity en exécutant un processus d'amorce court (`--dangerously-skip-permissions --output-format stream-json -p ping`). Dès la détection du champ `conversation_id`, elle capture l'UUID, attend la terminaison ordonnée du sous-processus (code de sortie 0) et résout la promesse avec cet UUID.
> En cas d'absence d'identifiant dans la sortie du processus d'amorce, de code de sortie non nul ou de dépassement du délai d'attente (5 000 ms), `createSession` rejette avec un diagnostic explicite en français.
> `listModels` interroge le binaire Antigravity via `<ANTIGRAVITY_CLI_BIN> models` pour extraire la liste des identifiants disponibles (lignes tabulaires `<modelId>\t<displayName>`). En cas d'indisponibilité du binaire, de code de sortie non nul ou d'erreur d'exécution, elle renvoie une liste de modèles de repli prédéfinis sans lever d'exception.
> `parseStreamLine` décode les lignes de flux produites par le binaire Antigravity :
> - Si la ligne est un objet JSON au format stream (`step_update.text_delta`, `result.response`, ou `response`), elle est convertie en événement `{ type: 'stdout', chunk: texte }`.
> - En cas de texte brut ou de JSON malformé, elle renvoie sans exception `{ type: 'stdout', chunk: line }`.
> `parseOutput(rawOutput: string)` extrait la réponse textuelle finale produite par l'agent depuis le flux `stream-json` global (depuis l'événement final `result.response` ou l'assemblage des deltas de texte `step_update.text_delta`) afin de transmettre au SAC et aux blocs avals (`If`) une chaîne épurée débarrassée de toute métadonnée JSON. En cas de texte brut, elle replie fidèlement sur la chaîne d'entrée.

### Portée

- Couvre la résolution et la validation de la variable d'environnement `ANTIGRAVITY_CLI_BIN`.
- Couvre la génération des arguments de commande pour l'exécution d'un prompt via antigravity CLI, avec prise en charge du format stream-json (`--output-format stream-json`), du modèle (`--model`), de la reprise de conversation (`--conversation`), de l'auto-approbation des permissions headless (`--dangerously-skip-permissions`) et du prompt (`--print`).
- Couvre la capture dynamique de session conversationnelle au 1er Run (`extractSessionId`) sans amorce `ping`.
- Couvre l'énumération des modèles d'IA disponibles via `listModels()`.
- Couvre la normalisation des sorties texte ou stream vers `AgentStreamEvent`.
- Couvre la normalisation de la sortie globale pour le SAC via `parseOutput()`.
- Ne couvre pas la persistance des conversations gérée de manière interne par le binaire Antigravity dans son répertoire applicatif.

### Scénarios nominaux

```gherkin
Scénario : Validation de la commande générée avec prompt, modèle et conversation en format stream-json
  Étant donné un contexte avec assembledPrompt "Analyse le code", model "test-model-custom" et sessionId "conv-123"
  Quand "adapter.buildCommand(ctx)" est appelé
  Alors la commande retournée contient les arguments "--dangerously-skip-permissions", "--output-format", "stream-json", "--model", "test-model-custom", "--conversation", "conv-123", "--print", "Analyse le code"
  Et cwd pointe sur ctx.workspacePath

Scénario : Validation de la commande minimale sans modèle ni session en format stream-json
  Étant donné un contexte avec assembledPrompt "Ping" sans model ni sessionId
  Quand "adapter.buildCommand(ctx)" est appelé
  Alors la commande contient les arguments "--dangerously-skip-permissions", "--output-format", "stream-json", "--print" suivi de "Ping"
  Et aucun flag "--model" ni "--conversation" n'est présent

Scénario : Découverte des modèles opérationnels Antigravity avec mise en cache Node.js
  Étant donné le binaire Antigravity disponible
  Quand "adapter.listModels()" est exécuté pour la première fois
  Alors la liste des identifiants nettoyés (ex: "test-model-alpha", "test-model-beta") est retournée et mémorisée en cache Node.js
  Et un appel subséquent retourne instantanément les données en mémoire vive sans spawn système

Scénario : Décodage résilient des deltas de flux de streaming
  Étant donné une ligne JSON '{"event":"step_update","step_update":{"text_delta":"Bonjour"}}'
  Quand "adapter.parseStreamLine(line)" est exécuté
  Alors un événement { type: 'stdout', chunk: 'Bonjour' } est retourné

Scénario : Capture dynamique de session Antigravity au premier Run sans amorce ping
  Étant donné un scénario exécutant Start -> Run-1(agent-agy) -> Run-2(agent-agy)
  Quand le scénario est exécuté
  Alors Run-1 s'exécute en mode initial sans sessionId avec "--output-format stream-json"
  Et son identifiant "conversation_id" est capturé dès la première ligne émise
  Et Run-2 s'exécute avec "--conversation" en réutilisant exactement cet identifiant
  Et aucun appel préalable avec le prompt artificiel "ping" n'a été exécuté

Scénario : Normalisation de la sortie stream-json Antigravity pour le SAC via parseOutput
  Étant donné une sortie brute multi-lignes stream-json émise par Antigravity contenant un événement 'result' avec response 'Tâche effectuée avec succès.'
  Quand "adapter.parseOutput(rawOutput)" est exécuté
  Alors la méthode retourne strictement "Tâche effectuée avec succès." sans structure JSON
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Variable `ANTIGRAVITY_CLI_BIN` absente ou vide | Levée d'une erreur bloquante explicite en français. |
| 2 | Binaire pointé par `ANTIGRAVITY_CLI_BIN` inexistant ou non exécutable | Diagnostic explicite avec indication du chemin défaillant. |
| 3 | Échec d'exécution de `agy models` (binaire indisponible ou plantage) | Interception silencieuse et retour d'un tableau vide `[]` sans lever d'exception ni inventer de faux modèles. |
| 4 | Flux stream contenant du texte brut non JSON | Fallback gracieux vers `{ type: 'stdout', chunk: line }`. |
| 5 | Identifiant de modèle avec espaces superflus | Nettoyage via `trim()` avant injection dans `--model`. |
| 6 | Sortie de l'amorce stream-json fermée sans aucun `conversation_id` | Levée d'une erreur explicite en français : "Échec de création de session Antigravity : aucun identifiant retourné par l'amorce stream-json.". |
| 7 | Processus d'amorce se terminant avec un code de sortie non nul (ex: code 2) | Levée d'une erreur explicite mentionnant le code d'erreur. |
| 8 | Délai d'amorce dépassé (> 5000 ms) | Interruption du sous-processus et rejet de la promesse avec indication du dépassement de délai. |

### Critères d'acceptation

- [ ] `AC-ADPT-04-1` — `AntigravityCLIAdapter` implémente `CLIAdapter` avec `cliId = 'antigravity'` (`CASE-ADPT-04-1`).
- [ ] `AC-ADPT-04-2` — `resolveAntigravityCliBin` valide la présence physique et les permissions d'exécution de `ANTIGRAVITY_CLI_BIN` (`CASE-ADPT-04-2`).
- [ ] `AC-ADPT-04-3` — `buildCommand` génère la commande avec `--output-format stream-json`, `--print`, `--model` optionnel et `--conversation` optionnel (`CASE-ADPT-04-2`).
- [ ] `AC-ADPT-04-4` — `parseStreamLine` normalise les flux NDJSON (notamment `text_delta` et `response`) et le texte brut sans exception (`CASE-ADPT-04-3`).
- [ ] `AC-ADPT-04-5` — `listModels` interroge `agy models`, parse les identifiants, met en mémoire cache Node.js avec TTL et bascule sur un tableau vide `[]` en cas d'absence de binaire ou d'anomalie (`CASE-ADPT-04-4`).
- [ ] `AC-ADPT-04-6` — La session conversationnelle Antigravity est capturée dynamiquement au premier Run (`extractSessionId`) sans amorce `ping` préalable et réutilisée sur les Runs suivants via `--conversation` (`CASE-ADPT-04-6`).
- [ ] `AC-ADPT-04-7` — `parseOutput` extrait la réponse textuelle finale produite par l'agent depuis le flux `stream-json` Antigravity pour le SAC et les blocs avals (`CASE-ADPT-04-3`).

---

## SPEC-ADPT-05 — Spécialisation opérationnelle Codex CLI

**Exigences :** `REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-28`, `R-38`, `C-12`  
**Statut :** proposé  
**Version :** v1.0 (2026-11-10, ajout de l'adaptateur Codex CLI per CR-006)  

### Règle

> L'adapter `codex-cli` (`cliId = 'codex-cli'`) est un adapter opérationnel embarqué dans ClientsBox.
> Le chemin vers le binaire du CLI Codex est résolu exclusivement à partir de la variable d'environnement `process.env.CODEX_CLI_BIN`.
> Si `CODEX_CLI_BIN` n'est pas définie ou pointe vers un fichier inexistant ou non exécutable, l'exécution échoue immédiatement avec un diagnostic explicite en français.
> `CODEX_CLI_BIN` désigne le binaire exécutable Codex (`codex` / `codex.exe`).
> `buildCommand` génère la commande non interactive en utilisant le flag obligatoire `--json` et le contournement sécurisé d'approbation headless `--dangerously-bypass-approvals-and-sandbox` :
> - Si `ctx.sessionId` est fourni et non vide (après `trim()`), `buildCommand` insère la sous-commande `resume` : `['exec', 'resume', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(ctx.model ? ['--model', ctx.model.trim()] : []), ctx.sessionId.trim(), ctx.assembledPrompt]`.
> - Si `ctx.sessionId` est absent ou vide, `buildCommand` génère la commande initiale : `['exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(ctx.model ? ['--model', ctx.model.trim()] : []), ctx.assembledPrompt]`.
> Positionne `cwd` sur `ctx.workspacePath`.
> `extractSessionId(line: string)` permet la capture dynamique et paresseuse (Lazy Session) de l'identifiant `thread_id` dès la première ligne (`thread.started`) émise lors du premier Run de l'agent (`codex exec --json ... <vrai_prompt>`), sans nécessiter d'amorce préalable ni de prompt artificiel `ping`. Ce `thread_id` est enregistré dans la table de session du scénario et réutilisé par les Runs suivants de cet agent (`codex exec resume ... <thread_id> <prompt>`). Un bloc `ClearContext` efface cet identifiant de la mémoire vive pour amorcer un nouveau fil conversationnel au Run suivant.
> `createSession` reste disponible comme méthode de secours optionnelle ouvrant une session conversationnelle native Codex en exécutant un processus d'amorce rapide stream-json (`codex exec --json --dangerously-bypass-approvals-and-sandbox ping`). Dès la détection du champ `thread_id` dans l'événement `thread.started`, elle capture cet identifiant UUID, attend la terminaison ordonnée du sous-processus (code de sortie 0) et résout la promesse avec cet UUID.
> En cas d'absence d'identifiant dans la sortie du processus d'amorce, de code de sortie non nul ou de dépassement du délai d'attente (`CODEX_PROBE_TIMEOUT_MS`, défaut 15 000 ms), `createSession` rejette avec un diagnostic explicite en français.
> `listModels` interroge le binaire Codex via `<CODEX_CLI_BIN> debug models` pour extraire la liste des slugs disponibles (`models[].slug`). Les modèles sont mis en mémoire vive via un cache LRU multi-domaines avec TTL (ADR-016). En cas d'indisponibilité du binaire, de code de sortie non nul ou d'erreur d'exécution, elle renvoie un tableau vide `[]` sans lever d'exception.
> `parseStreamLine` décode les lignes JSONL produites par le binaire Codex :
> - Si l'événement est `item.completed` avec `item.type === 'agent_message'`, le contenu `item.text` est converti en événement `{ type: 'stdout', chunk: item.text }`.
> - En cas de texte brut ou de JSON malformé, elle renvoie sans exception `{ type: 'stdout', chunk: line }`.
> `parseOutput(rawOutput: string)` parse la sortie brute accumulée émise par Codex CLI (lignes JSONL) et en extrait strictement le texte écrit par l'agent (`item.text` dans l'événement `item.completed` où `item.type === 'agent_message'`). Les métadonnées et événements de contrôle techniques (`thread.started`, `turn.started`, `turn.completed`, `usage`) sont totalement ignorés et exclus du résultat pour garantir l'intégrité des conditions et du SAC. Si la sortie ne contient aucun JSON ou est en texte brut, le texte est retourné sans altération. Pour les adaptateurs `cursor-cli` et `antigravity`, `parseOutput` retourne l'entrée brute sans transformation.

### Portée

- Couvre la résolution et la validation de la variable d'environnement `CODEX_CLI_BIN`.
- Couvre la génération des arguments de commande pour l'exécution d'un prompt via Codex CLI, avec prise en charge du modèle (`--model`), de l'exécution headless (`--dangerously-bypass-approvals-and-sandbox`), de la sortie JSON (`--json`) et de la reprise de session (`exec resume <sessionId>`).
- Couvre l'extraction dynamique de session conversationnelle (`extractSessionId`) au premier Run sans gaspillage de tokens, et l'amorce de secours ordonnée (`probeCodexSession`).
- Couvre l'extraction et la normalisation stricte du texte de l'agent via `parseOutput()` pour alimenter le SAC et les blocs avals sans pollution JSON.
- Couvre l'énumération des modèles d'IA disponibles via `listModels()` (`debug models`).
- Couvre la normalisation des flux d'événements vers `AgentStreamEvent`.
- Ne couvre pas la persistance interne des threads gérée par le runtime Codex dans son dossier utilisateur `~/.codex/`.

### Scénarios nominaux

```gherkin
Scénario : Validation de la commande générée avec prompt et modèle sans session
  Étant donné un contexte d'exécution avec assembledPrompt "Refactorise le module" et model "gpt-5.6-luna" sans sessionId
  Quand "adapter.buildCommand(ctx)" est appelé
  Alors la commande contient les arguments "exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", "gpt-5.6-luna", "Refactorise le module"
  Et cwd pointe sur ctx.workspacePath

Scénario : Validation de la commande de reprise avec sessionId existant
  Étant donné un contexte d'exécution avec assembledPrompt "Suite de l'analyse", sessionId "01a1c467-d234-7020-9cff-1d6cbdfeb8ca" et model "gpt-reserve"
  Quand "adapter.buildCommand(ctx)" est appelé
  Alors la commande contient les arguments "exec", "resume", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", "gpt-reserve", "01a1c467-d234-7020-9cff-1d6cbdfeb8ca", "Suite de l'analyse"

Scénario : Extraction stricte de la réponse de l'agent via parseOutput
  Étant donné une sortie brute accumulée composée de multiples lignes JSONL Codex dont thread.started, turn.started, item.completed avec text "4721" et turn.completed avec usage
  Quand "adapter.parseOutput(rawOutput)" est exécuté
  Alors le texte retourné est strictement "4721"
  Et toutes les métadonnées techniques JSON sont épurées

Scénario : Découverte des modèles opérationnels Codex avec mise en cache Node.js
  Étant donné le binaire Codex disponible
  Quand "adapter.listModels()" est exécuté pour la première fois
  Alors la commande "debug models" est invoquée, la liste des slugs (ex: "gpt-reserve", "gpt-6-luna", "gpt-5.6-terra") est retournée et mémorisée en cache
  Et un appel subséquent retourne instantanément les données en mémoire vive sans spawn système

Scénario : Décodage résilient des événements du flux streaming JSONL
  Étant donné une ligne JSON '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"Code généré avec succès."}}'
  Quand "adapter.parseStreamLine(line)" est exécuté
  Alors un événement { type: 'stdout', chunk: 'Code généré avec succès.' } est retourné
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Variable `CODEX_CLI_BIN` absente ou vide | Levée d'une erreur bloquante explicite en français. |
| 2 | Binaire pointé par `CODEX_CLI_BIN` inexistant ou non exécutable | Diagnostic explicite avec indication du chemin défaillant. |
| 3 | Échec d'exécution de `codex debug models` (binaire indisponible ou plantage) | Interception silencieuse et retour d'un tableau vide `[]` sans lever d'exception. |
| 4 | Flux stream ou sortie brute contenant du texte brut non JSON | Fallback gracieux retournant la chaîne brute textuelle sans altération. |
| 5 | Identifiant de modèle avec espaces superflus | Nettoyage via `trim()` avant injection dans `--model`. |
| 6 | Sortie de l'amorce stream-json fermée sans aucun `thread_id` | Levée d'une erreur explicite en français : "Échec de création de session Codex : aucun identifiant retourné par l'amorce stream-json.". |
| 7 | Processus d'amorce se terminant avec un code de sortie non nul (ex: code 1) | Levée d'une erreur explicite mentionnant le code d'erreur. |
| 8 | Délai d'amorce dépassé (> 15 000 ms) | Interruption du sous-processus et rejet de la promesse avec indication du dépassement de délai. |

### Critères d'acceptation

- [ ] `AC-ADPT-05-1` — `CodexCLIAdapter` implémente `CLIAdapter` avec `cliId = 'codex-cli'` (`CASE-ADPT-05-1`).
- [ ] `AC-ADPT-05-2` — `resolveCodexCliBin` valide la présence physique et les permissions d'exécution de `CODEX_CLI_BIN` (`CASE-ADPT-05-2`).
- [ ] `AC-ADPT-05-3` — `buildCommand` génère la commande avec `exec` (sans session) ou `exec resume` (avec session), `--json`, `--dangerously-bypass-approvals-and-sandbox` et `--model` optionnel (`CASE-ADPT-05-2`).
- [ ] `AC-ADPT-05-4` — `parseStreamLine` normalise les flux JSONL (notamment `item.completed` avec `agent_message`) et le texte brut sans exception (`CASE-ADPT-05-3`).
- [ ] `AC-ADPT-05-5` — `listModels` interroge `codex debug models`, extrait les slugs, met en mémoire cache Node.js avec TTL et bascule sur `[]` en cas d'anomalie (`CASE-ADPT-05-4`).
- [ ] `AC-ADPT-05-6` — `parseOutput` extrait strictement le texte écrit par l'agent depuis la sortie accumulée JSONL (`CASE-ADPT-05-3`).
- [ ] `AC-ADPT-05-7` — `extractSessionId` permet la capture dynamique de `thread_id` au 1er Run et la réutilisation sur les Runs suivants sans amorce `ping` (`CASE-ADPT-05-5`).

---

## SPEC-ADPT-06 — Spécialisation opérationnelle Claude CLI

**Exigences :** `REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-18`, `R-28`, `R-38`, `R-40`, `C-12`  
**Statut :** proposé  
**Version :** v1.0 (2026-11-23, ajout de l'adaptateur Claude CLI per CR-005 / CR-013)  

### Règle

> L'adapter `claude-cli` (`cliId = 'claude-cli'`) est un adapter opérationnel embarqué dans ClientsBox.
> Le chemin vers le binaire du CLI Claude est résolu exclusivement à partir de la variable d'environnement `process.env.CLAUDE_CLI_BIN` via `resolveClaudeCliBin()`.
> Si `CLAUDE_CLI_BIN` n'est pas définie ou pointe vers un fichier inexistant ou non exécutable, le démarrage ou l'exécution échoue immédiatement avec un diagnostic explicite en français renvoyant vers `env/.env.example`.
> `CLAUDE_CLI_BIN` désigne le binaire exécutable Claude Code (`claude` / `claude.exe`).
> `buildCommand` génère la commande non interactive headless en utilisant les drapeaux `--print`, `--output-format stream-json`, `--verbose`, `--include-partial-messages`, et le contournement de confirmation d'outils `--dangerously-skip-permissions` :
> - Si `ctx.sessionId` est fourni et non vide (après `trim()`), `buildCommand` insère l'option exclusive `--resume` : `['--resume', ctx.sessionId.trim(), '--print', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--dangerously-skip-permissions', ...(ctx.model ? ['--model', ctx.model.trim()] : []), ctx.assembledPrompt]`.
> - Si `ctx.sessionId` est absent ou vide, `buildCommand` génère la commande initiale (sans `--resume` ni `--session-id`) : `['--print', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--dangerously-skip-permissions', ...(ctx.model ? ['--model', ctx.model.trim()] : []), ctx.assembledPrompt]`.
> Positionne `cwd` sur `ctx.workspacePath`.
> `extractSessionId(line: string)` permet la capture dynamique et paresseuse (*lazy capture*) de l'identifiant `session_id` dès la première ligne JSONL émise lors du premier Run de l'agent (`{"type":"system","subtype":"init","session_id":"..."}`), sans nécessiter d'amorce préalable ni de prompt artificiel `ping`. Ce `session_id` est enregistré dans la table de session du scénario (`ScenarioSessionRegistry`) et réutilisé par les Runs suivants de cet agent (`--resume <sessionId>`). Un bloc `ClearContext` efface cet identifiant de la mémoire vive pour amorcer un nouveau fil conversationnel au Run suivant.
> `createSession` reste disponible comme méthode de conformité d'interface ouvrant une session conversationnelle native Claude en exécutant un processus d'amorce stream-json (`probeClaudeSession`). Dès la détection du champ `session_id` dans l'événement d'initialisation, elle capture cet identifiant, attend la terminaison ordonnée du sous-processus et résout la promesse avec cet UUID. En cas de dépassement du délai d'attente (`CLAUDE_PROBE_TIMEOUT_MS`, défaut 15 000 ms), elle rejette avec un diagnostic explicite en français.
> `listModels` énumère la liste des modèles officiels supportés par Claude Code (`sonnet`, `opus`, `haiku`, `fable`, `claude-sonnet-4-5-20250929`, `claude-opus-4-5-20251101`, `claude-haiku-4-5-20251001`). Les modèles sont mis en mémoire vive via un cache LRU multi-domaines avec TTL (`ADR-016`). En cas d'erreur ou d'absence du binaire, elle renvoie un tableau vide `[]` sans lever d'exception.
> `parseStreamLine` décode les lignes JSONL produites par `--output-format stream-json --verbose --include-partial-messages` :
> - Si l'événement est de type `stream_event` et que son sous-événement est `content_block_delta` avec `delta.type === 'text_delta'` (ou `delta.text`), le fragment textuel est converti en événement `{ type: 'stdout', chunk: delta.text }`.
> - Si l'événement est de type `assistant` et contient `message.content`, les blocs textuels sont extraits en `{ type: 'stdout', chunk: text }`.
> - En cas de texte brut, de ligne non reconnue ou de JSON malformé, elle renvoie sans exception `{ type: 'stdout', chunk: line }`.
> `parseOutput(rawOutput: string)` parse la sortie brute accumulée émise par Claude CLI (lignes JSONL) et en extrait strictement le texte consolidé écrit par l'agent. Les métadonnées et événements de contrôle techniques (`system`, `user`, `tools`, `mcp_servers`, `result`) sont totalement exclus du résultat pour garantir l'intégrité des conditions et du SAC. Si la sortie ne contient aucun JSON ou est en texte brut, le texte est retourné sans altération.

### Portée

- Couvre la résolution et la validation de la variable d'environnement `CLAUDE_CLI_BIN`.
- Couvre la génération des arguments de commande pour l'exécution d'un prompt via Claude CLI, avec prise en charge du modèle (`--model`), de l'exécution headless non interactive (`--print`), du streaming JSONL (`--output-format stream-json --verbose --include-partial-messages`), du contournement des permissions (`--dangerously-skip-permissions`), et de la reprise de session (`--resume <sessionId>`).
- Couvre l'extraction dynamique de session conversationnelle (`extractSessionId`) au premier Run sans gaspillage de tokens, et l'amorce optionnelle ordonnée (`probeClaudeSession`).
- Couvre l'extraction et la normalisation stricte du texte de l'agent via `parseOutput()` pour alimenter le SAC et les blocs avals sans pollution JSON.
- Couvre l'énumération des modèles supportés via `listModels()` avec cache LRU.
- Couvre la normalisation des flux d'événements vers `AgentStreamEvent`.
- Ne couvre pas l'authentification interactive `claude login` (préalable utilisateur sur l'hôte).

### Scénarios nominaux

```gherkin
Scénario : Validation de la commande générée avec prompt et modèle sans session (1er Run)
  Étant donné un contexte d'exécution avec assembledPrompt "Analyse le composant" et model "sonnet" sans sessionId
  Quand "adapter.buildCommand(ctx)" est appelé
  Alors la commande contient les arguments "--print", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--dangerously-skip-permissions", "--model", "sonnet", "Analyse le composant"
  Et les arguments ne contiennent ni "--resume" ni "--session-id"
  Et cwd pointe sur ctx.workspacePath

Scénario : Validation de la commande de reprise avec sessionId existant (Runs suivants)
  Étant donné un contexte d'exécution avec assembledPrompt "Génère les tests", sessionId "session_01j83abc123" et model "opus"
  Quand "adapter.buildCommand(ctx)" est appelé
  Alors la commande contient les arguments "--resume", "session_01j83abc123", "--print", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--dangerously-skip-permissions", "--model", "opus", "Génère les tests"

Scénario : Extraction stricte de la réponse de l'agent via parseOutput
  Étant donné une sortie brute accumulée composée de multiples lignes JSONL Claude dont system/init, stream_event/content_block_delta avec text "Résultat calculé : 42" et result/success
  Quand "adapter.parseOutput(rawOutput)" est exécuté
  Alors le texte retourné est strictement "Résultat calculé : 42"
  Et toutes les métadonnées techniques JSON sont épurées

Scénario : Découverte des modèles supportés Claude avec mise en cache Node.js
  Étant donné le binaire Claude configuré
  Quand "adapter.listModels()" est exécuté pour la première fois
  Alors la liste des modèles officiels est retournée et mémorisée en cache LRU
  Et un appel subséquent retourne instantanément les données en mémoire vive sans spawn système

Scénario : Décodage résilient des événements du flux streaming JSONL
  Étant donné une ligne JSON '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Traitement en cours..."}}}'
  Quand "adapter.parseStreamLine(line)" est exécuté
  Alors un événement { type: 'stdout', chunk: 'Traitement en cours...' } est retourné
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Variable `CLAUDE_CLI_BIN` absente ou vide | Levée d'une erreur bloquante explicite en français renvoyant vers `env/.env.example`. |
| 2 | Binaire pointé par `CLAUDE_CLI_BIN` inexistant ou non exécutable | Diagnostic explicite avec indication du chemin défaillant. |
| 3 | Binaire indisponible lors de `listModels()` | Retour d'un tableau vide `[]` sans lever d'exception. |
| 4 | Flux stream ou sortie brute contenant du texte brut non JSON | Fallback gracieux retournant la chaîne brute textuelle sans altération. |
| 5 | Identifiant de modèle avec espaces superflus | Nettoyage via `trim()` avant injection dans `--model`. |
| 6 | Sortie de l'amorce fermée sans aucun `session_id` | Levée d'une erreur explicite en français. |
| 7 | Processus d'amorce se terminant avec un code de sortie non nul | Levée d'une erreur explicite mentionnant le code d'erreur. |
| 8 | Délai d'amorce dépassé (> `CLAUDE_PROBE_TIMEOUT_MS`) | Interruption du sous-processus et rejet de la promesse avec indication du dépassement de délai. |

### Critères d'acceptation

- [ ] `AC-ADPT-06-1` — `ClaudeCLIAdapter` implémente `CLIAdapter` avec `cliId = 'claude-cli'` (`CASE-ADPT-06-1`).
- [ ] `AC-ADPT-06-2` — `resolveClaudeCliBin` valide la présence physique et les permissions d'exécution de `CLAUDE_CLI_BIN` (`CASE-ADPT-06-2`).
- [ ] `AC-ADPT-06-3` — `buildCommand` génère la commande avec `--print`, `--output-format stream-json`, `--verbose`, `--include-partial-messages`, `--dangerously-skip-permissions`, `--model` optionnel et exclusion mutuelle de `--resume <sessionId>` (`CASE-ADPT-06-2`).
- [ ] `AC-ADPT-06-4` — `parseStreamLine` normalise les flux JSONL (`content_block_delta`, `assistant`) et le texte brut sans exception (`CASE-ADPT-06-3`).
- [ ] `AC-ADPT-06-5` — `listModels` énumère les modèles Claude supportés, met en mémoire cache Node.js avec TTL et bascule sur `[]` en cas d'anomalie (`CASE-ADPT-06-4`).
- [ ] `AC-ADPT-06-6` — `parseOutput` extrait strictement le texte écrit par l'agent depuis la sortie accumulée JSONL (`CASE-ADPT-06-3`).
- [ ] `AC-ADPT-06-7` — `extractSessionId` permet la capture dynamique de `session_id` dès la première ligne au 1er Run et la réutilisation sur les Runs suivants sans amorce préalable (`CASE-ADPT-06-5`).



