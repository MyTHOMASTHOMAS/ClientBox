# Spécifications — Ressources & Persistance sous `.agents/data/` (et export doc `.agents/docs/`)

**Domaine :** `DATA`  
**Document maître :** `tdd/specs/sommaire.md`  
**ADR d'ancrage :** [`ADR-005`](../docs/adr/ADR-005-persistance-data.md), [`ADR-017`](../docs/adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.3.md` (CR-012 rétablissement prompt `exit`, CR-008 CallScenario ; bases v1..v2.2 archivées intactes)  

---

## SPEC-DATA-01 — Schémas JSON et validation des ressources déclaratives

**Exigences :** `REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `R-01`, `R-02`, `R-03`, `R-05`, `R-06`, `R-07`, `C-03`, `C-08`, `REQ-101`, `REQ-104`, `Annexe A`, `D.3`  
**Statut :** proposé  
**Version :** v1.4 (2026-11-20, CR-012 — schéma `exit` `{ id, name, content }` conforme R-07)  

### Règle

> Chaque ressource déclarative (agents, profils, prompts, prompts d'ordre de sortie `exit`) est stockée sous la racine `<workspacePath>/.agents/data/` dans un dossier dédié au format JSON (un fichier par ressource).
> Les formats de données sont homogènes par type : en particulier, `prompts/` et `exit/` partagent la structure `{ id, name, content }` (`R-02`, `R-07`), où `exit.content` porte l'ordre de sortie réutilisable destiné à s'additionner au prompt de mission d'un bloc `Run`.
> Un agent possède obligatoirement une référence vers exactement un profil (`profilId`), tandis qu'un profil peut être partagé entre plusieurs agents (`REQ-010`).
> Un agent possède obligatoirement un identifiant d'adapter CLI (`cliId`) non vide, conformément à R-03 et REQ-009 (rattachement agent ↔ CLI), et optionnellement un identifiant de modèle d'IA cible (`model?: string`) adapté à son CLI. Si `model` est fourni, il doit s'agir d'une chaîne de caractères non vide (nettoyée des espaces superflus).
> Un profil définit son prompt système initial et l'un des 3 modes d'envoi exclusifs (`chaque_prompt` par défaut, `debut_scenario`, ou `une_fois_jusqu_a_clear`).

### Portée

- Couvre les schémas JSON et la validation des entités `agents/`, `profils/`, `prompts/` et `exit/`.
- Couvre la cardinalité stricte 1-1 (agent → profil) et 1-N (profil → agents).
- Couvre la présence obligatoire du champ `cliId` sur tout agent (identifiant de l'adapter CLI).
- Couvre la présence optionnelle et la validation du champ `model` sur l'entité Agent (`TYPES-002`).
- Couvre la validation des 3 valeurs d'énumération de politique d'envoi du profil (`policy`) (`TYPES-003`).
- Couvre la détection des corruptions de fichiers JSON ou champs obligatoires manquants lors de la lecture.
- Ne couvre pas la ressource `if` en JavaScript → `SPEC-DATA-02`.
- Ne couvre pas les graphes de scénarios → `SPEC-DATA-03`.
- Ne couvre pas l'assemblage runtime du prompt système → `SPEC-ENG-04`.

### Scénarios nominaux

```gherkin
Scénario : Validation et enregistrement d'un agent avec profilId, cliId et modèle optionnel
  Étant donné un profil existant "profil-standard"
  Quand l'utilisateur crée un agent "agent-dev" avec profilId "profil-standard", cliId "cursor-cli" et model "gpt-5.3-codex"
  Alors le schéma valide l'agent
  Et le champ "model" est préservé avec la valeur "gpt-5.3-codex"
  Et le fichier ".agents/data/agents/agent-dev.json" est persisté

Scénario : Validation d'un agent sans modèle spécifié
  Étant donné un profil existant "profil-standard"
  Quand l'utilisateur crée un agent "agent-1" avec profilId "profil-standard" et cliId "cursor-cli" sans champ model
  Alors la validation réussit sans erreur
  Et le champ "model" est absent ou indéfini

