# CASE-ENG-03-7 — Bloc CallScenario : await sous-scénario et émission `power: 1`

**Spécification :** `SPEC-ENG-03`, `SPEC-ENG-01`  
**Critère d'acceptation :** `AC-ENG-03-5`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-018`  
**Service / contrats cibles :** `SVC-001` (runner + sous-runner), store scénarios  

---

## Ce que ce cas protège

Le bloc **CallScenario** (`R-46`, `REQ-039`) charge un scénario cible, l'exécute en **sous-runner in-process** (ADR-018), **attend** sa fin, puis émet `{ blockType: 'callScenario', value: null, power: 1 }` sur chaque sortie câblée. Il ne lit pas le sac. L'identité du run reste le scénario **racine** (`REQ-040`).

Sans await, le graphe parent continuerait trop tôt ; sans message conforme, le join aval casse. Un **échec de l'enfant** ou un **dépassement** de `CALL_SCENARIO_MAX_DEPTH` (si configuré ≥ 0) doivent faire échouer le bloc et déclencher l'arrêt global racine. L'auto-appel est **autorisé** (`REQ-041`, `R-25`, `AC-ENG-03-5`).

---

## Cas

```gherkin
Scénario : Exécution nominale CallScenario
  Étant donné un scénario parent "parent" avec Start --> Call-1(targetScenarioId="enfant") --> Run-after
  Et un scénario "enfant" valide Start --> Run-child (adapter simulé, succès)
  Quand ScenarioRunnerService.run() exécute "parent"
  Alors le sous-scénario "enfant" est lancé in-process et terminé avant l'émission de Call-1
  Et Call-1 émet sur sa sortie "{ blockType: 'callScenario', value: null, power: 1 }"
  Et Run-after est exécuté après Call-1
  Et l'identité du run (racine / activeScenarioId) reste "parent" pendant toute la durée
  Et Call-1 ne lit pas le sac d'entrées

Scénario : Échec du sous-scénario remonte au parent
  Étant donné un CallScenario vers "enfant" dont l'exécution échoue (ex. Run-child exit non nul)
  Quand l'échec remonte au bloc CallScenario
  Alors le bloc CallScenario passe au statut d'erreur
  Et le scénario racine bascule en erreur globale (R-25)
  Et aucune émission power n'est propagée en aval du CallScenario

Scénario : Auto-appel autorisé
  Étant donné un bloc CallScenario avec targetScenarioId égal à l'id du scénario courant
  Et une condition métier qui termine la récursion (ex. If / stub court sans re-appel)
  Quand le join d'entrée est satisfait et le bloc s'exécute
  Alors le sous-scénario du même id démarre in-process
  Et le bloc CallScenario se termine avec succès si l'enfant réussit (REQ-041)

Scénario : Dépassement de CALL_SCENARIO_MAX_DEPTH
  Étant donné CALL_SCENARIO_MAX_DEPTH=2
  Et une chaîne CallScenario imbriquée de profondeur 3
  Quand le 3e niveau est sollicité
  Alors le bloc CallScenario fautif échoue (REQ-041)
  Et le scénario racine est arrêté globalement
  # Si CALL_SCENARIO_MAX_DEPTH est absent ou -1, aucune limite n'est appliquée
```

---

## Données

| Élément | Valeur |
|---|---:|
| Parent | `Start → Call-1(enfant) → Run-after` |
| Enfant | `Start → Run-child` (succès ou échec simulé) |
| Message succès | `{ blockType: "callScenario", value: null, power: 1 }` |
| Profondeur max | `CALL_SCENARIO_MAX_DEPTH` (`-1` / absente = illimité) |
| Self-call | `targetScenarioId === scenario.id` (autorisé) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Ordre | enfant completed **avant** émission Call-1 | await ADR-018 |
| Message | `callScenario` / `null` / `1` | REQ-039 / REQ-038 |
| Identité run | id parent (racine) | REQ-040 |
| Échec enfant | CallScenario en erreur + halt racine | AC-ENG-03-5 / R-25 |
| Self-call | sous-exécution OK (si enfant réussit) | REQ-041 |
| Profondeur > max (env ≥ 0) | erreur + halt | REQ-041 |

---

## Ce que ce cas ne vérifie pas

- Kill détaillé des spawns parallèles parent+enfant et Stop manuel récursif → `CASE-ENG-04-11` ;
- Isolation des tables de sessions → `CASE-ADPT-03-6` ;
- Snapshot HTTP enfant / 409 → `CASE-SRV-02-19` ;
- Dropdown UI → `CASE-UI-02-18` ;
- Persistance `targetScenarioId` → `CASE-DATA-03-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_03_7_call_scenario_await_emit_power_and_depth_limit`  
**Fichier :** `tests/units/eng/CASE-ENG-03-7.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie que l'émission CallScenario survient **après** la fin du sous-scénario.
- [ ] Le test vérifie le message `{ blockType: 'callScenario', value: null, power: 1 }`.
- [ ] Le test vérifie que l'identité du run reste le parent.
- [ ] Le test vérifie qu'un échec enfant fait échouer CallScenario et arrête le scénario racine.
- [ ] Le test vérifie qu'un self-call peut réussir (stub sans re-appel infini).
- [ ] Le test vérifie l'échec si profondeur > `CALL_SCENARIO_MAX_DEPTH` (env ≥ 0).
- [ ] Le nom du test contient `CASE_ENG_03_7`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1 — `AC-ENG-03-5` pointe ici car `CASE-ENG-03-5` est déjà pris (sac). Détail Stop/spawns → `CASE-ENG-04-11`.
