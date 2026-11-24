# ADR-018 — CallScenario : sous-runner in-process et identité du run racine

**Statut :** proposé  
**Date :** 13/11/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| R-46, REQ-039, REQ-040, REQ-041 | Contrat CallScenario, sous-exécution, profondeur env optionnelle |
| R-25, REQ-026 | Échec enfant ⇒ arrêt global du scénario racine |
| R-34, REQ-025 | Stop racine ⇒ halt récursif sous-exécution |
| REQ-024 | Inspection / recovery limitées au scénario racine |
| R-08, R-09, R-42* | Modèle de bloc + join/power inchangés |
| CDC v2.1 | Typologie à 5 blocs ; Annexe B.4 CallScenario |

Cet ADR **complète** [`ADR-004`](./ADR-004-moteur-blocs.md) : le moteur événementiel par graphe reste la base ; ici on fige **comment** un bloc appelle un autre graphe sans casser le mono-run HTTP.

---

## Contexte

Le CDC v2.1 introduit le bloc **CallScenario** : au join OK, charger un scénario cible, l'exécuter jusqu'à terminaison, puis émettre `{ blockType: 'callScenario', value: null, power: 1 }`. Contraintes :

- un seul run HTTP « visible » à la fois (`activeRunner` / `activeScenarioId`) ;
- l'enfant ne doit **pas** être récupérable sur son canvas ;
- pas d'état interne enfant exposé en V1 de la feature ;
- échec enfant = échec du bloc parent (R-25).

Il faut décider l'architecture runtime de la sous-exécution.

## Options envisagées

### Option A — Sous-`ScenarioRunnerService` in-process sous le parent (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Await naturel ; halt récursif ; `activeScenarioId` reste la racine ; pas de second POST /run |
| Ce qu'elle coûte | Composition de runners ; borne de profondeur optionnelle via env |
| Ce qu'elle rend difficile plus tard | Scaling multi-process / reprise après crash (déjà exclu R-37) |

### Option B — Second run HTTP (`POST /run` sur l'enfant)

| | |
|---|---|
| Ce qu'elle apporte | Réutilisation pure des handlers existants |
| Ce qu'elle coûte | Conflit avec mono-runner (409) ; recovery canvas enfant ; identité run ambiguë |
| Ce qu'elle rend difficile plus tard | Contredit REQ-040 |

### Option C — Aplatir le graphe enfant dans le parent au load

| | |
|---|---|
| Ce qu'elle apporte | Un seul scheduler |
| Ce qu'elle coûte | Explosion du graphe ; Start enfant / ids / pastilles ambiguës ; anti-cycles plus dur |
| Ce qu'elle rend difficile plus tard | Isolation sessions et non-exposition enfant |

## Décision

1. **CallScenario** est un 5ᵉ type de nœud exécuté par le moteur ADR-004 après join OK.
2. L'exécution enfant est un **sous-runner in-process** (même processus Node), créé pour le graphe cible, **await** jusqu'à `completed` / `error` / `stopped`.
3. Le holder HTTP **`activeRunner` / `activeScenarioId`** reste le scénario **racine** pendant toute la durée du nested run. Aucun `POST /run` n'est émis pour l'enfant.
4. **Snapshot / SSE** (`GET …/run`, stream) du scénario enfant **ne publient pas** l'état du sous-run ; ouvrir le canvas enfant pendant l'appel = idle / foreign run (pas de pastilles nested).
5. **Sessions agent** du sous-runner = table **isolée** (nouvelle instance registry) — pas de partage parent↔enfant en V1 (`SPEC-ADPT-03`).
6. **Échec / stop enfant non réussi** ⇒ exception / `failBlock` sur le nœud CallScenario parent ⇒ halt global racine (R-25) + kill des spawns de toute la chaîne.
7. **Stop racine** ⇒ halt récursif du sous-runner + `stopActiveProcesses` sur parent et enfants.
8. **Récursion / profondeur :** auto-appel (`targetScenarioId === id du scénario courant`) **autorisé**. Profondeur max lue via `CALL_SCENARIO_MAX_DEPTH` (LIB-005 / `env-layout.resolver`) : **`-1`** ou absente = **illimité** ; sinon plafond entier ≥ 0 (REQ-041).
9. **Message de succès :** `{ blockType: 'callScenario', value: null, power: 1 }` sur chaque sortie câblée ; sac non lu ; aucun paramètre métier parent↔enfant.

## Raisons

- Seule l'option A honore REQ-040 (identité racine + non-recovery enfant) sans casser le mono-run HTTP.
- B viole le holder unique et expose l'enfant.
- C casse l'isolation et la lisibilité du canvas.

## Conséquences acceptées

- Les chunks CLI enfant sont **relayés** sur `chunkReceived` du runner racine (terminal parent / SSE) ; ils ne constituent **pas** une recovery du canvas enfant (`SPEC-UI-03`, `AC-ENG-03-6`).
- Boucles natives / End / params métier parent↔enfant restent hors scope (CDC v2.1 hors périmètre).
- Les schémas de validation `targetScenarioId` et les AC associés vivent dans **SPEC-DATA-03** / **SPEC-ENG-03**.

## Ce qui nous ferait revenir dessus

- Exigence d'inspecter / reprendre le canvas d'un scénario enfant en live.
- Passage de paramètres / résultats métier entre parent et enfant.
- Historisation fichier des exécutions (remise en cause de R-37).

## Liens

- Moteur de base : **ADR-004**.  
- Sessions : **ADR-002** / **SPEC-ADPT-03**.  
- Persistance graphe : **ADR-005** / **SPEC-DATA-03**.  
- Impact : `tdd/docs/impact/impact-CR-008-call-scenario-block.md`.  
- CDC : `tdd/docs/cdc/cahier-des-charges-v2.1.md`.
