# Cahier des charges — ClientsBox

**Équipe :** Autrement  
**Version :** v2.1 — 13/11/2026 (projet **ClientsBox**) — amendement **CR-008** de la v2 (06/10/2026)  
**Sources :** cadrage direct du porteur ; `tdd/docs/cdc/cahier-des-charges-v2.md` (base intacte) ; analyse d'impact `tdd/docs/impact/impact-CR-008-call-scenario-block.md`  
**Statut :** **brouillon ouvert** — CDC v2.1 dérivé du CDC v2 (qui reste **intact**). Amendements v2.1 (**CR-008**) : typologie à **6** blocs (+ **CallScenario**, + **Command**) ; **R-25**, **REQ-024**, **REQ-025**, **REQ-026** précisées ; **R-46**, **REQ-039**…**041** (CallScenario) ; **R-47**, **REQ-042**, **REQ-043** (Command) ; Annexe B / D.2 étendues. Le socle join/power (R-42*) et le modèle de bloc de base (R-08) restent inchangés.

Ce document formalise le **problème compris** et le **contrat d'usage**. Les détails d'implémentation UI (frameworks) restent hors CDC. Le **contrat d'adapter** (`ExecutionContext`, `AgentStreamEvent`, `CLIAdapter`, `buildCommand`, `parseStreamLine`) est figé dans les **ADR** (voir `tdd/docs/adr/`) ; l'Annexe D rappelle l'intention et les messages (`D.2`). Les schémas fins (`value`, enums profil) restent en **specs**.

---

## 1. Contexte

Le porteur du besoin est un développeur qui utilise des agents CLI (aujourd'hui **cursor-cli**) pour automatiser ou assister des tâches de développement au sein d'un dépôt. Chaque CLI a ses propres commandes, options, gestion de session / mémoire / conversation. Le besoin n'est pas de remplacer ces CLI, mais de les **adapter à son usage** : les piloter de façon homogène depuis un même outil.

**ClientsBox** est, en premier lieu, un **wrapper de commandes CLI** : l'application orchestre des invocations CLI (d'abord Cursor) derrière une interface unifiée. Au-dessus de ce wrapper, l'utilisateur compose des **scénarios** par blocs (Start / Run / If / ClearContext / CallScenario / Command), avec des ressources (agents, profils, prompts, exit, **if**/conditions, scenarios) réutilisables et versionnées dans le projet (typiquement sous `.agents/`).

Pour que les blocs restent stables quel que soit le CLI sous-jacent, ClientsBox s'appuie sur un **système d'adapters embarqués** : un adapter par type de CLI traduit le contrat interne de ClientsBox vers les commandes et comportements propres à ce CLI. En v1, l'adapter cursor-cli reste **simple** : construire la requête Cursor et normaliser le flux de sortie.

L'outil est pensé comme une application **standalone** : une fois construite, elle se copie dans le projet hôte (emplacement typique : dossier `.agents/`), idéalement sous la forme d'**un seul fichier JavaScript précompilé** prêt à l'emploi, et s'utilise sans dépendre d'un service distant. L'interface est en **français**.

---

## 2. Problème

Aujourd'hui, l'enchaînement d'invocations d'agents CLI se fait de façon manuelle ou ad hoc. Chaque CLI s'utilise avec sa propre syntaxe et sa propre gestion de contexte. Il n'existe pas, dans le projet, de moyen simple et durable de :

- **wrapper** les commandes CLI derrière un usage homogène adapté au porteur ;
- brancher un nouveau type de CLI sans réécrire l'orchestration ni les blocs ;
- visualiser et composer des suites de tâches sur un canvas ;
- réutiliser de façon homogène des agents, profils, prompts et sorties ;
- brancher le flux selon une condition sur la sortie précédente ;
- démarrer plusieurs branches / CLI en parallèle depuis un point d'entrée unique ;
- conserver un contexte d'agent entre scénarios et redémarrages, sauf effacement volontaire ;
- suivre en direct ce qui se passe via un terminal dans l'interface.

Sans cet outil, les scénarios restent fragiles et peu traçables. Sans adapters, chaque nouveau CLI forcerait à spécialiser l'app toute entière.

---

## 3. Objectifs

| # | Objectif | Comment on saura que c'est atteint |
|---|---|---|
| 1 | Lancer localement ClientsBox et accéder à l'UI navigateur | Serveur local (port 2974 ou choisi) ; lien affiché dans le terminal OS ; UI en français |
| 2 | Wrapper les CLI derrière un usage unifié | Les blocs pilotent le CLI via un adapter, sans syntaxe brute dans le canvas |
| 3 | Disposer d'un système d'adapters embarqués | Contrat d'adapter figé **ADR-002** / cursor-cli **ADR-003** ; intention Annexe D / R-29 |
| 4 | Gérer CLI, agents et profils | Menu CLI ; agents liés à un CLI ; chaque agent a un profil ; un profil peut servir plusieurs agents |
| 5 | Composer / rejouer des scénarios | Canvas sur modèle de blocs modulable (0..N entrées/sorties + params statiques) ; Start/Run/If/ClearContext/CallScenario/Command ; composition scénario→scénario ; commandes shell OS via Command |
| 6 | Persister configuration et contextes | Sous `data/` ; contexte agent survit aux scénarios et redémarrages jusqu'à effacement explicite |
| 7 | Suivre et contrôler l'exécution | Terminal UI live ; stop manuel ; stop global sur erreur |

---

## 4. Parties prenantes

