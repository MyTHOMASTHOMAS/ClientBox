# Cahier des charges — ClientsBox

**Équipe :** Autrement  
**Version :** v2.4 — 23/11/2026 (projet **ClientsBox**) — amendement **CR-013 / CR-005** de la v2.3 (20/11/2026)  
**Sources :** cadrage direct du porteur ; `tdd/docs/cdc/archived/cahier-des-charges-v2.3.md` (base intacte) ; analyse d'impact `tdd/docs/impact/impact-CR-013-claude-cli-adapter.md` ; entretien `tdd/docs/cr/CR-005.md` (ainsi que `CR-001..004` et `impact-CR-009..012` consolidés en v2.3).  
**Statut :** **archivé** (remplacé par CDC v2.5, conservé intact pour traçabilité historique).  
**Amendements v2.4 :**
- **CR-013 / CR-005 (Intégration opérationnelle de l'adaptateur Claude CLI `claude-cli`) :**
  - Ajout du support officiel d'un **quatrième adaptateur opérationnel embarqué** : **Claude CLI** (`claude` / Claude Code v2.1+) sous l'identifiant technique `claude-cli` (**REQ-008**, **REQ-013**, **REQ-029**, **R-04**, **R-28**).
  - La variable d'environnement **`CLAUDE_CLI_BIN`** devient le **4ᵉ binaire d'agent obligatoire au démarrage** de ClientsBox (**REQ-031**, **REQ-112**, **R-40**, **R-50**), contrôlé et résolu exclusivement via `src/lib/process/env/` (`SPEC-ARCH-03`).
  - Spécification de la commande d'exécution non interactive headless :
    - 1er Run (sans session) : `claude --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions [--model <model>] "<assembledPrompt>"`.
    - Runs subséquents : `claude --resume <sessionId> --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions [--model <model>] "<assembledPrompt>"`.
    - Exclusion mutuelle stricte : `--resume` n'est injecté que si `ctx.sessionId` est défini. Aucun `--session-id` n'est injecté sur la CLI.
  - Cycle de vie et capture de session par capture paresseuse (*lazy capture*) : extraction au vol de `session_id` dès la 1ʳᵉ ligne JSONL d'initialisation (`{"type":"system","subtype":"init","session_id":"..."}`) sans ping ni amorce préalable au runtime (0 surcoût token/latence). Rôle de `createSession` avec `CLAUDE_PROBE_TIMEOUT_MS` (défaut : 15 000 ms) pour conformité du contrat hors scénario.
  - Décodage temps réel streaming (`parseStreamLine`) sur `--output-format stream-json --verbose --include-partial-messages` et normalisation stricte de la réponse finale textuelle (`parseOutput`) pour alimenter le SAC (`BlockMessage.value`), purgeant toute métadonnée JSON avant transmission aux blocs `If` et `exit`.
  - Énumération et découverte des modèles d'IA supportés (`listModels`) protégée par cache mémoire LRU avec TTL (`ADR-016`).
  - Intégration complète à l'IHM (`AgentFormModal`, `ui.types.ts`), inclusion de `'claude-cli'` dans `TECH_ALLOW_LIST` (`src/ui/i18n/fr.i18n.ts`), et mise à jour de la documentation utilisateur (`docs/deploy/configuration.md`, `docs/instructions/**`, `.agents/docs/`).

**Rappel des amendements v2.3 consolidés :**
- **CR-012 (Rectification de R-07 — Prompt d'ordre de sortie `exit`) :** Abrogation de la dérive d'implémentation par « matchers » (`substring` / `regex`) qui interrompait prématurément les sous-processus CLI en cours de génération. Rétablissement sans ambiguïté du contrat d'origine (**R-07**, **R-22**, **R-45**, **REQ-017**, **REQ-032**) : une ressource `exit` (`.agents/data/exit/<id>.json`, schéma `{ id, name, content }`) est un **prompt d'ordre de sortie** additionné à la suite du prompt de mission d'un bloc `Run` lorsqu'`exitId` est défini. Le processus CLI s'exécute jusqu'à sa **terminaison naturelle**, et l'évaluation du marqueur renvoyé (ex. `TERMINER` vs `CONTINUE`) relève exclusivement des blocs `If` en aval (**R-14**, **R-15**).

**Rappel des amendements v2.2 consolidés :**
- **CR-009 :** Mode d'exécution CLI Headless autonome via `--exec-scene <cible>` (**REQ-044**, **R-48**, nuance de **REQ-001**, **REQ-002**, **REQ-004**).
- **CR-010 :** Navigation spatiale Canvas Studio avec déplacement (Pan) par agrippement du fond et zoom continu molette centré au curseur (**REQ-045**, **R-49**, extension de **REQ-014**).
- **CR-011 :** Chargement dynamique des variables d'environnement au runtime avec emplacement par défaut `env/.env` (résilient si absent) et support de `-e` / `--env <path>` (strict, erreur fatale si absent) (**REQ-046**, **R-50**).
- **Découplage de build & Prérequis Runtime :** les binaires CLI d'agents sont obligatoires au **runtime exclusif** (**REQ-031**, **REQ-112**), suppression de l'injection statique `define` de Vite (livrable `dist/clientsbox.js` 100 % autonome et portable au runtime, **REQ-108**). Priorité de configuration du port HTTP : flag CLI `-p` > variable `PORT` > défaut 2974.

Ce document formalise le **problème compris** et le **contrat d'usage**. Les détails d'implémentation UI (frameworks) restent hors CDC. Le **contrat d'adapter** (`ExecutionContext`, `AgentStreamEvent`, `CLIAdapter`, `buildCommand`, `parseStreamLine`, `parseOutput`, `extractSessionId`) est figé dans les **ADR** (voir `tdd/docs/adr/`) ; l'Annexe D rappelle l'intention et les messages (`D.2`). Les schémas fins (`value`, enums profil) restent en **specs**.

---

## 1. Contexte

Le porteur du besoin est un développeur qui utilise des agents CLI (aujourd'hui **cursor-cli**, **antigravity**, **codex-cli** et **claude-cli** / Claude Code) pour automatiser ou assister des tâches de développement au sein d'un dépôt. Chaque CLI a ses propres commandes, options, gestion de session / mémoire / conversation. Le besoin n'est pas de remplacer ces CLI, mais de les **adapter à son usage** : les piloter de façon homogène depuis un même outil.

**ClientsBox** est, en premier lieu, un **wrapper de commandes CLI** : l'application orchestre des invocations CLI derrière une interface unifiée. Au-dessus de ce wrapper, l'utilisateur compose des **scénarios** par blocs (Start / Run / If / ClearContext / CallScenario / Command), avec des ressources (agents, profils, prompts, exit, **if**/conditions, scenarios) réutilisables et versionnées dans le projet (typiquement sous `.agents/`).

ClientsBox propose deux modes de fonctionnement complémentaires :
1. **Mode Serveur & IHM Web (défaut) :** démarre un serveur HTTP local et expose le Studio Nodial dans le navigateur pour l'édition graphique et l'exécution interactive.
2. **Mode Headless Console (`--exec-scene`) :** exécute directement un scénario en streaming dans le terminal sans interface graphique ni serveur web, idéal pour les scripts bash et les pipelines d'automatisation CI/CD.

L'outil est distribué comme une application **standalone** : un fichier JavaScript unique précompilé (`clientsbox.js`), copié dans le projet hôte (sous `.agents/`). Sa configuration d'environnement est **100 % dynamique au runtime** : le binaire est totalement agnostique de la machine de build, lit sa configuration dans `env/.env` ou via l'option `-e <chemin>`, et s'exécute sous Node ≥ 24 avec une interface et des messages en **français**.

---

## 2. Problème

Aujourd'hui, l'enchaînement d'invocations d'agents CLI se fait de façon manuelle ou ad hoc. Chaque CLI s'utilise avec sa propre syntaxe et sa propre gestion de contexte. Il n'existe pas, dans le projet, de moyen simple et durable de :

- **wrapper** les commandes CLI derrière un usage homogène adapté au porteur ;
- brancher un nouveau type de CLI (comme `claude-cli`) sans réécrire l'orchestration ni les blocs ;
- visualiser, naviguer (pan et zoom) et composer des suites de tâches denses sur un canvas ;
- exécuter des scénarios indifféremment depuis une interface visuelle ou directement en console (headless) ;
- configurer et déployer le binaire sans devoir le recompiler pour chaque machine hôte ;
- brancher le flux selon une condition sur la sortie précédente ;
- démarrer plusieurs branches / CLI en parallèle depuis un point d'entrée unique ;
- conserver un contexte d'agent entre scénarios et redémarrages, sauf effacement volontaire ;
- suivre en direct ce qui se passe via un terminal dans l'interface ou en streaming console.

---

## 3. Objectifs

| # | Objectif | Comment on saura que c'est atteint |
|---|---|---|
| 1 | Lancer localement ClientsBox en mode serveur ou console headless | Mode serveur : serveur local (port 2974 ou configuré) avec URL console ; Mode headless (`--exec-scene`) : exécution autonome en direct dans le terminal sans serveur HTTP |
| 2 | Wrapper les CLI derrière un usage unifié | Les blocs pilotent le CLI via un adapter, sans syntaxe brute dans le canvas |
| 3 | Disposer d'un système d'adapters embarqués | Contrat d'adapter figé **ADR-002** / cursor-cli **ADR-003** / codex-cli / claude-cli ; intention Annexe D / R-29 |
| 4 | Gérer CLI, agents et profils | Menu CLI (4 adaptateurs : cursor-cli, antigravity, codex-cli, claude-cli) ; agents liés à un CLI ; chaque agent a un profil ; un profil peut servir plusieurs agents |
| 5 | Composer / rejouer des scénarios | Canvas sur modèle de blocs modulable (0..N entrées/sorties + params statiques) ; Start/Run/If/ClearContext/CallScenario/Command ; composition scénario→scénario ; commandes shell OS via Command |
| 6 | Naviguer confortablement sur des scénarios étendus | Déplacement libre (Pan) par agrippement clic gauche du fond et Zoom centré molette de 25 % à 200 % |
| 7 | Configuration 100 % dynamique et portable au runtime | Chargement par défaut depuis `env/.env` (résilient si absent) ou via `-e` / `--env` (strict), sans variables figées au build |
| 8 | Persister configuration et contextes | Sous `data/` ; contexte agent survit aux scénarios et redémarrages jusqu'à effacement explicite |
| 9 | Suivre et contrôler l'exécution | Terminal UI live en mode serveur ou flux console streaming en mode headless ; stop d'urgence propre |

---

## 4. Parties prenantes

| Partie prenante | Rôle | Ce qu'elle attend | Utilise l'application ? |
|---|---|---|---|
| Porteur / développeur-opérateur | Définit le besoin, crée et exécute les scénarios | Wrapper fiable, adapters (4 CLI supportés), canvas avec pan/zoom, exécution CLI headless, portabilité d'environnement | oui |
| Coéquipiers du dépôt (éventuels) | Réutilisent ou adaptent les scénarios | Fichiers `data/` lisibles, binaire copiable sans recompilation | oui |
| Agents CLI (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`) | Exécutent via leur CLI natif | Invoqués uniquement via leur adapter | non |
| Adapters CLI | Traduisent le contrat ClientsBox → CLI | Compatibilité blocs ↔ CLI | non (interne) |

---

## 5. Personas

### Alex — développeur-opérateur local
- **Contexte d'usage :** lance ClientsBox depuis la racine voulue du projet (`cwd` = racine de travail), ouvre l'IHM web pour concevoir ses graphes nodiaux avec confort grâce au pan/zoom, configure des agents sur l'un des 4 adaptateurs disponibles (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`), ou exécute directement ses chaînes en batch avec `node clientsbox.js --exec-scene <id>`. Il configure son environnement via `env/.env` ou `-e <chemin>` sans avoir à rebuilder le binaire.
- **Objectif :** wrapper ses CLI d'assistance de manière homogène, automatiser ses flux et désactiver les logs si souhaité via `LOGS_DISABLED=true`.

### Sam — coéquipier lecteur / contributeur
- **Contexte d'usage :** récupère le binaire `clientsbox.js` du dépôt, crée son fichier `env/.env` local avec les chemins de ses binaires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`), lance un scénario en ligne de commande ou inspecte les fichiers sous `data/`.
- **Objectif :** exécuter les scénarios partagés sans barrière de configuration technique ni recompilation.

---

## 6. Périmètre

### Dans le périmètre

- **ClientsBox** : wrapper CLI + scénarios par blocs ; TypeScript ; Node ≥ 24 ; UI et messages en **français**.
- **Deux modes de lancement :**
  1. **Mode Serveur (défaut) :** serveur HTTP local ; lien affiché dans le terminal OS ; port résolu par ordre : option `-p` / `--port`, variable `PORT`, valeur par défaut **2974** ; **échec** immédiat si port occupé (`R-35`, `REQ-005`).
  2. **Mode Headless direct (`--exec-scene <cible>`) :** résolution du scénario par identifiant `id` puis repli insensible à la casse sur `name` ; exécution directe sans serveur HTTP ; streaming console des sorties brutes et marqueurs de cycle de vie (`Option B`) ; codes d'arrêt normalisés (`0` succès, `1` erreur / scénario introuvable, `130` SIGINT) (`REQ-044`, `R-48`).
- **Configuration d'environnement dynamique :**
  - Chargement par défaut depuis `env/.env` relatif au workspace (`workspacePath`). Si absent, aucune erreur : utilisation de `process.env` existant.
  - Option CLI explicite : `-e <chemin>`, `--env <chemin>`, `--env=<chemin>`. Si le fichier indiqué n'existe pas : **arrêt fatal immédiat** avec message explicite (`REQ-046`, `R-50`).
  - Validation stricte des **4 binaires CLI d'agents obligatoires** (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**, **`CLAUDE_CLI_BIN`**) au runtime lors du démarrage. Arrêt fatal immédiat avec message explicite en français et renvoi vers `env/.env.example` si l'un quelconque est absent, vide ou non exécutable.
  - Assignation des valeurs par défaut pour les options non fournies (`PORT=2974`, `HOST=127.0.0.1`, `AGENTS_DIR=.agents`, `LOGS_DISABLED=false`, etc.).
  - Prise en compte immédiate de `LOGS_DISABLED=true` dès le démarrage.
- **Quatre adaptateurs opérationnels embarqués :**
  - `cursor-cli` (`SPEC-ADPT-02`)
  - `antigravity` (`SPEC-ADPT-04`)
  - `codex-cli` (`SPEC-ADPT-05`)
  - `claude-cli` (`SPEC-ADPT-06`)
- **Livrable standalone portable :** un fichier JavaScript unique précompilé `dist/clientsbox.js`, sans variables injectées au build via `define` (`REQ-108`).
- **Racine projet / workspace** = répertoire depuis lequel la commande de démarrage du service a été lancée (`cwd`).
- **Navigation spatiale sur le Canvas :**
  - Déplacement (Pan) libre par clic gauche maintenu sur le fond vide du canvas (`cursor: grab` / `grabbing`). Les coordonnées des blocs dans le scénario restent invariantes (`R-49`, `REQ-045`).
  - Zoom / Dézoom continu par molette (`wheel`) centré sur la position instantanée du curseur, borné entre **0.25x (25 %)** et **2.0x (200 %)**, avec valeur nominale à **1.0x (100 %)** (`REQ-045`).
  - Isomorphisme mathématique : câblage et déplacement individuel de blocs d'une précision absolue à n'importe quelle échelle de zoom.
- **Persistance sous `.agents/data/`** : `agents/`, `profils/`, `prompts/`, `exit/` (prompts d'ordre de sortie `{ id, name, content }`), `if/`, `scenarios/`.
- **Modèle de blocs modulable (6 types) :** **Start**, **Run** (assemblage additif `profil` + `prompt` + `exit` optionnel ; exécution jusqu'à fin naturelle du CLI), **If**, **ClearContext**, **CallScenario**, **Command**.
- **Join, Power, Pause :**
  - `power` = courant dans le câble (v1 : 1 partout sauf If : branche prise = 1, branche non prise = 0).
  - Join : attendre un message sur chaque entrée câblée ; exécuter ssi `N ≥ 1` et `sum(power) === N` ; sinon pause / attente mise à jour.
  - Cas N = 0 entrées (hors Start) : pas de démarrage du bloc et aucune émission en sortie.
- **Stop d'urgence propre :** bouton UI Stop ou `Ctrl+C` console déclenchant l'escalade SIGTERM/SIGKILL pour libérer tous les processus actifs sans détruire les sessions agent.

### Hors périmètre

| Élément écarté | Motif |
|---|---|
| Cascade multi-fichiers d'environnement (`.env.local`, `.env.test`, `.env.production`) | Non requis : simplicité et déterminisme avec un seul fichier (`env/.env` ou `-e`) |
| Rechargement à chaud (hot-reload) des fichiers d'environnement | Nécessite un redémarrage standard de ClientsBox |
| Minimap de navigation sur le Canvas | Réservé pour une version ultérieure |
| Gestes tactiles avancés multitouch (pinch-to-zoom tablette) | Hors scope initial (événements standard souris/molette) |
| Remplacer les CLI tiers | ClientsBox wrappe et adapte |
| Passage de paramètres métier parent ↔ enfant via CallScenario | Hors scope V1 de la feature (power only) |
| Interruption prématurée d'un agent CLI par filtrage temps réel (matchers `substring`/`regex` sur `stdout`/`stderr`) | Contraire à `R-07` : `exit` est un ordre de sortie additionné au prompt, l'agent va jusqu'à sa fin naturelle et les blocs `If` évaluent la réponse finale |
| Visualisation de l'état interne d'un scénario enfant sur son propre canvas | Hors scope V1 de la feature (REQ-040) |
| Historique fichier des exécutions sous `data/` | Pas en v1 |

---

## 7. Contraintes

| # | Contrainte | Nature |
|---|---|---|
| 1 | Runtime Node ≥ 24 ; application écrite en TypeScript | technique |
| 2 | Standalone ClientsBox, copie manuelle ; JS précompilé unique portable sans variables figées au build | stratégique |
| 3 | Usage typique sous `.agents/` ; données sous `data/` | métier |
| 4 | Serveur local (en mode serveur) ; port 2974 par défaut ; surchargeable via CLI `-p`/`--port` ou variable `PORT` | technique |
| 5 | Lien d'accès affiché dans le terminal OS au démarrage du serveur | métier |
| 6 | UI et messages d'erreur en **français** | métier |
| 7 | Workspace = `cwd` de la commande de démarrage du service | métier |
| 8 | Un fichier par ressource ; formats homogènes par type | métier |
| 9 | Ressource **`if`** = fichier **JavaScript** (`data/if/<nom>.js`, `if(sac) → bool`) — les autres = JSON | métier |
| 10 | Sortie = `blockMessage` `{ blockType, value, power }` ; entrée = sac `{ [key]: blockMessage }` | métier |
| 11 | Mono-utilisateur local ; pas d'auth ; pas de sandbox | stratégique |
| 12 | Adapters embarqués ; les **4 binaires CLI des agents** (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**, **`CLAUDE_CLI_BIN`**) obligatoires au **runtime** (au lancement de ClientsBox) | métier |
| 13 | ClientsBox ne remplace pas les CLI tiers | stratégique |
| 14 | Schémas `value` des payloads → specs | métier |
| 15 | Exécution (hors Start) ssi **`N ≥ 1`**, join complet et `sum(power) === N` ; si **N = 0** → pas d'exécution | métier |

---

## 8. Règles métier

| # | Règle |
|---|---|
| R-01 | Une ressource (agent, profil, prompt, exit, **if**, scenario) = **un fichier** dans son dossier `data/`. La ressource **`if`** est en **JS** (R-14), les autres en JSON. |
| R-02 | Même type de ressource ⇒ même format de lecture (JSON pour agent/profil/prompt/exit/scenario ; **JS** pour `if`). |
| R-03 | Un agent est rattaché à **un** CLI. |
| R-04 | Menu CLI = adapters opérationnels uniquement ; en standard, les **4 CLI sont embarqués** (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`). |
| R-05 | Un **agent a exactement un profil** ; un **profil peut être associé à plusieurs agents**. |
| R-06 | Un profil définit le prompt initial et une politique d'envoi (**chaque prompt**, **début de scénario**, **une fois jusqu'à clear**). |
| R-07 | Un prompt `exit` (`data/exit/<id>.json`, schéma `{ id, name, content }`) définit l'ordre de sortie additionné à la fin du prompt d'un bloc `Run` (lorsqu'`exitId` est renseigné) afin d'indiquer à l'agent ce qu'il doit renvoyer en fin de tâche pour alimenter la sortie du bloc (payload). Il ne surveille pas le flux et n'interrompt jamais prématurément le processus CLI. |
| R-08 | **Modèle de bloc de base** : 0..N ports d'entrée, 0..N ports de sortie, et paramètres statiques de configuration. |
| R-09 | Port d'entrée (flux / join) ≠ lecture dynamique du contenu du sac. |
| R-10 | Message de sortie = `{ blockType, value, power }` (sans key). |
| R-10b | `power` (nombre) = courant. V1 : **1** partout sauf **If** (famille prise = 1, famille non prise = 0). |
| R-11 | Messages d'entrée d'un bloc = sac `{ [key]: blockMessage }`. |
| R-12 | Key par défaut sur connexion d'entrée = séquentiel numérique `0`, `1`, `2`… |
| R-13 | Key personnalisée unique par clic ; collision refusée sur le même bloc cible. |
| R-14 | Condition If = `data/if/<nom>.js` exposant `if(sac) → bool`. |
| R-15 | If : 1..N entrées ; lit le sac ; deux familles de sorties (prise : power 1 ; non prise : power 0). |
| R-16 | Scénario = graphe nodial stocké dans `data/scenarios/*.json`. |
| R-17 | Ressources et scénarios modulaires, réutilisables, versionnables avec le projet. |
| R-18 | Toute invocation CLI passe par un adapter embarqué (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`). |
| R-19 | **Un seul** bloc Start par scénario. |
| R-20 | Start : 0 entrée ; N sorties ; départ immédiat au lancement. |
| R-21 | Pas de bloc End dédié ; Run ou autre peut être un endpoint (0 sortie). |
| R-22 | Run : params statiques agent/prompt/exit optionnel (`exitId`) ; 0..N entrées ; exécution ssi `N ≥ 1` et `sum(power)===N` ; N=0 → pas d'exécution ; attend la terminaison naturelle du processus CLI et émet la sortie complète en power 1. |
| R-23 | Sans effacement explicite, l'agent reste dans le même contexte. |
| R-24 | Maintien et persistance de session délégués à l'adapter. |
| R-25 | Erreur d'exécution ⇒ arrêt global du scénario racine et affichage des erreurs. |
| R-26 | Terminal UI = vue live temporaire non persistée. |
| R-27 | ClientsBox = wrapper unifié ; l'adapter construit la commande native du CLI. |
| R-28 | CLI listé uniquement si son adapter embarqué est opérationnel. |
| R-29 | Contrat adapter v1 : `buildCommand` + `parseStreamLine` + `parseOutput` + `extractSessionId` (ADR-002 / ADR-003 / ADR-016). |
| R-30 | Effacement de contexte via bloc ClearContext ou action manuelle dans le menu agent. |
| R-31 | Le contexte survit aux scénarios et redémarrages tant que l'adapter le persiste. |
| R-32 | Destruction de contexte externe hors ClientsBox : hors responsabilité. |
| R-33 | Plusieurs Run parallèles sur le même agent = même contexte (concurrence gérée par l'utilisateur). |
| R-34 | Stop = kill processus + arrêt scénario ; session conservée. Stop disponible en pause. Interrompt scénario racine, enfants CallScenario et commandes Command. |
| R-35 | Port occupé en mode serveur ⇒ échec immédiat du démarrage. |
| R-36 | Ressources éditables UI et fichiers. |
| R-37 | Pas d'historisation fichier des exécutions en v1. |
| R-38 | Adapters embarqués dans le code source. |
| R-39 | ClearContext : param agent ; join puis exécution ssi `N ≥ 1` et `sum(power)===N` ; émet power 1. |
| R-40 | Binaires des **4 CLI d'agents requis au runtime** via **`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`** et **`CLAUDE_CLI_BIN`** (contrôle d'existence et exécutabilité au lancement). |
| R-41 | Schémas détaillés `value`, sessions et enums profil formalisés en specs. |
| R-42 | Entrées câblées (N ≥ 1) ⇒ join : attendre un message sur chaque entrée câblée. |
| R-42b | Exécution ssi `N ≥ 1` et `sum(power) === N` ; sinon pause / attente mise à jour. |
| R-42c | Start : 0 entrée ; départ immédiat sans condition de power d'entrée. |
| R-42d | Hors Start : N = 0 entrées câblées ⇒ pas d'exécution et pas d'émission de power. |
| R-43 | Suppression d'entrée : renumérotation automatique des keys numériques ; keys custom préservées. |
| R-44 | Keys portées exclusivement par les connexions d'entrée. |
| R-45 | Assemblage complet du prompt textuel (`systemPrompt` selon politique + `prompt.content` + `exit.content` si `exitId` est défini) réalisé par ClientsBox avant l'appel à l'adapter. |
| R-46 | CallScenario : param `targetScenarioId` ; 1..N entrées / 0..N sorties ; exécute le sous-scénario in-process ; échec enfant ⇒ échec bloc ; profondeur max via `CALL_SCENARIO_MAX_DEPTH`. |
| R-47 | Command : param `commandLine` ; 1..N entrées / 0..N sorties ; exécute commande shell OS avec `cwd = workspacePath` ; exit 0 ⇒ power 1 ; exit ≠ 0 ⇒ échec bloc (R-25). |
| **R-48** | **Cycle de vie et codes d'arrêt de l'exécution CLI Headless (`--exec-scene`) :** en présence de `--exec-scene <cible>`, aucun serveur HTTP n'est démarré ; les flux des blocs sont diffusés en direct sur `stdout`/`stderr` avec marqueurs de cycle de vie ; terminaison avec code `0` en cas de succès, `1` en cas d'erreur ou scénario introuvable, et `130` en cas d'interruption `SIGINT` (Ctrl+C) avec arrêt d'urgence propre de tous les processus fils actifs. |
| **R-49** | **Invariance des coordonnées nodiales lors du déplacement (Pan) et du zoom :** la translation de la caméra (`pan.x`, `pan.y`) et le facteur d'agrandissement (`zoom`) modifient uniquement la matrice d'affichage visuelle du canvas sans jamais modifier les coordonnées intrinsèques persistées `position.x` et `position.y` des blocs du scénario. |
| **R-50** | **Validation et initialisation de configuration d'environnement au runtime :** chargement automatique de `env/.env` s'il existe (résilience totale : aucune erreur si absent, repli sur `process.env`) ; arrêt fatal immédiat si le fichier spécifié par `-e` / `--env` est inexistant sur le disque ; validation stricte des **4 binaires d'agents obligatoires** (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**, **`CLAUDE_CLI_BIN`**) au runtime ; application automatique des valeurs par défaut pour les options non fournies (`PORT=2974`, `HOST=127.0.0.1`, `AGENTS_DIR=.agents`, `LOGS_DISABLED=false`, etc.). |

---

## 9. Exigences fonctionnelles

| ID | Exigence | Priorité | Persona |
|---|---|---|---|
| REQ-001 | Au démarrage en mode serveur (par défaut), démarrer un serveur HTTP local et rendre l'UI accessible dans un navigateur. En mode `--exec-scene`, aucun serveur HTTP n'est démarré. | Must | Alex |
| REQ-002 | Port configurable : priorité 1 au flag CLI `-p` / `--port`, priorité 2 à la variable d'environnement `PORT`, priorité 3 à la valeur par défaut 2974. | Must | Alex |
| REQ-003 | Lancement via Node ≥ 24 du livrable standalone JavaScript unique (`clientsbox.js`). | Must | Alex |
| REQ-004 | En mode serveur, afficher le lien d'accès `http://localhost:PORT` dans le terminal OS. En mode `--exec-scene`, diffuser le streaming d'exécution du scénario. | Must | Alex |
| REQ-005 | En mode serveur, si le port d'écoute est occupé (`EADDRINUSE`), échouer immédiatement avec un message clair en français. | Must | Alex |
| REQ-006 | Utiliser comme `workspacePath` le répertoire courant (`cwd`) de la commande de démarrage. | Must | Alex |
| REQ-007 | UI et messages d'erreur en **français**. | Must | Alex |
| REQ-008 | Menu listant les 4 CLI dont l'adapter est embarqué et opérationnel (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`). | Must | Alex |
| REQ-009 | CRUD agents rattachés à un CLI (UI + fichiers). | Must | Alex |
| REQ-010 | Chaque agent référence un profil ; un profil peut être utilisé par plusieurs agents. | Must | Alex |
| REQ-011 | CRUD profils, prompts, exit, scenarios (UI + fichiers) ; gestion des scripts JS `if`. | Must | Alex |
| REQ-012 | Conditions If sous `data/if/` listées dans l'éditeur ; éditables hors UI. | Must | Alex |
| REQ-013 | En v1, **4 adapters embarqués opérationnels** (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`), chacun vérifié au lancement. | Must | Alex |
| REQ-014 | Éditeur graphique Canvas nodial (positions + connexions persistées) supportant la navigation spatiale continue (Pan et Zoom). | Must | Alex |
| REQ-015 | Exactement un Start par scénario ; 0 entrée, N sorties ; départ immédiat. | Must | Alex |
| REQ-016 | Moteur de blocs fondé sur un modèle de base modulable (0..N in, 0..N out, params statiques). | Must | Alex |
| REQ-017 | Bloc Run : params statiques agent/prompt/exit optionnel (`exitId`) ; join puis exécution jusqu'à fin naturelle du CLI ssi `N ≥ 1` et `sum(power)===N` ; N=0 → pas d'exécution. | Must | Alex |
| REQ-018 | Exécution Run via adapter ; transmission du `blockMessage` sous la key de la connexion d'entrée aval. | Must | Alex |
| REQ-019 | Bloc If : 1..N entrées ; reçoit le sac ; `if(sac)` ; branche prise = power 1 ; non prise = power 0. | Must | Alex |
| REQ-020 | Bloc ClearContext : param agent ; join puis exécution ssi `N ≥ 1` et `sum(power)===N` ; émet power 1. | Must | Alex |
| REQ-021 | Effacement manuel de contexte agent depuis l'interface. | Must | Alex |
| REQ-022 | Persistance de session gérée par l'adapter. | Must | Alex |
| REQ-023 | Politique d'envoi du profil : chaque prompt, début de scénario, une fois jusqu'à clear. | Must | Alex |
| REQ-024 | Terminal page : live temporaire sans persistance ; inspection de l'état du scénario racine. | Must | Alex |
| REQ-025 | Stop manuel = kill propre des processus + arrêt scénario ; session conservée ; disponible en pause. | Must | Alex |
| REQ-026 | Erreur d'exécution ⇒ arrêt global du scénario racine + affichage des erreurs. | Must | Alex |
| REQ-027 | Adapters conformes au contrat d'adapter (ADR-002). | Must | Alex |
| REQ-028 | Blocs indépendants de la syntaxe brute des CLI. | Must | Alex |
| REQ-029 | Adapters opérationnels : génération des commandes natives (`buildCommand`), streaming (`parseStreamLine`), nettoyage textuel (`parseOutput`) et session (`extractSessionId`). | Must | Alex |
| REQ-030 | Lancer un scénario depuis l'UI web. | Must | Alex |
| REQ-031 | **`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`** et **`CLAUDE_CLI_BIN`** obligatoires au **runtime** (au lancement de ClientsBox) ; arrêt avec message explicite renvoyant vers `env/.env.example` si l'un d'eux est manquant ou non exécutable. | Must | Alex |
| REQ-032 | Assemblage du prompt textuel complet (profil + mission + ordre de sortie `exit` optionnel) avant l'appel à l'adapter (R-07, R-45). | Must | Alex |
| REQ-033 | Keys sur connexions d'entrée : défaut numérique séquentiel ; custom unique par clic ; collision refusée. | Must | Alex |
| REQ-034 | Persister les keys de connexions dans le fichier scénario JSON. | Must | Alex |
| REQ-035 | Renumérotation automatique des keys numériques à la suppression d'une connexion ; keys custom préservées. | Must | Alex |
| REQ-036 | Sorties émettant uniquement un `blockMessage` avec power (sans key). | Must | Alex |
| REQ-037 | Moteur appliquant join, règle `sum(power)===N` et pause en cas de courant incomplet. | Must | Alex |
| REQ-038 | En v1, hors If, toute sortie de bloc émet power = 1. | Must | Alex |
| REQ-039 | Bloc CallScenario : param `targetScenarioId` ; 1..N in / 0..N out ; await sous-scénario in-process. | Must | Alex |
| REQ-040 | Sous-exécution CallScenario in-process ; état interne enfant non exposé sur canvas séparé en V1. | Must | Alex |
| REQ-041 | CallScenario : auto-appel autorisé ; profondeur max via `CALL_SCENARIO_MAX_DEPTH` (-1 = illimité). | Must | Alex |
| REQ-042 | Bloc Command : param `commandLine` ; 1..N in / 0..N out ; spawn shell OS ; exit 0 ⇒ power 1 ; exit ≠ 0 ⇒ erreur. | Must | Alex |
| REQ-043 | Command : `cwd = workspacePath` ; stdout/stderr relayés au terminal racine ; Stop racine interrompt le process. | Must | Alex |
| **REQ-044** | **Mode CLI Headless autonome :** support de l'option `--exec-scene <cible>` (et `--exec-scene=<cible>`). Résolution prioritaire par `id` puis repli insensible à la casse sur `name`. Streaming continu dans le terminal sans serveur HTTP. Codes de sortie système : 0 en succès, 1 en erreur / introuvable, 130 sur SIGINT. | Must | Alex |
| **REQ-045** | **Navigation spatiale Canvas (Pan & Zoom) :** déplacement par clic gauche maintenu sur le fond vide (`cursor: grab` / `grabbing`), zoom molette centré sur le curseur borné de 0.25x à 2.0x (défaut 1.0x). Précision et isomorphisme absolus du drag de blocs et du câblage de ports à toute échelle. | Must | Alex |
| **REQ-046** | **Chargement dynamique d'environnement au runtime :** chargement automatique de `env/.env` s'il existe (tolérant à l'absence, repli sur `process.env`). Support des flags CLI `-e <chemin>` / `--env <chemin>` / `--env=<chemin>` avec échec fatal immédiat si le fichier indiqué est inexistant. Validation des obligatoires et assignation des valeurs par défaut. Prise en compte immédiate de `LOGS_DISABLED=true`. | Must | Alex |

---

## 10. Exigences non fonctionnelles

| ID | Exigence | Comment on la vérifie |
|---|---|---|
| REQ-101 | Persistance fiable de `data/` et des contextes agent. | Relire après redémarrage ClientsBox |
| REQ-102 | Démarrage simple + URL dans le terminal OS (mode serveur). | Lancer et lire l'URL |
| REQ-103 | Nouvel adapter = code embarqué, sans changer le modèle des blocs. | Revue / adapter `claude-cli` |
| REQ-104 | Fichiers `data/` éditables à la main et versionnables. | Diff / commit |
| REQ-105 | Payloads inter-blocs stables pour un même scénario / mêmes données. | Rejouer les scénarios de test |
| REQ-106 | Mono-utilisateur, pas d'auth. | Aucun login |
| REQ-107 | Édition canvas non triviale (6 types de blocs supportés). | Scénario complexe multi-blocs |
| REQ-108 | Portabilité du livrable standalone : un seul fichier JS copiable, exécutable sur n'importe quel environnement sans rebuild. | Copie sur machine tierce + démarrage avec `env/.env` local |
| REQ-109 | Pas de sandbox. | Aucune couche sécurité exigée |
| REQ-110 | Live visible dans le terminal UI (mode serveur) ou terminal console (mode headless). | Run long + chunks temps réel |
| REQ-111 | Pas de journalisation fichier des exécutions en v1. | Aucun dossier logs requis |
| REQ-112 | Les **4 binaires CLI** (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**, **`CLAUDE_CLI_BIN`**) obligatoires au **runtime** : démarrage refusé avec erreur explicite si l'un quelconque est absent ou non exécutable. | Lancer sans l'une des 4 variables ou avec chemin invalide → message d'erreur clair renvoyant vers `env/.env.example` |

---

## 11. Questions ouvertes & Arbitrages actés

Décisions figées antérieures (CR-001, CR-008) :
- Renum keys vs scripts If : responsabilité utilisateur.
- Pause power + Stop d'urgence : disponible en pause pour débloquer l'exécution.
- CallScenario : multi-câbles 1..N in / 0..N out, power only, sous-exécution in-process, profondeur max paramétrable.
- Command : commande shell OS native dans le workspace, distincte de Run, exit ≠ 0 ⇒ erreur.

Décisions figées **CR-009** (CLI Exec Scene) :
- Zéro serveur HTTP ni socket réseau en mode `--exec-scene`.
- Streaming console temps réel (Option B validée).
- Codes de sortie normalisés : 0 (succès), 1 (erreur / introuvable), 130 (SIGINT).

Décisions figées **CR-010** (Canvas Pan & Zoom) :
- Pan par clic gauche maintenu sur fond vide (`grab` / `grabbing`).
- Zoom molette centré sur le curseur, borné entre 0.25x et 2.0x (nominal 1.0x).
- Invariance stricte des coordonnées persistées du scénario (`R-49`).

Décisions figées **CR-011** (Chargement dynamique d'environnement) :
- Fichier par défaut : `env/.env` (résilient si absent, repli transparent sur `process.env`).
- Fichier personnalisé : `-e <chemin>` / `--env <chemin>` (strict, échec fatal si inexistant).
- Découplage de build : suppression du baking `define` dans Vite, build autonome et portable.
- Résolution du port HTTP : CLI `-p` > `PORT` dans env > 2974.
- Désactivation effective des logs au démarrage si `LOGS_DISABLED=true`.

Décisions figées **CR-012** (Rétablissement du prompt d'ordre de sortie `exit` — `CR-004`) :
- Schéma de `data/exit/<id>.json` homogène avec `prompts/` : `{ id, name, content }` (abrogation totale des `matchers` `substring` / `regex`).
- Assemblage séquentiel côté moteur : `systemPrompt` (selon politique `R-06`) $\rightarrow$ `prompt.content` $\rightarrow$ `exit.content` (si `exitId` défini sur le bloc `Run`), séparés par `\n\n` sans saut parasite.
- Aucune surveillance temps réel de `stdout`/`stderr` ni `stop()` anticipé du sous-processus CLI : le bloc `Run` attend la terminaison naturelle du CLI et propage la réponse intégrale dans `BlockMessage.value`, l'évaluation conditionnelle (`TERMINER` / `CONTINUE`) étant assurée par les blocs `If` (`R-14`).

Décisions figées **CR-013 / CR-005** (Intégration opérationnelle de l'adaptateur Claude CLI `claude-cli`) :
- Identifiant technique canonique : `cliId = 'claude-cli'`.
- Résolution du binaire via la variable d'environnement `CLAUDE_CLI_BIN`, validée comme le **4ᵉ binaire obligatoire** au boot de ClientsBox sans fallback hasardeux sur le PATH (`SPEC-ARCH-03`, `SPEC-SRV-01`).
- Arguments non interactifs :
  - 1er Run (sans session) : `claude --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions [--model <model>] "<assembledPrompt>"`.
  - Runs subséquents : `claude --resume <sessionId> --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions [--model <model>] "<assembledPrompt>"`.
  - Exclusion mutuelle stricte : `--resume` n'est injecté que si `ctx.sessionId` est défini par le registre. Aucun `--session-id` n'est injecté sur la CLI.
- Cycle de vie et session conversationnelle : capture paresseuse (*lazy capture*) via `extractSessionId` dès le 1er Run interceptant l'événement initial `{"type":"system","subtype":"init","session_id":"..."}` pour enregistrement direct dans `ScenarioSessionRegistry` (0 prompt d'amorce au runtime). Méthode `createSession` avec `CLAUDE_PROBE_TIMEOUT_MS` (défaut : 15 000 ms) pour la conformité d'interface hors scénario.
- Streaming et normalisation : `parseStreamLine` décode en temps réel les fragments `content_block_delta` et `assistant` sans lever d'exception ; `parseOutput` extrait le texte consolidé pur de l'agent pour le SAC et les blocs avals (`If`, `exit`).
- Énumération des modèles : support des alias et identifiants officiels avec mémoisation en cache LRU (`ADR-016`) et repli sur `[]` en cas d'indisponibilité.
- Absence de token utilisateur sur l'hôte de test : harnais de tests unitaires et E2E s'appuyant rigoureusement sur des mocks locaux déterministes (`scripts/mock/mock-claude.*`).

---

## 12. Validation

| Version | Date | Statut | Retour |
|---|---|---|---|
| v1 | 17–18/09/2026 | brouillon ouvert | Cadrage initial ClientsBox |
| v1 (maj) | 18/09/2026 | brouillon ouvert | Power, pause, ClearContext \*/\* |
| v1 (maj) | 21/09/2026 | **verrouillé** | Démarrage suite ADR-001…005 |
| v2 | 06/10/2026 | **intact** | CR-001 — port défaut 2974 / Vitest |
| v2.1 | 13/11/2026 | **intact** | CR-008 — CallScenario + Command |
| v2.2 | 17/11/2026 | **intact** | CR-009 (exec-scene), CR-010 (pan-zoom), CR-011 (chargement dynamique d'environnement) |
| v2.3 | 20/11/2026 | **intact** | CR-012 — Rétablissement du prompt d'ordre de sortie `exit` (R-07, R-22, R-45) et abrogation de l'arrêt anticipé par matchers |
| v2.4 | 23/11/2026 | **intact** | CR-013 / CR-005 — Intégration opérationnelle de l'adaptateur Claude CLI `claude-cli` et du 4ᵉ binaire obligatoire `CLAUDE_CLI_BIN` |

---

## Annexe A — Arborescence cible des données

```text
.agents/
├── clientsbox.js
└── data/
    ├── agents/
    ├── profils/
    ├── prompts/
    ├── exit/
    ├── if/
    └── scenarios/
```

Configuration d'environnement au runtime :
- Fichier par défaut : `env/.env`
- Fichier modèle contractuel versionné : `env/.env.example`

## Annexe B — Modèle de blocs et messages

### B.1 — Bloc de base
0..N ports d'entrée, 0..N ports de sortie, paramètres statiques.

### B.2 — Messages
```text
blockMessage = { blockType, value, power }   // sortie, sans key
sac d'entrées = { [key]: blockMessage, ... }
```

### B.3 — Join, power, pause
1. Join : un message sur chaque entrée câblée pour N ≥ 1.
2. Si N ≥ 1 et `sum(power) === N` → exécuter.
3. Si N ≥ 1 et `sum(power) < N` → pause / attente mise à jour.
4. Si N = 0 (hors Start) → pas d'exécution ni d'émission.

### B.4 — Spécialisations des blocs
- **Start** : 0 in, N out (power 1).
- **Run** : 0..N in, 0..N out (power 1 ; prompt = profil + mission + ordre de sortie `exit` optionnel ; fin naturelle du CLI).
- **If** : 1..N in, 2 familles out (prise = power 1, non prise = power 0).
- **ClearContext** : 0..N in, 0..N out (power 1).
- **CallScenario** : 1..N in, 0..N out (power 1, sous-scénario in-process).
- **Command** : 1..N in, 0..N out (power 1, commande shell OS).

## Annexe C — Wrapper et adapters
```text
[ Canvas (Pan/Zoom) + keys + power ]
  -> [ Moteur : join / sum(power) / pause+maj ]
  -> [ CLIAdapter ] -> CURSOR_CLI_BIN / ANTIGRAVITY_CLI_BIN / CODEX_CLI_BIN / CLAUDE_CLI_BIN
```

## Annexe D — Contrat Adapter + messages

### D.1 — ExecutionContext / AgentStreamEvent / CLIAdapter
Interfaces et signatures → **ADR-002** (contrat) et **ADR-003** (cursor-cli).  
Binaires vérifiés au runtime via **`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`** et **`CLAUDE_CLI_BIN`** (R-40, REQ-031, REQ-112).

### D.2 — Messages
```typescript
export interface BlockMessage {
  blockType: 'start' | 'run' | 'if' | 'clearContext' | 'callScenario' | 'command' | string;
  value: unknown;
  power: number;
}

export type BlockInputBag = Record<string, BlockMessage>;
```

### D.3 — Politique d'envoi du profil
Modes différenciables (3) : **chaque prompt** (défaut), **début de scénario**, **une fois jusqu'à clear**.