Scénario : Validation et enregistrement d'un profil avec politique par défaut
  Étant donné une ressource profil avec id "dev-profil", name "Développeur" et systemPrompt "Tu es expert TS"
  Quand la politique d'envoi n'est pas spécifiée
  Alors le schéma valide le profil et lui assigne la politique "chaque_prompt" par défaut
  Et le fichier ".agents/data/profils/dev-profil.json" est persisté

Scénario : Validation d'un prompt et d'un ordre de sortie exit
  Étant donné un prompt avec id "p-init", name "Analyse" et content "Analyse le code"
  Et une ressource exit avec id "e-done", name "Ordre de boucle" et content "Si complet renvoie TERMINER, sinon CONTINUE"
  Quand le validateur JSON contrôle ces ressources
  Alors les deux ressources sont acceptées et écrites sous "data/prompts/" et "data/exit/"
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Fichier JSON syntaxiquement corrompu sur le disque | Rejet à la désérialisation, notification d'erreur explicite sans crash du serveur HTTP. |
| 2 | Agent créé sans `profilId` ou avec un identifiant vide | Refus de validation : champ `profilId` obligatoire (`R-05`). |
| 3 | Valeur d'enum `policy` invalide (ex. `toujours` ou `once`) | Refus de validation : seules les valeurs `chaque_prompt`, `debut_scenario` et `une_fois_jusqu_a_clear` sont autorisées (`R-06`). |
| 4 | Identifiant de ressource contenant des caractères interdits pour le système de fichiers (`/`, `\`, `..`) | Refus strict de validation pour empêcher les attaques de traversée de chemin. |
| 5 | Agent créé sans `cliId` ou avec un identifiant vide | Refus de validation : champ `cliId` obligatoire (`R-03`, `REQ-009`). |
| 6 | Agent fourni avec un champ `model` de type non chaîne (ex. nombre ou booléen) | Refus de validation : le champ `model` doit être de type chaîne (`string`). |
| 7 | Agent fourni avec un champ `model` composé uniquement d'espaces | Le validateur normalise en omettant le champ `model` (aucun modèle effectif). |

### Ce qui n'est pas défini

- *2026-11-06 (CR-003)* — Pas de validation syntaxique des crochets `[...]` dans le champ `model` : l'identifiant de modèle est traité comme une chaîne déclarative passée telle quelle à l'outil CLI.
- *2026-11-09* — Le champ `model` est rattaché à l'Agent et non au Profil pour préserver l'indépendance des personas et le découplage CLI ↔ Modèles.

### Critères d'acceptation

- [ ] `AC-DATA-01-1` — Le schéma JSON d'un agent valide les champs obligatoires (`profilId` et `cliId` non vides) et accepte le champ optionnel `model?: string` (`CASE-DATA-01-1`).
- [ ] `AC-DATA-01-2` — Le schéma JSON de profil valide les 3 politiques d'envoi (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`) (`CASE-DATA-01-2`).
- [ ] `AC-DATA-01-3` — Les schémas JSON pour `prompts/` et `exit/` valident l'intégrité de leur contenu respectif (`CASE-DATA-01-3`).
- [ ] `AC-DATA-01-4` — Tout fichier JSON invalide ou corrompu est rejeté avec un diagnostic d'erreur explicite sans plantage applicatif (`CASE-DATA-01-4`).
- [ ] `AC-DATA-01-5` — La suppression d'un profil référencé par au moins un agent est refusée avec une erreur métier explicite (mapping HTTP 409 côté API) (`CASE-DATA-01-5`, `R-05`, `REQ-010`, `ADR-005`).
- [ ] `AC-DATA-01-6` — Le schéma JSON de l'agent accepte et normalise le champ optionnel `model?: string` lorsqu'il est renseigné et rejette les types non-chaîne (`CASE-DATA-01-1`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la fusion de l'enum `toujours` dans `chaque_prompt` | Acceptée | Conforme à la décision CDC §8 R-06 et Annexe D.3. |

---

## SPEC-DATA-02 — Modèle et chargement dynamique des scripts conditionnels JS (`if`)

**Exigences :** `REQ-011`, `REQ-012`, `R-01`, `R-02`, `R-14`, `C-09`  
**Statut :** proposé  
**Version :** v1 (2026-09-22)  

### Règle

> Les conditions des blocs If résident sous `.agents/data/if/<nom>.js` sous forme de fichiers JavaScript exécutables (aucun format JSON n'est utilisé pour la ressource `if`).
> Tout script de condition doit obligatoirement exporter une fonction JavaScript recevant le sac d'entrées (`sac: Record<string, BlockMessage>`) et retournant un booléen : `if(sac) → boolean`.

### Portée

- Couvre l'emplacement disque et la détection des fichiers `.js` sous `.agents/data/if/`.
- Couvre le chargement dynamique et l'exécution de la fonction conditionnelle avec le sac d'entrées comme argument.
- Couvre la gestion des erreurs de syntaxe à l'évaluation et des exceptions runtime survenant dans le script utilisateur.
- Ne couvre pas la logique de propagation de puissance (power 1 / 0) en sortie du bloc If → `SPEC-ENG-03`.
- Ne couvre pas la création visuelle du bloc dans l'UI → `SPEC-UI-02`.

### Scénarios nominaux

```gherkin
Scénario : Évaluation nominale d'un script conditionnel If
  Étant donné un fichier ".agents/data/if/check-status.js" exportant "function (sac) { return sac.input0.value === 'SUCCESS'; }"
  Et un sac d'entrées contenant "{ input0: { blockType: 'run', value: 'SUCCESS', power: 1 } }"
  Quand le moteur évalue la condition
  Alors la fonction retourne la valeur booléenne true

Scénario : Prise en charge des formats d'export ESM et CommonJS
  Étant donné un script If utilisant "export default function(sac) { ... }" ou "module.exports = function(sac) { ... }"
  Quand le chargeur dynamique importe le module
  Alors la fonction conditionnelle est correctement instanciée et exécutable
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Erreur de syntaxe JavaScript dans le fichier `data/if/<nom>.js` | Échec de chargement intercepté, émission d'un diagnostic d'erreur précis sur le fichier et la ligne, scénario stoppé en erreur. |
| 2 | Le script `if` ne renvoie pas un booléen (ex. renvoie `null`, `undefined`, un objet) | Conversion ou rejet contrôlé : seule une valeur strictement évaluable en booléen est acceptée (par défaut `Boolean(res)`). |
| 3 | Exception levée pendant l'exécution de la fonction `if(sac)` | Exception interceptée sans crash du serveur ClientsBox, passage du bloc If à l'état d'erreur, arrêt global du scénario (`R-25`). |
| 4 | Le script tente de lire une clé absente du sac (ex. `sac.inexistant.value`) | L'erreur d'accès `TypeError` est capturée proprement et consignée dans l'état du bloc. |

### Ce qui n'est pas défini

- *2026-09-22* — Sandbox ou isolation de sécurité des scripts `if.js` : conformément à la contrainte `C-11` et l'ADR-005, aucune sandbox n'est requise en v1 locale.

### Critères d'acceptation

- [ ] `AC-DATA-02-1` — Le système charge et liste les scripts JavaScript valides situés sous `.agents/data/if/` (`CASE-DATA-02-1`).
- [ ] `AC-DATA-02-2` — La fonction `if(sac)` est exécutée avec le sac d'entrées complet et produit un résultat booléen (`CASE-DATA-02-2`).
- [ ] `AC-DATA-02-3` — Toute erreur de syntaxe ou exception runtime dans un script If est interceptée proprement sans crash du service (`CASE-DATA-02-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Confirmer le passage du sac d'entrées complet comme paramètre unique | Acceptée | Conforme au CDC §8 R-14 et §7 Contrainte 9. |

---

## SPEC-DATA-03 — Format, intégrité et persistance des graphes de scénario

**Exigences :** `REQ-011`, `REQ-014`, `REQ-034`, `REQ-035`, `REQ-036`, `REQ-039`, `REQ-041`, `REQ-042`, `REQ-043`, `REQ-111`, `R-16`, `R-17`, `R-37`, `R-43`, `R-44`, `R-46`, `R-47`, `C-14`  
**Statut :** proposé  
**Version :** v1.3 (2026-11-13, CR-008 — `callScenario` / `command`)  

### Règle

> Les scénarios sont persistés sous forme de documents JSON dans `.agents/data/scenarios/<nom>.json`.
> Le document de scénario stocke la liste des blocs (nœuds, types, paramètres statiques, positions canvas) et des connexions câblées (nœud source, port source, nœud cible, port cible, et `key` d'entrée).
> Les types de nœuds v2.1 sont : `start`, `run`, `if`, `clearContext`, `callScenario`, **`command`**. Un nœud `callScenario` persiste **`targetScenarioId`** ; un nœud `command` persiste **`commandLine`** (texte de commande shell).
> Chaque connexion d'entrée porte une clé (`key`) : par défaut un entier séquentiel (`0`, `1`, `2`…), ou une clé textuelle personnalisée unique sur le bloc cible.
> À la suppression d'une connexion d'entrée, les clés numériques par défaut restantes sont automatiquement renumérotées, tandis que les clés personnalisées sont strictement préservées.
> **Liste no-save :** certains champs de nœud (état d'exécution, drapeaux UI/runtime) **ne font pas partie** du document persisté. Leur liste canonique est une constante TypeScript exportée (`SCENARIO_NODE_NO_SAVE_KEYS`) dans `src/domain/graph/node-transient-keys.constant.ts` (`DOM-018`). Toute sérialisation (UI Enregistrer, PUT/POST scénario, strip à la relecture) **doit exclure** ces clés. En v1 la liste contient au minimum `status` (`BlockStatus`). Ces valeurs restent côté front (canvas) et/ou back (runner / snapshot `/run`) pour l'affichage et le paramétrage runtime, jamais sous `.agents/data/` (`R-37`, `REQ-111`).
> **Intégrité CallScenario :** à la validation du document, un nœud `callScenario` doit avoir un `targetScenarioId` non vide et référencer un fichier scénario existant (`REQ-041`). L'auto-référence (cible = scénario courant) est **autorisée**. La profondeur d'imbrication est contrôlée à l'exécution via `CALL_SCENARIO_MAX_DEPTH` (ENG / ADR-018), pas à la seule persistance.
> **Intégrité Command :** à la validation, un nœud `command` doit avoir un `commandLine` non vide (après trim) (`REQ-043`). Aucun champ agent/prompt/exit n'est requis ni persisté pour ce type.

### Portée

- Couvre la structure JSON de persistance des scénarios, blocs, liaisons et positions graphiques.
- Couvre la persistance des clés (`keys`) associées aux ports d'entrées.
- Couvre l'algorithme de renumérotation automatique des clés par défaut lors de la modification des liaisons.
- Couvre l'interdiction et le rejet des collisions de clés sur un même bloc cible (`R-13`, `REQ-033`).
- Couvre la liste no-save des champs de nœud exclus du JSON scénario et l'obligation de strip à l'écriture et à la lecture.
- Ne couvre pas le rendu visuel Canvas style N8N → `SPEC-UI-02`.
- Ne couvre pas le moteur d'exécution du graphe → `SPEC-ENG-01` à `SPEC-ENG-03`.

### Scénarios nominaux

```gherkin
Scénario : Sauvegarde et rechargement d'un scénario avec positions canvas et clés
  Étant donné un scénario composé de 1 bloc Start, 2 blocs Run et 1 bloc If
  Et des connexions d'entrées portant les clés "0", "1" et une clé personnalisée "contextInput"
  Quand le scénario est sauvegardé dans ".agents/data/scenarios/mon-flux.json"
  Alors le fichier contient la géométrie complète, les paramètres statiques et les clés
  Et son rechargement restitue fidèlement le graphe

Scénario : Renumérotation automatique des clés numériques après suppression de liaison
  Étant donné un bloc cible ayant 3 entrées câblées avec les clés par défaut "0", "1", "2"
  Quand l'utilisateur supprime la liaison correspondant à la clé "1"
  Alors l'ancienne liaison "2" est automatiquement renumérotée en "1"
  Et les clés résultantes sur le bloc sont "0" et "1"

Scénario : Préservation intégrale des clés personnalisées lors d'une suppression
  Étant donné un bloc cible ayant une entrée custom "promptData" et deux entrées par défaut "0", "1"
  Quand la liaison "0" est supprimée
  Alors l'entrée "promptData" conserve exactement son libellé
  Et l'entrée "1" est renumérotée en "0"

Scénario : Exclusion des champs no-save à la persistance
  Étant donné un nœud Run portant en mémoire locale status="running"
  Et la constante SCENARIO_NODE_NO_SAVE_KEYS contenant au minimum "status"
  Quand le scénario est sérialisé pour écriture sous ".agents/data/scenarios/"
  Alors le nœud sérialisé ne contient aucune clé listée dans SCENARIO_NODE_NO_SAVE_KEYS
  Et les champs de design (id, type, position, agentId, promptId, …) sont conservés

Scénario : Strip des champs no-save à la relecture d'un JSON pollué
  Étant donné un fichier scénario sur disque dont un nœud contient encore "status": "running"
  Quand le document est chargé pour le canvas ou la validation
  Alors les clés de SCENARIO_NODE_NO_SAVE_KEYS sont retirées du modèle nœud avant usage métier/UI
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Tentative de définir deux clés identiques sur le même bloc cible | Collision détectée : rejet immédiat à la validation, conservation de l'état antérieur (`R-13`). |
| 2 | Clé personnalisée vide ou composée d'espaces uniquement | Rejet de validation : une clé personnalisée doit contenir au moins un caractère non vide. |
| 3 | Présence de blocs sans aucune connexion d'entrée (N=0 hors Start) | Le scénario est persisté avec intégrité ; le moteur appliquera la règle R-42d lors de l'exécution. |
| 4 | Scénario sans bloc Start ou contenant plus d'un bloc Start | Signalement d'erreur de structure à la validation du document (`R-19`, `REQ-015`). |
| 5 | JSON scénario historique contenant `status` (ou autre clé no-save) sur un nœud | Strip à la lecture : le champ est ignoré ; aucun faux « run en cours » n'est déduit du disque. |
| 6 | Extension future de `SCENARIO_NODE_NO_SAVE_KEYS` | Toute nouvelle clé ajoutée à la constante est exclue sans changer le contrat des champs de design persistés. |
| 7 | Nœud `callScenario` sans `targetScenarioId` (vide) | Rejet à la validation (`REQ-041`). |
| 8 | Nœud `callScenario` pointant vers un scénario absent du disque | Rejet à la validation ou échec à l'exécution selon le moment de contrôle (`REQ-041`, `R-25`). |
| 9 | Nœud `callScenario` avec `targetScenarioId` égal au scénario courant | Accepté à la validation (`REQ-041` — auto-appel autorisé). |
| 10 | Nœud `command` sans `commandLine` (vide / espaces) | Rejet à la validation (`REQ-043`). |
| 11 | Nœud `command` avec `commandLine` non vide | Accepté ; persistance du champ tel quel (`REQ-042`). |

### Ce qui n'est pas défini

- *2026-09-22* — Données de zoom / pan du viewport canvas : peuvent être optionnellement incluses dans les métadonnées de présentation du JSON sans impacter le graphe logique.
- *2026-11-04* — Verrouillage UI de l'édition/sauvegarde pendant un run actif → formalisé dans `SPEC-UI-02` / `AC-UI-02-9` (hors contrat de format JSON).
- *2026-11-13* — Analyse statique exhaustive des cycles A→B→A à la seule sauvegarde : hors scope ; borne optionnelle `CALL_SCENARIO_MAX_DEPTH` à l'exécution (ENG / ADR-018).

### Critères d'acceptation

- [ ] `AC-DATA-03-1` — Le format JSON de scénario enregistre fidèlement les nœuds, positions, paramètres et liaisons (`CASE-DATA-03-1`).
- [ ] `AC-DATA-03-2` — Les clés d'entrées par défaut sont renumérotées séquentiellement après toute suppression de connexion (`CASE-DATA-03-2`).
- [ ] `AC-DATA-03-3` — Les clés d'entrées personnalisées sont strictement conservées sans altération (`CASE-DATA-03-3`).
- [ ] `AC-DATA-03-4` — Toute collision de clé sur un même bloc cible est strictement interdite et rejetée (`CASE-DATA-03-4`).
- [ ] `AC-DATA-03-5` — La validation structurelle du graphe refuse tout scénario sans Start unique, avec Start à degré entrant > 0, ou avec références de nœuds invalides (`CASE-DATA-03-5`, `R-19`, `R-20`, `REQ-015`, cas limite #4).
- [ ] `AC-DATA-03-6` — Aucun champ listé dans `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`) n'est écrit ni conservé dans le document JSON scénario ; strip à l'écriture et à la lecture (`CASE-DATA-03-6`, `R-37`, `REQ-111`).
- [ ] `AC-DATA-03-7` — Un nœud `callScenario` persiste `targetScenarioId` ; la validation refuse id vide / cible absente et **accepte** self-ref (`CASE-DATA-03-7`, `REQ-039`, `REQ-041`).
- [ ] `AC-DATA-03-8` — Un nœud `command` persiste `commandLine` ; la validation refuse une commande vide (`CASE-DATA-03-8`, `REQ-042`, `REQ-043`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Confirmer que le risque de rupture d'un script If lié à la renumérotation des clés numériques est assumé | Acceptée | Conforme au choix explicite documenté au CDC §8 R-43. |
| Centraliser la no-save list dans une constante TS partagée front/back | Acceptée | 2026-11-04 — Une seule source de vérité (`DOM-018`) évite de re-persister l'état runtime (`status`) sous `.agents/data/` (`R-37`). |

---

## SPEC-DATA-04 — Synchronisation bidirectionnelle UI ↔ Fichiers et exclusion des logs

**Exigences :** `REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `REQ-034`, `REQ-104`, `REQ-111`, `R-36`, `R-37`, `C-03`  
**Statut :** proposé  
**Version :** v1 (2026-09-22)  

### Règle

> Toutes les ressources sous `.agents/data/` sont éditables indifféremment via l'interface graphique ou directement sur le disque (fichiers éditables à la main et versionnables avec git).
> Le système de fichiers constitue l'unique source de vérité : les modifications externes sur disque sont prises en compte immédiatement sans cache persistant opaque.
> Aucun journal d'exécution, fichier de log, chunk de stream ni historique d'agent n'est enregistré sous `.agents/data/`.

### Portée

- Couvre le rechargement transparent à partir du disque pour toutes les opérations de lecture.
- Couvre l'écriture synchrone et atomique sur disque lors des opérations CRUD via l'API/UI.
- Couvre la garantie formelle de zéro fichier de logs ou d'historique sous l'arborescence `.agents/data/`.
- Couvre l'interopérabilité avec les outils de versionnement (Git) et l'édition manuelle de fichiers.
- Ne couvre pas la gestion du streaming temporaire dans la mémoire navigateur → `SPEC-UI-03`.

### Scénarios nominaux

```gherkin
Scénario : Prise en compte immédiate d'une modification externe sur disque
  Étant donné un prompt "p-dev.json" modifié directement dans un éditeur externe par l'utilisateur
  Quand l'UI ou le moteur de blocs sollicite ce prompt
  Alors le contenu relu reflète instantanément la version du fichier sur disque

Scénario : Création de ressource via l'UI et persistance fichier
  Étant donné l'utilisateur créant un agent "agent-test" depuis l'IHM
  Quand l'action de création est validée
  Alors le fichier ".agents/data/agents/agent-test.json" est immédiatement présent sur le disque

Scénario : Vérification de l'absence totale de journaux sous data/
  Étant donné plusieurs exécutions de scénarios terminées avec succès ou en erreur
  Quand on inspecte l'arborescence ".agents/data/"
  Alors aucun dossier "logs/", fichier de trace d'exécution ni historique de conversation n'est créé
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Suppression externe d'une ressource pendant qu'elle est affichée dans l'IHM | Notification claire lors de la prochaine interaction indiquant que la ressource n'existe plus sur le disque. |
| 2 | Conflit d'écriture simultané sur un fichier JSON | Écriture sécurisée (fichier temporaire + renommage atomique si supporté) pour éviter toute corruption de fichier. |
| 3 | Présence de fichiers non reconnus ou d'extensions parasites sous `data/` | Ignorés par les chargeurs sans bloquer le fonctionnement des ressources valides. |

### Ce qui n'est pas défini

- *2026-09-22* — Surveillance en temps réel via watcher de fichiers (`fs.watch`) : optionnel, la relecture à la demande constitue la garantie de base en v1.

### Critères d'acceptation

- [ ] `AC-DATA-04-1` — Toute opération de modification via l'UI est répercutée immédiatement dans le fichier disque correspondant (`CASE-DATA-04-1`).
- [ ] `AC-DATA-04-2` — Le système relit le disque comme source de vérité sans masquer les modifications manuelles de l'utilisateur (`CASE-DATA-04-2`).
- [ ] `AC-DATA-04-3` — Aucun fichier de log, trace d'exécution ni historique de session n'est généré sous `.agents/data/` (`CASE-DATA-04-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la stricte conformité de R-37 (zéro log disque en v1) | Acceptée | Conforme au CDC §8 R-37 et §10 REQ-111. |

---

## SPEC-DATA-05 — Documentation utilisateur exportée sous `.agents/docs/`

**Exigences :** `REQ-003`, `REQ-007`, `REQ-108`, `C-03`, `ADR-005`, `ADR-012`, `ADR-017`  
**Statut :** proposé  
**Version :** v1 (2026-11-08, ADR-017)  

### Règle

> La documentation d'utilisation de ClientsBox est fournie sous forme de fichiers Markdown.
> La source canonique versionnée (documentation **opérateur** / usage du binaire) réside dans le dépôt sous `docs/instructions/**/*.md` et est embarquée dans le livrable au build (`ADR-012`, `ADR-017`). Le dossier `docs/deploy/` (build et déploiement des sources) est hors périmètre d'embarque et d'export.
> Sur action utilisateur explicite d'export, le serveur matérialise un miroir de cette arborescence sous `<workspacePath>/<AGENTS_DIR>/docs/` (par défaut `.agents/docs/`).
> Ce sous-arbre est **distinct** de `.agents/data/` : aucun fichier de documentation utilisateur n'est écrit sous `data/`, et l'export n'entre pas dans le CRUD des ressources déclaratives (`SPEC-DATA-01`…`04`).

### Portée

- Couvre l'emplacement disque `.agents/docs/`, le format `.md`, et le miroir de `docs/instructions/`.
- Couvre l'idempotence / écrasement contrôlé lors d'un ré-export (les fichiers cibles reflètent la source embarquée).
- Couvre l'exclusion des logs, historiques d'exécution et ressources JSON/JS de `data/` hors de ce sous-arbre.
- Ne couvre pas le rendu IHM ni le bouton d'export → `SPEC-UI-04`.
- Ne couvre pas les routes HTTP → `SPEC-SRV-02`.

### Scénarios nominaux

```gherkin
Scénario : Export réussi vers .agents/docs/
  Étant donné une source de documentation utilisateur embarquée non vide
  Quand l'utilisateur déclenche l'export local via l'API
  Alors le dossier ".agents/docs/" existe sous le workspace
  Et chaque fichier Markdown attendu du miroir y est présent avec un contenu cohérent

Scénario : Ré-export écrase le miroir précédent
  Étant donné des fichiers déjà présents sous ".agents/docs/"
  Quand un nouvel export est déclenché
  Alors les fichiers du miroir correspondent à nouveau à la source embarquée
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Dossier `.agents/docs/` absent | Création du dossier puis écriture des fichiers. |
| 2 | Échec d'écriture disque (permissions, espace) | Échec explicite en français, sans écriture partielle corrompue sous `data/`. |
| 3 | Contenu parasite hors miroir sous `.agents/docs/` | Non exigence v1 de purge totale ; l'export garantit la présence/écrasement des fichiers du manifeste. |

### Ce qui n'est pas défini

- *2026-11-08* — Édition collaborative ou synchronisation Git automatique de `.agents/docs/` : hors v1.

### Critères d'acceptation

- [ ] `AC-DATA-05-1` — Après export réussi, l'arborescence Markdown miroir est présente sous `.agents/docs/` (`CASE-DATA-05-1`).
- [ ] `AC-DATA-05-2` — L'export n'écrit aucun fichier de documentation sous `.agents/data/` (`CASE-DATA-05-2`).
- [ ] `AC-DATA-05-3` — Un ré-export met à jour le miroir à partir de la source embarquée sans exiger de nettoyage manuel préalable (`CASE-DATA-05-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Séparer docs/ de data/ pour préserver ADR-005 | Acceptée | Aligné ADR-017. |
