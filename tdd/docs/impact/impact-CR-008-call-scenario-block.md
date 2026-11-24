# Analyse d'impact — CR-008 (Blocs CallScenario + Command — CDC v2.1)

**Demande du client :**  
1. **CallScenario** — 5ᵉ type de bloc : démarrer un scénario depuis un autre (dropdown), await enfant sans paramètres métier, graphe parent poursuivi ; enfant non recoverable / état interne non exposé en V1.  
2. **Command** — 6ᵉ type de bloc : fournir et exécuter une **commande shell OS** (hors adapters agents), await terminaison, puis poursuivre le graphe parent (power only).  

**Reçue le :** 13/11/2026 *(CallScenario)* / 13/11/2026 *(extension Command)*  
**Rédigée par :** Autrement (`U`) / Composer (Consensus TDD)  
**Branche Git dédiée :** `feat/subscenario-block`  
**Cible documentaire :** **CDC v2.1** (amendement versionné de [`cahier-des-charges-v2.md`](../cdc/cahier-des-charges-v2.md) verrouillé en v2) — typologie **6** blocs.

---

> **Règle fondamentale TDD :**
> Interdiction formelle de modifier le code de production avant la ratification de cette analyse, l’amendement du CDC **v2.1**, la mise à jour des spécifications / cas de test, et la vérification des tests unitaires rouges.  
> La chaîne descend impérativement : CDC $\rightarrow$ Specs $\rightarrow$ Signatures & Architecture $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.  
> *Note d’avancement :* CallScenario est déjà chaîné (CDC / specs / CASEs / code). L’extension **Command** reprend la **même chaîne** pour les livrables encore manquants (CDC § Command, specs, CASEs, tests rouges, code).

---

## 1. Ce que le client demande, reformulé

ClientsBox compose aujourd’hui des graphes avec **cinq** types déjà cadrés en v2.1 brouillon (`Start`, `Run`, `If`, `ClearContext`, `CallScenario`). Le client veut en outre un bloc **Command** pour exécuter une commande shell fournie dans le scénario.

### 1.1 — CallScenario (rappel)

1. **Nouveau type `CallScenario`** (toolbar + inspecteur).
2. **Paramètre statique** : `targetScenarioId` (dropdown, **y compris** scénario courant).
3. **Flux power uniquement** : ≥1 entrée / ≥0 sorties ; sac **non** lu ; aucun payload métier vers l’enfant.
4. **Sémantique** : join OK → sous-exécution in-process → await → sortie `{ blockType: 'callScenario', value: null, power: 1 }`.
5. **Échec enfant** ⇒ échec bloc ⇒ arrêt global racine (**R-25** / **REQ-026**).
6. **Observabilité V1** : enfant non recoverable sur son canvas ; pas d’UI d’état interne enfant (chunks CLI enfant relayés au terminal parent sans pastilles enfant — CASE-ENG-03-8).

### 1.2 — Command (extension)

1. **Nouveau type de bloc `Command`** dans le canvas (toolbar + inspecteur).
2. **Paramètre statique unique (V1)** : texte de commande `commandLine` (saisie libre ; non vide).
3. **Hors adapters agents** : **ne** réutilise **pas** `agentId` / `promptId` / `exitId` ; distinct du bloc **Run**.
4. **Flux power uniquement** : au moins **une entrée** et **une sortie** power (contrat join / R-42) ; sac **non** lu.
5. **Sémantique d’exécution** : au join OK, spawn la commande dans le **workspace** du projet (cwd = `workspacePath`), **attendre** la fin du processus, puis :
   - exit code **0** → émettre `{ blockType: 'command', value: null, power: 1 }` sur les sorties câblées ;
   - exit code **≠ 0** (ou spawn impossible) → **échec du bloc** → arrêt global (**R-25**).
