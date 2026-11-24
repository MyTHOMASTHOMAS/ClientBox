# CASE-DATA-03-7 — Nœud `callScenario` : persistance et validation de `targetScenarioId`

**Spécification :** `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-DATA-03-7`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-005`, `ADR-018`  
**Modules cibles :** schémas / validateur graphe scénario, store `scenarios/`  

---

## Ce que ce cas protège

Un nœud de type **`callScenario`** doit persister le paramètre statique **`targetScenarioId`** dans le JSON sous `.agents/data/scenarios/`. La validation refuse un id vide et, selon le moment de contrôle, une cible absente du disque. L'auto-référence (`targetScenarioId` = id du scénario courant) est **acceptée** (`REQ-039`, `REQ-041`, `R-46`).

Sans cela, un graphe invalide (id vide / cible introuvable) serait sauvegardé ou un CallScenario pointerait vers le néant.

---

## Cas

```gherkin
Scénario : Persistance de targetScenarioId
  Étant donné un scénario "parent" contenant un nœud
    { id: "c1", type: "callScenario", targetScenarioId: "enfant", position: { x: 0, y: 0 } }
  Quand le scénario est sérialisé puis relu depuis ".agents/data/scenarios/parent.json"
  Alors le nœud "c1" a type "callScenario"
  Et targetScenarioId vaut "enfant"

Scénario : Acceptation self-ref
  Étant donné un nœud callScenario avec targetScenarioId égal à "parent" dans le scénario "parent"
  Quand on valide le document
  Alors la validation réussit pour ce critère (REQ-041 — auto-appel autorisé)

Scénario : Rejet id vide ou whitespace
  Étant donné un nœud callScenario avec targetScenarioId "" ou "   "
  Quand on valide le document
  Alors la validation échoue (REQ-041)

Scénario : Cible absente du disque
  Étant donné targetScenarioId "inconnu" sans fichier scenarios/inconnu.json
  Quand on valide le document ou qu'on exécute le bloc
  Alors une erreur de validation ou d'exécution est signalée (REQ-041 / R-25, cas limite SPEC-DATA-03 #8)
```

---

## Données

| Élément | Valeur |
|---|---|
| Type nœud | `callScenario` |
| Champ | `targetScenarioId` |
| Self-ref | `targetScenarioId === scenarioId` (accepté) |
| Id vide | `""` ou whitespace seul |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Round-trip `targetScenarioId` | conservé | AC-DATA-03-7 |
| Self-ref | accepté | AC-DATA-03-7 / REQ-041 |
| Id vide | rejet | AC-DATA-03-7 / REQ-041 |
| Cible absente | rejet validation **ou** échec exécution | SPEC-DATA-03 #8 / REQ-041 |

---

## Ce que ce cas ne vérifie pas

- Exécution await du sous-scénario → `CASE-ENG-03-7` ;
- Profondeur max à l'exécution seule → `CASE-ENG-03-7` ;
- Strip no-save → `CASE-DATA-03-6`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_03_7_call_scenario_target_scenario_id_persist_and_validate`  
**Fichier :** `tests/units/data/CASE-DATA-03-7.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie la persistance / relecture de `targetScenarioId`.
- [ ] Le test **accepte** self-ref et **rejette** id vide.
- [ ] Le test couvre une cible absente (validation ou exécution).
- [ ] Le nom du test contient `CASE_DATA_03_7`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1.
