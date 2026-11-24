# CASE-UI-02-18 — Bloc CallScenario : toolbar et dropdown `targetScenarioId`

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-11`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, `ADR-018`  
**Modules cibles :** `UI-023` (toolbar), `UI-024` (inspecteur), `UI-008` (canvas state), `UI-031` (studio)

---

## Ce que ce cas protège

Le canvas Studio doit permettre d'ajouter un bloc **CallScenario** depuis la toolbar et de choisir le paramètre statique **`targetScenarioId`** via un dropdown listant les scénarios du projet **y compris** le scénario courant (auto-appel autorisé) (`REQ-039`, `REQ-041`, `R-46`). Aucun champ de paramètre métier in/out n'est exposé : uniquement les ports power (1..N in / 0..N out).

Sans ce geste UI, l'opérateur ne pourrait pas composer un graphe nested conforme au CDC v2.1.

---

## Cas

```gherkin
Scénario : Ajout d'un bloc CallScenario depuis la toolbar
  Étant donné le Scenario Studio ouvert sur le scénario "parent"
  Quand l'utilisateur clique sur l'action d'ajout CallScenario (`data-action="add-call-scenario"`)
  Alors un nœud de type "callScenario" apparaît sur le canvas
  Et le nœud expose des ports d'entrée et de sortie power (pas de ports métier dédiés)

Scénario : Dropdown targetScenarioId inclut le scénario courant
  Étant donné un bloc CallScenario sélectionné
  Et la liste des scénarios projet contenant "parent", "enfant-a", "enfant-b"
  Quand l'inspecteur affiche le champ targetScenarioId
  Alors les options proposées incluent "enfant-a", "enfant-b" et "parent"

Scénario : Le choix met à jour le modèle canvas
  Étant donné un CallScenario dont targetScenarioId est positionné à "enfant-a"
  Quand le modèle de nœud est lu côté Studio
  Alors le nœud a type "callScenario" et targetScenarioId "enfant-a"
```

---

## Données

| Élément | Valeur |
|---|---|
| Type nœud | `callScenario` |
| Action toolbar | `[data-action="add-call-scenario"]` |
| Champ inspecteur | `targetScenarioId` (dropdown) |
| Inclusion | id du scénario ouvert dans le Studio (autorisé) |
| Ports | power multi-câbles ; pas de I/O métier |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Ajout toolbar | nœud `callScenario` | AC-UI-02-11 |
| Self dans dropdown | présent | REQ-041 |
| Champ métier in/out | absent | R-46 / REQ-039 |

---

## Ce que ce cas ne vérifie pas

- Exécution await / émission power → `CASE-ENG-03-7` ;
- Non-recovery canvas enfant → `CASE-UI-03-10` ;
- Round-trip disque / validation backend → `CASE-DATA-03-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_18_call_scenario_toolbar_and_target_dropdown`  
**Fichier :** `tests/units/ui/CASE-UI-02-18.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'ajout d'un nœud `callScenario` depuis la toolbar.
- [ ] Le test vérifie que le dropdown **inclut** le scénario courant.
- [ ] Le test vérifie l'absence de champs métier in/out dédiés.
- [ ] Le nom du test contient `CASE_UI_02_18`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1.
