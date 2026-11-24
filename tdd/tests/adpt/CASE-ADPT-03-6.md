# CASE-ADPT-03-6 — CallScenario : table de sessions isolée du sous-runner

**Spécification :** `SPEC-ADPT-03`, `SPEC-ENG-03`  
**Critère d'acceptation :** `AC-ADPT-03-4`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-018`  
**Service / contrats cibles :** `SVC-001` (registry sessions par runner)  

---

## Ce que ce cas protège

Chaque sous-exécution **CallScenario** dispose d'une **table de sessions propre**, isolée de celle du runner parent (`REQ-040`, ADR-018). Un même `agentId` utilisé dans le parent et dans l'enfant ne doit **pas** partager le `sessionId`.

Sans isolation, la mémoire conversationnelle parent polluerait l'enfant (ou l'inverse).

---

## Cas

```gherkin
Étant donné un adapter simulé dont createSession retourne des ids uniques séquentiels
Et un scénario parent avec Run-parent(agent-dev) puis CallScenario(enfant)
Et le scénario enfant avec Run-child(agent-dev)
Quand le scénario parent est exécuté jusqu'à completion
Alors Run-parent reçoit un sessionId Sp
Et Run-child reçoit un sessionId Sc distinct de Sp
```

---

## Données

| Élément | Valeur |
|---|---:|
| Agent partagé | `agent-dev` |
| Session parent | `Sp` (table parent) |
| Session enfant | `Sc` (table sous-runner) |
| Attente | `Sp !== Sc` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Partage session parent↔enfant | `false` | tables isolées |
| `createSession` enfant | nouvel id | registry vide au start sous-runner |

---

## Ce que ce cas ne vérifie pas

- ClearContext nominal parent → `CASE-ADPT-03-2`, `CASE-ENG-03-4` ;
- Clear pendant Run parallèle → `CASE-ADPT-03-4` ;
- Await / message CallScenario → `CASE-ENG-03-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ADPT_03_6_call_scenario_isolated_session_registry`  
**Fichier :** `tests/units/adpt/CASE-ADPT-03-6.test.ts`  

## Revue du test automatisé

- [ ] Le test observe les `sessionId` passés à `buildCommand` / spawn pour parent et enfant.
- [ ] Le test affirme `Sp !== Sc` pour le même `agentId`.
- [ ] Le test échoue si une seule table de sessions est partagée.
- [ ] Le nom du test contient `CASE_ADPT_03_6`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 — `AC-ADPT-03-4` pointe ici car `CASE-ADPT-03-4` est déjà pris (Clear ≠ Stop).