| Partie prenante | Rôle | Ce qu'elle attend | Utilise l'application ? |
|---|---|---|---|
| Porteur / développeur-opérateur | Définit le besoin, crée et exécute les scénarios | Wrapper fiable, adapters, canvas, terminal live, stop | oui |
| Coéquipiers du dépôt (éventuels) | Réutilisent ou adaptent les scénarios | Fichiers `data/` lisibles | oui |
| Agents CLI (cursor-cli en v1) | Exécutent via leur CLI natif | Invoqués uniquement via leur adapter | non |
| Adapters CLI | Traduisent le contrat ClientsBox → CLI | Compatibilité blocs ↔ CLI | non (interne) |

---

## 5. Personas

### Alex — développeur-opérateur local
- **Contexte d'usage :** lance ClientsBox depuis la racine voulue du projet (`cwd` = racine de travail), ouvre le lien terminal, édite ressources (UI et/ou fichiers), lance un scénario, suit le terminal UI, peut stopper ou effacer un contexte agent.
- **Objectif :** wrapper Cursor (puis d'autres CLI) derrière ClientsBox sans retaper les commandes.
- **Ce qui le bloque aujourd'hui :** pas de wrapper unifié ni de canvas d'orchestration.

### Sam — coéquipier lecteur / contributeur
- **Contexte d'usage :** lit/édite `data/` à la main ou via l'UI.
- **Objectif :** réutiliser les scénarios du dépôt.
- **Ce qui le bloque aujourd'hui :** enchaînements non exécutables / non versionnés.

---

## 6. Périmètre

### Dans le périmètre

- **ClientsBox** : wrapper CLI + scénarios par blocs ; TypeScript ; Node ≥ 24 ; UI **française**
- **Adapters embarqués** dans le code / livrable ; v1 = cursor-cli simple (construire la requête + parser le flux)
- Contrat d'adapter cible (`ExecutionContext`, `AgentStreamEvent`, `CLIAdapter`) → **ADR-002** (spécialisation cursor-cli : **ADR-003**) ; intention Annexe D / R-29
- Livrable cible : un fichier JS précompilé unique (copie manuelle dans `.agents/`)
- Serveur HTTP local ; lien dans le terminal OS ; port `-p` / `--port`, défaut **2974** ; **échec** si port occupé
- **Racine projet / workspace** = répertoire depuis lequel la commande de démarrage du service a été lancée (`cwd`)
- Persistance sous `.agents/data/` : `agents/`, `profils/`, `prompts/`, `exit/`, `if/`, `scenarios/`
- CRUD des ressources **des deux côtés** : UI et fichiers
- Un agent a **un** profil ; un profil peut être partagé par **plusieurs** agents
- Canvas type N8N fondé sur un **modèle de bloc de base modulable** (voir Annexe B) : 0..N entrées, 0..N sorties, paramètres **statiques** ; chaque type de bloc spécialise ce contrat
- **Un seul Start** par scénario ; Start = sorties uniquement (fan-out parallèle) ; chaque graphe (parent **et** enfant appelé) obéit à cette règle
- Blocs v2.1 : **Start**, **Run**, **If**, **ClearContext**, **CallScenario**, **Command** ; pas de End
- Nuance essentielle : « ne prend pas de paramètres dynamiques » ≠ « n'a pas d'entrées » — les **ports d'entrée** servent au flux / ordonnancement ; les **paramètres dynamiques** seraient des valeurs lues depuis les payloads entrants (Run / ClearContext / CallScenario / Command ne les lisent pas)
- **Run** : 0..N entrées (flux, non lues comme params) ; params statiques agent/prompt/exit ; peut être un **endpoint** (0 sortie) ou émettre une sortie `blockMessage`
- **If** : **1..N** entrées ; lit le sac ; appelle `if(sac)` ; **deux familles** de sorties : branche prise = **0..N** ports en **power 1** ; branche non prise = **0..N** ports en **power 0**
- **ClearContext** : **\*/\*** (0..N entrées / 0..N sorties) ; ne lit pas le sac ; param statique = agent ; s'exécute si **`N ≥ 1`** et `sum(power)===N` (sinon pause / attente maj ; N=0 → R-42d) ; chaque sortie émet `{ blockType: 'clearContext', value: null, power: 1 }` ; **ou** clear manuel sur l'agent
- **CallScenario** : **1..N** entrées / **0..N** sorties ; ne lit pas le sac ; param statique = **`targetScenarioId`** (scénario cible) ; s'exécute si **`N ≥ 1`** et `sum(power)===N` (sinon pause ; N=0 → R-42d) ; lance le scénario cible en **sous-exécution in-process**, **attend** sa fin, puis chaque sortie câblée émet `{ blockType: 'callScenario', value: null, power: 1 }` ; aucun paramètre métier n'est transmis à l'enfant ni renvoyé ; échec / arrêt non réussi de l'enfant ⇒ échec du bloc (R-25) ; identité du run HTTP / recovery = scénario **racine** ; état interne de l'enfant **non exposé** en V1 de cette feature (R-46, REQ-039…041)
- **Command** : **1..N** entrées / **0..N** sorties ; ne lit pas le sac ; param statique = **`commandLine`** (commande shell OS, hors adapters agents) ; s'exécute si **`N ≥ 1`** et `sum(power)===N` (sinon pause ; N=0 → R-42d) ; spawn dans le **workspace** (`cwd` = `workspacePath` / REQ-006), **attend** la fin du process ; exit **0** ⇒ chaque sortie câblée émet `{ blockType: 'command', value: null, power: 1 }` ; exit **≠ 0** ou `commandLine` vide / invalide ⇒ échec du bloc (R-25) ; stdout/stderr → terminal du run racine ; distinct du bloc **Run** (pas d'agent / prompt / exit) (R-47, REQ-042…043)
- Messages : **sortie** = `blockMessage` `{ blockType, value, power }` (sans key) ; **entrée** = sac `{ [key]: blockMessage }`
- **Power** : nombre = courant dans le câble ; v1 = **1** partout sauf **If** (famille prise = **1**, famille non prise = **0**, chacune 0..N ports)
- **Join** : attendre un message sur chaque entrée câblée ; **exécuter** ssi **`N ≥ 1`** et `sum(power) === N` ; si `sum < N` → la ligne reste **en pause** et **attend une mise à jour** des messages d'entrée (ex. boucle If qui renvoie un power différent) — peut bloquer l'exécution (assumé)
- **Start** : 0 entrée ; départ **immédiat** au lancement du scénario
- **Cas N = 0 entrées** (hors Start) : **pas de démarrage** du bloc ; **aucun** power / `blockMessage` n'est émis sur les sorties (le power « ne passe pas »). Start reste la seule exception (0 entrée → départ immédiat).
- Keys `0,1,2…` / custom ; collision refusée ; renum auto numériques (sauf custom)
- Persistance de session : **responsabilité de l'adapter** ; champ typé CLI sur l'agent → **specs**
- Terminal page : **live temporaire**, aucune persistance
- Stop manuel = **kill** process CLI ; **session conservée** ; Stop aussi en **pause** (urgence) ; terminal = live + inspection ; Stop du run **racine** interrompt aussi toute sous-exécution `CallScenario`, ses spawns CLI, et tout process **Command** en cours
- Prérequis : CLI Cursor installé ; env **`CURSOR_CLI_BIN`** obligatoire en build et dev (autres CLI plus tard)
- Profil : politiques d'envoi **clairement différenciables** (noms exacts → specs) ; **3** modes : **chaque prompt** (défaut ; synonyme métier de « toujours » — **un seul** enum), **début de scénario**, **une fois jusqu'à clear**
- Schémas détaillés de `value` → **specs**
- Confiance locale : pas de sandbox