6. **Observabilité** : stdout / stderr relayés vers le terminal du run racine (`chunkReceived`) ; Stop racine **tue** le processus Command en cours.
7. **Hors scope V1 Command** : parsing avancé d’argv multiplateforme, variables d’env custom par bloc, timeout configurable UI, capture de `value` métier depuis stdout.

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision |
|---|---|---|
| 1 | « Pas d’entrée / pas de sortie » (CallScenario) = zéro port ? | **Non.** Zéro **paramètre métier**. **1 entrée power + 1 sortie power** min. pour le graphe. |
| 2 | Échec scénario enfant ? | Bloc `CallScenario` **échoue** → R-25 parent/racine. |
| 3 | Version CDC cible ? | **CDC 2.1** (CallScenario **et** Command). |
| 4 | Visibilité / recovery enfant CallScenario ? | **Non** en V1 (identité run = racine). |
| 5 | Passage de données parent ↔ enfant CallScenario ? | **Hors scope** V1. |
| 6 | Command = shell OS, CLI adapter brut, ou template pour Run ? | **Shell OS** — commande fournie telle quelle, hors adapters agents (distinct de Run). |
| 7 | Command lit-elle le sac / produit une `value` ? | **Non** en V1 — power only ; `value: null` (comme ClearContext / CallScenario). |
| 8 | Cwd / env de Command ? | **cwd** = workspace projet ; **env** = process host (pas de map env UI en V1). |
| 9 | Échec Command (exit ≠ 0) ? | **Échec de bloc** → arrêt global (**R-25**), même chaîne que Run/CallScenario. |

---

## 3. Impact — Cahier des charges (**CDC v2 → v2.1**)

Le CDC v2 est **verrouillé**. La feature **exige** (et étend) la version **v2.1** : typologie élargie à **6** blocs + nouvelles exigences, sans casser le contrat join/power.

### 3.1 — Exigences / règles CDC

| Exigence | Impact | Action (v2.1) |
|---|---|---|
| Vision / accroche (liste des types de blocs) | **Modifiée** | **Start / Run / If / ClearContext / CallScenario / Command**. |
| Objectif métier #5 | **Modifiée** | Composition scénario→scénario **et** exécution de commandes shell via `Command`. |
| Périmètre — liste des blocs | **Modifiée** | Blocs v2.1 : les **six** types ; **pas de End** ; boucles natives hors scope. |
| Hors périmètre — « blocs hors … » | **Modifiée** | Retirer `CallScenario` **et** `Command` du hors-scope. |
| Annexe B — typologie | **Modifiée** | Lignes **CallScenario** + **Command** (voir §3.2). |
| **R-08** / **R-09** | **Inchangées / illustrées** | Deux spécialisations supplémentaires. |
| **R-16** / formulations typologie fermée | **Modifiées** | Inclure `CallScenario` **et** `Command`. |
| **R-25** / **REQ-026** | **Précisées** | Échec sous-exécution CallScenario **ou** Command (exit ≠ 0) = échec bloc → arrêt racine. |
| **R-34** / **REQ-025** (Stop) | **Précisées** | Stop racine tue aussi processus CLI Command (comme spawns Run / enfant CallScenario). |
| **R-37** | **Inchangée** | Pas d’historisation fichier des exécutions. |
| **R-42*** / **REQ-037** | **Inchangées** | CallScenario **et** Command obéissent au join ; **N = 0** ⇒ jamais exécutés. |
| **REQ-014** | **Complétée** | Toolbar + inspecteur : CallScenario **et** Command. |
| **REQ-017** … **REQ-020** | **Inchangées** | Ne pas surcharger Run/If/ClearContext ; REQ dédiées. |
| **REQ-024** | **Nuancée** | Inspection live = scénario **racine** (Command = pastille du bloc parent seulement). |
| **REQ-105** / **REQ-107** | **Complétées** | Recettes incluant CallScenario **et** Command. |
| **REQ-039** … **REQ-041** / **R-46** | **Ajoutées** | Contrat CallScenario (déjà dans v2.1 brouillon). |
| **REQ-042** *(nouvelle)* | **Ajoutée** | Contrat bloc `Command` : param `commandLine` ; ports power ; sac non lu ; await process ; sortie `{ blockType: 'command', value: null, power: 1 }` si exit 0 ; sinon erreur bloc. |
| **REQ-043** *(nouvelle)* | **Ajoutée** | Command : cwd = workspace ; stdout/stderr → terminal run racine ; Stop racine interrompt le process ; `commandLine` vide / invalide ⇒ erreur de bloc (R-25). |
| **R-47** *(nouvelle)* | **Ajoutée** | Règle métier miroir de REQ-042 / REQ-043 (formulation courte Annexe règles). |