### Hors périmètre

| Élément écarté | Motif |
|---|---|
| Remplacer les CLI tiers | ClientsBox wrappe / adapte |
| Autres CLI que cursor-cli en v1 | Reporté ; `CURSOR_CLI_BIN` seul pour l'instant |
| Blocs hors Start/Run/If/ClearContext/CallScenario/Command (boucles, End, branche erreur canvas…) | V2.1 limitée |
| Passage de paramètres / résultats métier parent ↔ enfant via CallScenario | Hors scope V1 de la feature (power only) |
| Visualisation / recovery canvas de l'état interne d'un scénario enfant | Hors scope V1 de la feature (REQ-040) |
| Env custom / timeout UI / capture stdout comme `value` métier pour Command | Hors scope V1 de la feature (power only ; REQ-042…043) |
| Mode Command « ignorer exit ≠ 0 » | Hors scope V1 |
| Isolation de contexte pour le même agent en parallèle | Non : même contexte assumé |
| Sérialisation / file d'attente des invocations CLI sur un même agent | **Assumé** : à l'utilisateur de ne pas provoquer de courses ; une erreur éventuelle peut venir du CLI |
| Protection / warning UI contre la casse des scripts If après renumérotation de keys | **Assumé** : à l'utilisateur de gérer ses keys (custom recommandé s'il lit le sac) |
| Réparation des contextes CLI détruits hors ClientsBox | Assumé / hors scope |
| Historique / logs d'exécution sous `data/` | Pas en v1 |
| Adapters chargeables depuis le projet hôte | Embarqués uniquement en v1 |
| Adapter cursor-cli « riche » | V1 = build requête + parse stream |
| Schémas JSON détaillés ressources / `value` / champ session | Specs ou docs dédiées |
| Noms d'enum de politique profil | Tant qu'ils sont différenciables — specs |

---

## 7. Contraintes

| # | Contrainte | Nature |
|---|---|---|
| 1 | Runtime Node ≥ 24 ; application écrite en TypeScript | technique |
| 2 | Standalone ClientsBox, copie manuelle ; JS précompilé unique si possible | stratégique |
| 3 | Usage typique sous `.agents/` ; données sous `data/` | métier |
| 4 | Serveur local ; port 2974 par défaut ; flags `-p` / `--port` | technique |
| 5 | Lien d'accès affiché dans le terminal OS au démarrage | métier |
| 6 | UI en français | métier |
| 7 | Workspace = `cwd` de la commande de démarrage du service | métier |
| 8 | Un fichier par ressource ; formats homogènes par type | métier |
| 9 | Ressource **`if`** = fichier **JavaScript** (`data/if/<nom>.js`, `if(sac) → bool`) — **pas** du JSON ; les autres configs ressources = **JSON** (homogénéité **par type**, R-02) | métier |
| 10 | Sortie = `blockMessage` `{ blockType, value, power }` ; entrée = sac `{ [key]: blockMessage }` | métier |
| 11 | Mono-utilisateur local ; pas d'auth ; pas de sandbox | stratégique |
| 12 | Adapters embarqués ; premier CLI = cursor-cli ; **`CURSOR_CLI_BIN`** obligatoire (build + dev) | métier |
| 13 | ClientsBox ne remplace pas les CLI tiers | stratégique |
| 14 | Schémas `value` des payloads → specs | métier |
| 15 | Exécution (hors Start) ssi **`N ≥ 1`**, join complet et `sum(power) === N` (v1) ; si **N = 0** → pas d'exécution (R-42d) | métier |