### 3.2 — Lignes Annexe B proposées (CDC v2.1)

| Type | Entrées | Lit le sac ? | Params statiques | Sorties | Comportement |
|---|---|---|---|---|---|
| **CallScenario** | **1..N** | Non | `targetScenarioId` | **0..N** × power **1** | Join ; await sous-scénario ; échec enfant ⇒ R-25 ; value `null` |
| **Command** | **1..N** | Non | `commandLine` | **0..N** × power **1** | Join ; spawn shell OS dans le workspace ; await ; exit 0 ⇒ power 1 ; exit ≠ 0 ⇒ R-25 ; value `null` |

*(Studio : **1** entrée / **1** sortie par défaut, comme ClearContext simplifié.)*

### 3.3 — Historique CDC (§12)

| Version | Date | Statut | Retour |
|---|---|---|---|
| **v2.1** | 13/11/2026 | brouillon → à verrouiller | CR-008 — CallScenario **+** Command (composition scénario→scénario + commande shell) |

**Livrable CDC :** [`cahier-des-charges-v2.1.md`](../cdc/cahier-des-charges-v2.1.md) (étendre le brouillon actuel : typologie 6 blocs, R-47, REQ-042…043).

---

## 4. Impact — Spécifications fonctionnelles

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| [`SPEC-ENG-01`](../specs/ENG.md) | **Modifiée** | `blockType` += `'callScenario'` **et** `'command'` ; value = `null`. |
| [`SPEC-ENG-02`](../specs/ENG.md) | **Inchangée au fond** | Join / power / N=0 ; exemples CallScenario **et** Command. |
| [`SPEC-ENG-03`](../specs/ENG.md) | **Modifiée** | Portée **6** types ; sections comportement CallScenario **et** Command (await process, émission power 1, fail exit ≠ 0). |
| [`SPEC-ENG-04`](../specs/ENG.md) | **Modifiée** | R-25 : échec sous-scénario **ou** Command ; Stop tue process Command tracké. |
| [`SPEC-UI-02`](../specs/UI.md) | **Modifiée** | Toolbar + inspecteur : dropdown CallScenario ; champ texte `commandLine` pour Command ; labels FR. |
| [`SPEC-UI-03`](../specs/UI.md) | **Modifiée** | Terminal : chunks Command → run racine ; Stop racine. |
| [`SPEC-SRV-02`](../specs/SRV.md) | **Modifiée (CallScenario)** / **mineure (Command)** | Nested CallScenario déjà cadré ; Command = spawn local sans second HTTP. |
| [`SPEC-DATA-03`](../specs/DATA.md) | **Modifiée** | Types `callScenario` + `command` ; champs `targetScenarioId` / `commandLine` ; validation non vide. |
| [`SPEC-ADPT-03`](../specs/ADPT.md) | **Précisée (CallScenario)** / **N/A Command** | Sessions isolées sous-runner ; Command n’utilise pas les adapters. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Modifiée** | Indexation REQ-039…043 / R-46 / R-47 / AC associés. |
| Specs ARCH | **Inchangées au fond** | Nouveaux modules `src/` à signer (`CASE-ARCH-08`). |

---

## 5. Impact — Conception & Architecture technique

| Artefact | Impact | Ce qui change |
|---|---|---|
| [`ADR-018`](../adr/ADR-018-call-scenario-sous-runner.md) | **Déjà rédigé** (CallScenario) | Sous-runner in-process, borne profondeur, non-exposition enfant. |
| [`ADR-019`](../adr/ADR-019-bloc-command.md) | **Rédigé** (Command) | Bloc Command : spawn shell via `lib/process`, tracking dans `active-processes`, pas d’adapter CLI agent. |
| UML / domain | **Modifié** | Types de nœud `callScenario` + `command`. |
| Modèle de données nœud | **Modifié** | `targetScenarioId` ; **`commandLine`** (persisté) ; runtime no-save (`DOM-018`). |
| Architecture runner | **Étendue** | CallScenario nested + exécuteur Command (réutiliser bag spawns / halt Stop). |
| Couplage DAG (`SPEC-ARCH-01`) | **À respecter** | Command ne remonte pas vers HTTP ; spawn uniquement via `lib/process`. |