---

## 8. Règles métier

| # | Règle |
|---|---|
| R-01 | Une ressource (agent, profil, prompt, exit, **if**, scenario) = **un fichier** dans son dossier `data/`. La ressource **`if`** est **spécifique** : format **JS** (R-14), distinct des ressources JSON. |
| R-02 | Même type de ressource ⇒ même format de lecture (JSON pour agent/profil/prompt/exit/scenario ; **JS** pour `if`). |
| R-03 | Un agent est rattaché à **un** CLI. |
| R-04 | Menu CLI = adapters opérationnels uniquement ; v1 = cursor-cli. |
| R-05 | Un **agent a exactement un profil** ; un **profil peut être associé à plusieurs agents**. |
| R-06 | Un profil définit le prompt initial et une **politique d'envoi** clairement différenciable. Modes distincts (v1) : (**1**) **chaque prompt** — défaut ; fusionne l'ancienne intention « toujours » (même sémantique, **un seul** enum) ; (**2**) **début de scénario** ; (**3**) **une fois jusqu'à clear**. Noms d'enum exacts → specs. |
| R-07 | Un prompt `exit` définit ce qui doit être renvoyé en fin de tâche pour alimenter la sortie du bloc (payload). |
| R-08 | **Modèle de bloc de base** : boîte logique modulable avec **0..N ports d'entrée**, **0..N ports de sortie**, et des **paramètres statiques** de configuration. Chaque type de bloc spécialise ce contrat. |
| R-09 | Distinction : **port d'entrée** (flux / join) ≠ **lecture dynamique** du contenu du sac. Un bloc peut avoir des entrées sans lire les messages. |
| R-10 | **Message de sortie** (`blockMessage`) = `{ blockType, value, power }` (schémas de `value` → specs). |
| R-10b | **`power`** (nombre) représente le courant / la force dans le câble. En v1 : **1** sur toutes les sorties de bloc, sauf **If** : tous les ports de la branche prise émettent **power 1** ; tous ceux de la branche non prise émettent **power 0**. Le type number est choisi pour permettre plus tard des opérations selon la force. |
| R-11 | **Messages d'entrée** d'un bloc = sac `{ [key]: blockMessage }`. |
| R-12 | À chaque nouvelle connexion d'entrée, la **key** par défaut est un entier séquentiel : `0`, puis `1`, `2`, etc. |
| R-13 | L'utilisateur peut cliquer une connexion pour définir une **key personnalisée unique** ; toute **collision** de key sur le même bloc cible est **refusée**. |
| R-14 | Condition If = `data/if/<nom>.js` exposant `if(param) → bool` ; `param` = le **sac d'entrées** entier. |
| R-15 | If : **1..N** entrées ; lit le sac ; condition dans `data/if/` ; **deux familles** de sorties — branche retenue : **0..N** ports en **power 1** ; branche non retenue : **0..N** ports en **power 0**. |
| R-16 | Scénario = graphe (nœuds, liens, positions, **keys** de connexions d'entrée) dans `data/scenarios/`. |
| R-17 | Ressources et scénarios modulaires, réutilisables, versionnables avec le projet. |
| R-18 | Toute invocation CLI passe par un **adapter** ; nouvel CLI = nouvel adapter, sans changer les blocs. |
| R-19 | **Un seul** bloc **Start** par scénario. |
| R-20 | **Start** : **aucune entrée** ; **N sorties** (fan-out) ; chaque sortie émet un `blockMessage` (**sans key**). |
| R-21 | Pas de bloc End dédié en v1 ; un **Run** (ou autre) peut être un **endpoint** (0 sortie). |
| R-22 | **Run** : params **statiques** agent + prompt + exit optionnel ; **0..N entrées** (join + règle power ; exécution ssi **`N ≥ 1`** et `sum(power)===N` ; si **N = 0** : **pas d'exécution** / pas d'émission — R-42d) ; sac **non lu** ; 0..N sorties en **power 1** ; autorisé comme endpoint. |
| R-23 | Sans effacement explicite, l'agent reste dans le **même contexte**. |
| R-24 | Maintien / persistance de contexte = responsabilité de l'**adapter** (détail → specs). |
| R-25 | Erreur d'exécution ⇒ **arrêt global** + erreurs visibles. Inclut l'échec d'une sous-exécution **CallScenario** (bloc appelant) et l'échec d'un bloc **Command** (exit ≠ 0 ou commande invalide) ⇒ arrêt global du **scénario racine**. |
| R-26 | Terminal page = **vue live temporaire** (rien persisté). |
| R-27 | ClientsBox = wrapper ; l'adapter construit la commande CLI. |
| R-28 | CLI listé seulement s'il a un adapter opérationnel embarqué. |
| R-29 | Contrat adapter v1 : `buildCommand` + `parseStreamLine` — interfaces / signatures → **ADR-002** (cursor-cli : **ADR-003**) ; intention rappelée Annexe D. |
| R-30 | Effacement via **ClearContext** ou **effacement manuel** sur l'agent. |
| R-31 | Le contexte survit aux scénarios et redémarrages tant que l'adapter le persiste. |
| R-32 | Destruction de contexte **externe** au CLI : hors responsabilité ClientsBox. |
| R-33 | Plusieurs Run parallèles sur le **même agent** = **même** contexte. ClientsBox **ne sérialise pas** les invocations : c'est à l'**utilisateur** d'éviter les courses ; une corruption éventuelle est du ressort du CLI. |
| R-34 | Stop = **kill** + arrêt scénario ; **session conservée** (kill ≠ clear). Le Stop doit rester disponible y compris lorsqu'un scénario est **en pause** (attente power / join). Le Stop du run **racine** interrompt aussi toute sous-exécution **CallScenario**, les processus CLI qu'elle a démarrés, et tout process **Command** en cours. |
| R-35 | Port occupé (port par défaut **2974** ou port surchargé) ⇒ démarrage **échoue**. |
| R-36 | Ressources éditables **UI et fichiers**. |
| R-37 | Pas d'historisation fichier des exécutions en v1. |
| R-38 | Adapters **embarqués** ; v1 cursor-cli simple. |
| R-39 | **ClearContext** : param statique **agent** ; ports **\*/\*** (0..N entrées / 0..N sorties) ; ne lit pas le sac ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` (sinon pause ; si **N = 0** : R-42d) ; chaque sortie câblée émet `{ blockType: 'clearContext', value: null, power: 1 }`. |
| R-40 | Binaire cursor via **`CURSOR_CLI_BIN`** (build + dev) ; autres CLI plus tard. |
| R-41 | Schémas `value` / champ session / enums profil → **specs**. |
| R-42 | Entrées câblées (**N ≥ 1**) ⇒ **join** : attendre un `blockMessage` sur **chaque** entrée câblée. |
| R-42b | Après join : **exécuter** ssi **`N ≥ 1`** et `somme(power) === N`. Si `sum < N` : le bloc / la ligne reste **en pause** et **attend une mise à jour** des messages d'entrée (ex. re-passage via boucle If avec un power différent). Ce mécanisme **peut bloquer** l'exécution — c'est accepté en v1. Si **N = 0** (aucune entrée câblée), hors **Start** : **pas d'exécution** et **pas d'émission** de sortie (voir R-42d). |
| R-42c | **Start** : 0 entrée ; déclenchement **immédiat** au démarrage du scénario (pas de règle power d'entrée). |
| R-42d | Hors **Start** : si un bloc a **0** entrée câblée (**N = 0**), il **ne démarre pas** et **n'émet aucun** `blockMessage` (power ne traverse pas). |
| R-43 | Après suppression d'une connexion d'entrée : **renumérotation automatique** des keys numériques par défaut restantes ; les keys **personnalisées** ne sont **pas** renumérotées. Le risque de casser un `if(sac)` qui lit une key numérique est **assumé** : à l'**utilisateur** de faire attention (keys custom recommandées s'il lit le sac). |
| R-44 | Les keys existent **uniquement sur les connexions d'entrée**. Une sortie émet uniquement un `blockMessage` (avec `power`), **sans key**. |
| R-45 | L'assemblage du **prompt / contexte textuel** destiné à l'invocation est réalisé par **ClientsBox avant** l'appel adapter (`buildCommand`) — l'adapter ne reconstitue pas le prompt métier. |
| R-46 | **CallScenario** : param statique **`targetScenarioId`** ; ports **1..N** entrées / **0..N** sorties ; ne lit pas le sac ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` (sinon pause ; si **N = 0** : R-42d) ; lance le scénario cible en **sous-exécution in-process**, **attend** sa terminaison ; chaque sortie câblée émet `{ blockType: 'callScenario', value: null, power: 1 }` ; aucun paramètre métier parent↔enfant ; échec / arrêt non réussi de l'enfant ⇒ échec du bloc (R-25) ; identité du run HTTP / recovery = scénario **racine** ; état interne de l'enfant **non exposé** en V1 de cette feature ; auto-appel (`targetScenarioId` = scénario courant) **autorisé** ; profondeur max via env optionnelle **`CALL_SCENARIO_MAX_DEPTH`** (**`-1`** ou absente = illimité) ; cible absente / invalide ⇒ erreur de bloc. |
| R-47 | **Command** : param statique **`commandLine`** ; ports **1..N** entrées / **0..N** sorties ; ne lit pas le sac ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` (sinon pause ; si **N = 0** : R-42d) ; exécute une **commande shell OS** (hors adapters agents ; distinct de **Run**) avec **`cwd` = `workspacePath`** (REQ-006) ; **attend** la fin du process ; exit **0** ⇒ chaque sortie câblée émet `{ blockType: 'command', value: null, power: 1 }` ; exit **≠ 0** ou `commandLine` vide / invalide ⇒ échec du bloc (R-25) ; stdout / stderr relayés vers le terminal du run **racine** ; Stop racine interrompt le process (R-34). |

---

## 9. Exigences fonctionnelles

| ID | Exigence | Priorité | Persona |
|---|---|---|---|
| REQ-001 | Au démarrage, démarrer un serveur HTTP local et rendre l'UI accessible dans un navigateur. | Must | Alex |
| REQ-002 | Port configurable via `-p` / `--port` ; défaut 2974. | Must | Alex |
| REQ-003 | Lancement via Node du livrable standalone (idéalement un JS unique). | Must | Alex |
| REQ-004 | Afficher le lien d'accès dans le **terminal OS** (pas d'ouverture auto du navigateur). | Must | Alex |
| REQ-005 | Si le port est occupé, **échouer** le démarrage avec un message d'erreur clair. | Must | Alex |
| REQ-006 | Utiliser comme `workspacePath` le répertoire courant (`cwd`) de la commande de démarrage. | Must | Alex |
| REQ-007 | UI en **français**. | Must | Alex |
| REQ-008 | Menu listant les CLI dont l'adapter est embarqué et opérationnel. | Must | Alex |
| REQ-009 | CRUD agents rattachés à un CLI (UI + fichiers). | Must | Alex |
| REQ-010 | Chaque agent référence **un** profil ; un profil peut être utilisé par plusieurs agents. | Must | Alex |
| REQ-011 | CRUD profils, prompts, exit, scenarios (UI + fichiers) ; pour **if** : liste / consultation / suppression UI, création et édition du contenu JS hors UI (fichiers sous `data/if/`, cf. REQ-012). | Must | Alex |
| REQ-012 | Conditions If sous `data/if/` listées dans l'éditeur ; éditables aussi hors UI. | Must | Alex |
| REQ-013 | En v1, seul cursor-cli via son adapter embarqué. | Must | Alex |
| REQ-014 | Canvas de blocs (positions + connexions persistées). | Must | Alex |
| REQ-015 | Exactement **un** Start par scénario ; Start = **0 entrée**, **N sorties** ; départ **immédiat** au lancement du scénario. | Must | Alex |
| REQ-016 | Le moteur de blocs doit reposer sur un **modèle de base modulable** : 0..N entrées, 0..N sorties, paramètres statiques ; chaque type spécialise ce contrat. | Must | Alex |
| REQ-017 | Bloc **Run** : params statiques ; **0..N entrées** (sac non lu) ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` ; sinon **pause** ; si **N = 0** : **pas d'exécution**, pas d'émission de power (hors Start) ; endpoint ou émission power **1**. | Must | Alex |
| REQ-018 | Exécution Run via adapter ; si sortie câblée, transmettre le `blockMessage` (incl. `power`) vers le sac aval sous la **key** de la connexion. | Must | Alex |
| REQ-019 | Bloc **If** : **1..N** entrées ; reçoit le sac ; `if(sac)` ; branche prise = **0..N** sorties **power 1** ; branche non prise = **0..N** sorties **power 0**. | Must | Alex |
| REQ-020 | Bloc **ClearContext** : param statique agent ; **0..N entrées / 0..N sorties** ; ne lit pas le sac ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` (sinon pause) ; si **N = 0** : **pas d'exécution**, pas d'émission (hors Start) ; sorties = `{ blockType: 'clearContext', value: null, power: 1 }`. | Must | Alex |
| REQ-021 | Depuis le menu agent, pouvoir **effacer manuellement** le contexte. | Must | Alex |
| REQ-022 | Persistance session **par l'adapter** ; forme du champ agent → specs. | Must | Alex |
| REQ-023 | Politique d'envoi du profil : **3** modes différenciables — chaque prompt (défaut = « toujours » fusionné), début de scénario, une fois jusqu'à clear. | Must | Alex |
| REQ-024 | Terminal page : live temporaire, sans persistance ; permettre d'**inspecter** l'état d'exécution (dont pauses join/power) du **scénario racine**. L'état interne d'un scénario enfant lancé via **CallScenario** n'est **pas** exposé en V1 de cette feature (pas de pastilles / snapshot / SSE dédiés sur le canvas de l'enfant). | Must | Alex |
| REQ-025 | Stop manuel = **kill** + arrêt scénario ; **session conservée** ; Stop disponible aussi en cas de **pause / attente** (déblocage d'urgence). Le Stop du run **racine** interrompt aussi toute sous-exécution **CallScenario**, ses spawns CLI, et tout process **Command** en cours. | Must | Alex |
| REQ-026 | Erreur ⇒ arrêt **global** + affichage erreurs. L'échec d'une sous-exécution **CallScenario** (bloc appelant) ou d'un bloc **Command** (exit ≠ 0 / commande invalide) déclenche l'arrêt global du scénario **racine**. | Must | Alex |
| REQ-027 | Adapters embarqués conformes au **contrat adapter** (**ADR-002** ; intention Annexe D / R-29). | Must | Alex |
| REQ-028 | Blocs indépendants de la syntaxe CLI. | Must | Alex |
| REQ-029 | Adapter cursor-cli : `buildCommand` (`CURSOR_CLI_BIN`) + `parseStreamLine`. | Must | Alex |
| REQ-030 | Lancer un scénario depuis l'UI. | Must | Alex |
| REQ-031 | **`CURSOR_CLI_BIN`** obligatoire en build et dev. | Must | Alex |
| REQ-032 | Assemblage prompt **avant** l'adapter (R-45). | Must | Alex |
| REQ-033 | Chaque connexion d'entrée porte une **key** : défaut numérique `0,1,2…` ; custom unique via clic ; **collision refusée** sur le bloc cible. | Must | Alex |
| REQ-034 | Persister les keys de connexions dans le fichier scénario. | Must | Alex |
| REQ-035 | À la suppression d'une connexion : **renumérotation auto** des keys numériques restantes ; **pas** de renumérotation des keys personnalisées. | Must | Alex |
| REQ-036 | Les sorties émettent uniquement un `blockMessage` avec `power` (**pas de key** côté sortie). | Must | Alex |
| REQ-037 | Le moteur applique : join (1 message / entrée) ; exécution ssi **`N ≥ 1`** et `sum(power)===N` ; sinon **pause** et attente de mise à jour des entrées (blocage possible assumé) ; si **N = 0** hors Start : **pas d'exécution**, pas d'émission de power. | Must | Alex |
| REQ-038 | En v1, hors If, toute sortie de bloc utilise **power = 1**. | Must | Alex |
| REQ-039 | Bloc **CallScenario** : paramètre statique **`targetScenarioId`** ; **1..N** entrées / **0..N** sorties ; sac **non lu** ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` (sinon pause) ; si **N = 0** : **pas d'exécution**, pas d'émission (R-42d) ; lance le scénario cible, **attend** sa fin, puis sorties = `{ blockType: 'callScenario', value: null, power: 1 }` ; aucun paramètre métier transmis à l'enfant ni renvoyé. | Must | Alex |
| REQ-040 | La sous-exécution d'un **CallScenario** est **in-process** (ne passe pas par un second `POST /run` HTTP). L'identité du run HTTP / de la recovery Studio reste le scénario **racine**. Le scénario enfant n'est **pas** récupérable sur son canvas pendant ce sous-run ; son état interne n'est **pas** exposé en V1 de cette feature. | Must | Alex |
| REQ-041 | **CallScenario** : auto-appel (`targetScenarioId` égal à l'id du scénario courant) **autorisé** ; profondeur maximale d'imbrication lue depuis l'env optionnelle **`CALL_SCENARIO_MAX_DEPTH`** (**`-1`** ou variable absente = **illimité** ; sinon plafond entier ≥ 0) ; `targetScenarioId` absent, inconnu ou invalide ⇒ **erreur** du bloc (R-25 / REQ-026). | Must | Alex |
| REQ-042 | Bloc **Command** : paramètre statique **`commandLine`** ; **1..N** entrées / **0..N** sorties ; sac **non lu** ; join puis exécution ssi **`N ≥ 1`** et `sum(power)===N` (sinon pause) ; si **N = 0** : **pas d'exécution**, pas d'émission (R-42d) ; spawn shell OS (**hors** adapters agents ; distinct de **Run**) ; **attend** la fin du process ; exit **0** ⇒ sorties = `{ blockType: 'command', value: null, power: 1 }` ; exit **≠ 0** ⇒ **erreur** du bloc (R-25 / REQ-026). | Must | Alex |
| REQ-043 | **Command** : **`cwd` = `workspacePath`** (REQ-006) ; env = process hôte (pas de map env UI en V1) ; stdout / stderr relayés vers le terminal du run **racine** ; Stop racine interrompt le process ; `commandLine` vide ou invalide ⇒ **erreur** du bloc (R-25 / REQ-026). | Must | Alex |

---

## 10. Exigences non fonctionnelles

| ID | Exigence | Comment on la vérifie |
|---|---|---|
| REQ-101 | Persistance fiable de `data/` et des contextes agent. | Relire après redémarrage ClientsBox |
| REQ-102 | Démarrage simple + URL dans le terminal OS. | Lancer et lire l'URL |
| REQ-103 | Nouvel adapter = code embarqué, sans changer le modèle des blocs. | Revue / adapter fictif |
| REQ-104 | Fichiers `data/` éditables à la main et versionnables. | Diff / commit |
| REQ-105 | Payloads inter-blocs stables pour un même scénario / mêmes données. | Rejouer Start→Run→If (et Start→CallScenario→… / Start→Command→…) |
| REQ-106 | Mono-utilisateur, pas d'auth. | Aucun login |
| REQ-107 | Édition canvas non triviale (Start + Run/If/ClearContext/CallScenario/Command). | Scénario ≥ 3 blocs hors Start |
| REQ-108 | Copie manuelle du livrable JS. | Projet vierge + démarrage |
| REQ-109 | Pas de sandbox. | Aucune couche sécurité exigée |
| REQ-110 | Live visible dans le terminal UI (temporaire). | Run long + chunks ; rien n'est persisté après refresh |
| REQ-111 | Pas de journalisation fichier des exécutions en v1. | Aucun dossier logs requis |
| REQ-112 | `CURSOR_CLI_BIN` obligatoire : build/dev refusés ou démarrage adapter impossible si absente. | Lancer sans la var → erreur explicite |

---

## 11. Questions ouvertes

Décisions figées (arbitrages) :

| Sujet | Décision |
|---|---|
| Renum keys vs scripts If | **Assumé / user** — pas de garde-fou produit en v1 |
| Pause power + Stop | Stop + inspection UI pour débloquer / observer |
| Run parallèles même agent | **Assumé / user** — pas de file d'attente ; erreur éventuelle côté CLI |

Décisions figées **CR-008** (CallScenario) :

| Sujet | Décision |
|---|---|
| Ports CallScenario | Multi-câbles **1..N** in / **0..N** out ; power only ; sac non lu |
| Échec enfant | Échec du bloc → arrêt global racine (R-25) |
| Observabilité enfant | Non exposée en V1 de la feature (REQ-040) |
| Params métier parent↔enfant | Hors scope |
| Profondeur max | Env **`CALL_SCENARIO_MAX_DEPTH`** (optionnelle) ; **`-1`** / absente = illimité (REQ-041) |

Décisions figées **CR-008** (Command) :

| Sujet | Décision |
|---|---|
| Nature | Shell OS fourni tel quel ; **hors** adapters agents ; **distinct** de Run |
| Ports Command | Multi-câbles **1..N** in / **0..N** out ; power only ; sac non lu |
| Paramètre | **`commandLine`** (non vide) |
| cwd | **`workspacePath`** (REQ-006) ; pas de cwd UI en V1 |
| Échec | exit ≠ 0 ou commande invalide → échec bloc → R-25 |
| Terminal | stdout/stderr → run racine ; Stop tue le process |

Aucune question bloquante restante. Suite : **ADR** (`tdd/docs/adr/`) puis **specs** (delta Command encore à chaîner).

---

## 12. Validation

| Version | Date | Statut | Retour |
|---|---|---|---|
| v1 | 17–18/09/2026 | brouillon ouvert | Cadrage ClientsBox |
| v1 (maj) | 18/09/2026 | brouillon ouvert | Power, pause, ClearContext \*/\* |
| v1 (maj) | 18/09/2026 | brouillon ouvert | Arbitrages : keys/concurrence = responsabilité user ; Stop en pause = oui |
| v1 (maj) | 18/09/2026 | brouillon ouvert | Apply paquet audit cohérence POINTS 001–009 (rapports 26–36) |
| v1 (maj) | 21/09/2026 | brouillon ouvert | Vérif neutre party 02 : N≥1 + join/sum ; R-42 ; commentaire D.2 power |
| v1 | 21/09/2026 | **verrouillé** | Démarrage suite ADR-001…005 ; amendements = nouvelle version CDC |
| v2 | 06/10/2026 | **intact** (réf. `cahier-des-charges-v2.md`) | CR-001 — port défaut 2974 / Vitest |
| **v2.1** | 13/11/2026 | **brouillon ouvert** | CR-008 — CallScenario + Command (composition scénario→scénario + commande shell) |

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

Prérequis : CLI Cursor ; **`CURSOR_CLI_BIN`**.

## Annexe B — Modèle de blocs et messages

### B.1 — Bloc de base

| Élément | Description |
|---|---|
| Ports d'**entrée** | 0..N (selon spécialisation) |
| Ports de **sortie** | 0..N |
| Paramètres **statiques** | Config hors runtime |

### B.2 — Messages

```text
blockMessage = { blockType, value, power }   // sortie, sans key
sac d'entrées = { [key]: blockMessage, ... }
```

- **power** (number) = courant ; v1 : **1** sauf If (famille 1 = power 1 × 0..N ; famille 0 = power 0 × 0..N)
- Keys uniquement sur connexions d'**entrée**

### B.3 — Join, power, pause

1. **Join** : un message sur chaque entrée câblée (y compris power 0) — pour **N ≥ 1** (R-42).
2. Si **`N ≥ 1`** et `sum(power) === N` → **exécuter**.
3. Si `N ≥ 1` et `sum(power) < N` → **pause** : attendre une **mise à jour** d'un message d'entrée (ex. boucle If). Peut **bloquer** — accepté en v1.
4. Si **N = 0** (hors Start) → **pas d'exécution** ; aucune émission de power en sortie (R-42d).

### B.4 — Spécialisations v2.1

| Bloc | Entrées | Lit le sac ? | Params | Sorties / power | Notes |
|---|---|---|---|---|---|
| **Start** | **0** | — | — | N × power **1** | Départ **immédiat** au start scénario |
| **Run** | 0..N | Non | agent, prompt, exit? | **0..N** × power **1** (endpoint OK) | Join ; exéc. ssi **N≥1** et sum===N sinon pause ; **N=0 → pas d'exéc. / pas de power** (R-42d) |
| **If** | **1..N** | Oui | condition | Branche prise : **0..N** × power **1** ; branche non prise : **0..N** × power **0** | `if(sac)` ; join ; exéc. ssi **N≥1** et sum===N |
| **ClearContext** | **0..N** | Non | agent | **0..N**, power **1** | Join ; exéc. ssi **N≥1** et sum===N sinon pause ; value null ; **N=0 → R-42d** |
| **CallScenario** | **1..N** | Non | `targetScenarioId` | **0..N**, power **1** | Join ; exéc. ssi **N≥1** et sum===N sinon pause ; await sous-scénario in-process ; value null ; échec enfant ⇒ R-25 ; **N=0 → R-42d** ; R-46 / REQ-039…041 |
| **Command** | **1..N** | Non | `commandLine` | **0..N**, power **1** | Join ; exéc. ssi **N≥1** et sum===N sinon pause ; spawn shell OS (`cwd` = workspace) ; exit 0 ⇒ power 1 ; exit ≠ 0 ⇒ R-25 ; value null ; **N=0 → R-42d** ; R-47 / REQ-042…043 |

Pas de bloc End.

## Annexe C — Wrapper et adapters

```text
[ Canvas + keys + power ]
  -> [ Moteur : join / sum(power) / pause+maj ]
  -> [ CLIAdapter ] -> CURSOR_CLI_BIN
```

## Annexe D — Contrat Adapter + messages

### D.1 — ExecutionContext / AgentStreamEvent / CLIAdapter

Interfaces et signatures (`buildCommand`, `parseStreamLine`, etc.) → **ADR-002** (contrat) et **ADR-003** (cursor-cli) ; détails de payload → **specs**.  
Rappel v1 : binaire via **`CURSOR_CLI_BIN`** (R-40, REQ-031, REQ-112).  
Messages runtime inchangés en **D.2**.

### D.2 — Messages

```typescript
export interface BlockMessage {
  blockType: 'start' | 'run' | 'if' | 'clearContext' | 'callScenario' | 'command' | string;
  value: unknown;
  power: number; // v1: 1 ; If: famille prise = 1 (0..N ports), famille non prise = 0 (0..N ports)
}

export type BlockInputBag = Record<string, BlockMessage>;
```

### D.3 — Politique d'envoi du profil

Modes différenciables (**3**, un enum chacun) : **chaque prompt** (défaut ; = « toujours », fusionné) ; **début de scénario** ; **une fois jusqu'à clear**.