Question explicite : **oui**, Command introduit une **spécialisation de nœud** et un **chemin d’exécution process** distinct de Run — non absorbable par un paramètre Run existant.

---

## 6. Impact — Tests

### 6.1 — CallScenario (déjà rédigés / verts)

| Cas de test | Impact | Description |
|---|---|---|
| `CASE-ENG-03-7` | **Rédigé** | Await + power 1 ; profondeur `CALL_SCENARIO_MAX_DEPTH`. |
| `CASE-ENG-03-8` | **Rédigé** | Chunks enfant relayés au parent. |
| `CASE-ENG-04-11` | **Rédigé** | Halt récursif / Stop nested. |
| `CASE-UI-02-18` | **Rédigé** | Toolbar + dropdown (scénario courant inclus). |
| `CASE-UI-03-10` | **Rédigé** | Canvas enfant non hydraté ; Stop racine. |
| `CASE-SRV-02-19` | **Rédigé** | `activeScenarioId` = racine. |
| `CASE-DATA-03-7` | **Rédigé** | Persistance / validation `targetScenarioId`. |
| `CASE-ADPT-03-6` | **Rédigé** | Sessions isolées sous-runner. |

### 6.2 — Command (rédigés)

| Cas de test | Impact | Description |
|---|---|---|
| `CASE-ENG-03-9` | **Rédigé** | Await Command ; exit 0 ⇒ `command` / null / 1 ; exit ≠ 0 ⇒ fail bloc. |
| `CASE-ENG-04-12` | **Rédigé** | Stop pendant Command ⇒ process tué + halt. |
| `CASE-UI-02-19` | **Rédigé** | Toolbar + inspecteur champ `commandLine` (FR, lecture seule pendant run). |
| `CASE-DATA-03-8` | **Rédigé** | Persistance / validation `commandLine` non vide ; type `command`. |
| Sommaires `tdd/tests/**/sommaire.md` | **Modifiés** | Indexation des CASE Command. |
| Tests unitaires miroirs | **À écrire (rouge puis vert)** | Alignés sur les fiches CASE Command. |
| Socle existant | **Inchangé attendu** | Aucune régression Start/Run/If/ClearContext/CallScenario. |

---

## 7. Impact — Code source (après chaîne doc)

| Fichier / Module | Impact | Description |
|---|---|---|
| `src/types/models/node.model.ts` | **Évolution** | `NodeType` += `'command'` ; champ `commandLine?: string`. |
| `src/types/messages/block-message.message.ts` | **Évolution** | `BlockType` += `'command'`. |
| `src/services/runner/blocks/runner-block.executors.ts` | **Évolution** | Case exécuteur Command (+ CallScenario déjà présent). |
| `src/services/runner/process/*` | **Évolution** | Spawn / track process Command (réutiliser bag + handlers ou helper dédié). |
| `src/lib/process/child-process.spawner.ts` | **Réutiliser / étendre au besoin** | Spawn shell workspace sans adapter agent. |
| UI canvas (toolbar, node, inspector, i18n) | **Évolution** | Bloc Command + champ commande. |
| Validateur d’intégrité graphe / schéma nœud | **Évolution** | `commandLine` requis si type `command`. |
| `tdd/docs/signature/signature-*.md` | **Évolution** | Inventaire si nouveaux modules. |
| `docs/instructions/scenarios/blocs.md` | **Évolution** | Doc utilisateur CallScenario **et** Command. |

---

## 8. Effets de bord identifiés & Solutions

### CallScenario (rappel)

1. **Mono-runner HTTP vs nested** → sous-runner in-process ; `activeRunner` = racine.  
2. **Recovery canvas enfant** → REQ-040.  
3. **Cycles / auto-appel** → REQ-041 + `CALL_SCENARIO_MAX_DEPTH`.  
4. **Stop partiel** → halt récursif.  
5. **Sessions** → registry isolé par runner.  
6. **Terminal** → relay chunks sans pastilles enfant (ENG-03-8).

### Command (nouveaux)

7. **Confusion avec Run**  
   * *Risque :* utilisateur configure un agent sur Command.  
   * *Solution :* type dédié ; inspecteur **sans** agent/prompt/exit ; doc utilisateur explicite.

8. **Injection / commande dangereuse**  
   * *Risque :* exécution arbitraire dans le workspace.  
   * *Solution V1 acceptée :* même confiance que l’utilisateur local (ClientsBox = outil local) ; pas de sandbox OS supplémentaire dans cette passe.

9. **Portabilité shell (Windows vs POSIX)**  
   * *Risque :* `commandLine` interprété différemment.  
   * *Solution V1 :* spawn via shell de la plateforme hôte (`cmd` / `sh` selon OS) documenté en SPEC-ENG-03 ; pas de normalisation cross-OS.

10. **Process orphelin au Stop**  
    * *Risque :* Command non trackée ⇒ survie après Stop.  
    * *Solution :* enregistrer le handle dans `runner-active-processes` (même bag que Run).

11. **Sortie non nulle « attendue »**  
    * *Risque :* scripts qui exit 1 sans vouloir fail le scénario.  
    * *Solution V1 :* exit ≠ 0 = **toujours** échec bloc ; pas de mode « ignore exit » (hors scope).

---

## 9. Ce que nous ne ferons pas dans cette passe

**CallScenario :**  
- Paramètres / résultats métier parent ↔ enfant.  
- Pastilles / recovery canvas enfant.  
- Partage de sessions agent parent ↔ enfant.

**Command :**  
- Variables d’environnement custom par bloc / timeout UI.  
- Capture de stdout comme `value` métier.  
- Mode « ne pas fail si exit ≠ 0 ».  
- Exécution distante / hors workspace.

**Commun :**  
- Bloc End, boucles natives, branche d’erreur canvas.  
- Historisation fichier des exécutions (R-37).

---

## 10. Ordre d’exécution retenu (Chaîne TDD)

| # | Étape | Livrable |
|---|---|---|
| 1 | **Analyse d’impact** | Le présent fichier — **ratification client** (CallScenario + Command). |
| 2 | **CDC v2.1** | Étendre [`cahier-des-charges-v2.1.md`](../cdc/cahier-des-charges-v2.1.md) : typologie **6** blocs, R-47, REQ-042…043, Annexe B, historique. |
| 3 | **ADR** | ADR-018 (CallScenario, fait) + [`ADR-019`](../adr/ADR-019-bloc-command.md) (Command, fait) / amendement ADR-004. |
| 4 | **Spécifications** | ENG, UI, DATA, SRV, sommaire — delta Command. |
| 5 | **Signatures** | Inventaires si nouveaux modules `src/`. |
| 6 | **Fiches CASE** | CASE Command (§6.2) + sommaires — **fait**. |
| 7 | **Tests automatisés (Rouge)** | Miroirs Vitest Command. |
| 8 | **Code (Vert)** | Types → exécuteur Command → track/Stop → UI → validation. |
| 9 | **Qualité** | `npm run test:unit`, `npm run quality`, doc `blocs.md`. |

---

## 11. Synthèse — verdict d’impact CDC

| Question | Réponse |
|---|---|
| La feature casse-t-elle le CDC v2 verrouillé ? | **Oui** sans versionner : typologie à **4** blocs (v2) / hors-périmètre. |
| Faut-il un CDC **v2.1** ? | **Oui** — CallScenario **et** Command. |
| Typologie v2.1 cible ? | **6** blocs : Start, Run, If, ClearContext, CallScenario, Command. |
| Le modèle join/power est-il remis en cause ? | **Non** — les deux blocs s’y conforment. |
| Nouvelles exigences Must ? | **Oui** — REQ-039…041 / R-46 (CallScenario) + **REQ-042…043 / R-47** (Command). |
| Le code Command peut-il démarrer maintenant ? | **Non** — attendre ratification de ce CR étendu puis CDC v2.1 (delta Command) → specs → tests rouges. |
