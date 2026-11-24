# CASE-ENG-04-11 — CallScenario : halt récursif (spawns parent+enfant) et Stop manuel

**Spécification :** `SPEC-ENG-04`, `SPEC-ENG-03`  
**Critère d'acceptation :** `AC-ENG-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-018`  
**Service / contrats cibles :** `SVC-001`, spawns CLI (`LIB-004`)  

---

## Ce que ce cas protège

`CASE-ENG-03-7` établit qu'un échec enfant fait échouer CallScenario et le racine. Ce cas précise le **halt récursif** exigé par `AC-ENG-04-3` / ADR-018 : interruption des spawns CLI **parent et enfant** (branches parallèles), et propagation d'un **Stop manuel** (`R-34`, `REQ-025`) pendant un CallScenario actif.

Sans cela, des CLI orphelins survivraient après échec nested ou Stop racine.

---

## Cas

```gherkin
Scénario : Échec nested interrompt aussi les spawns parallèles du parent
  Étant donné un scénario parent avec une branche parallèle Run-B et un CallScenario vers "enfant"
  Et le sous-scénario "enfant" échoue (ex. Run-child exit non nul) alors que Run-B est encore actif
  Quand l'échec remonte au bloc CallScenario
  Alors le moteur interrompt les spawns actifs du parent (Run-B) et de l'enfant
  Et le statut global du scénario racine passe à "ERREUR"
  Et aucune émission power n'est propagée en aval du CallScenario

Scénario : Stop manuel pendant CallScenario
  Étant donné un CallScenario en cours avec des spawns CLI dans le sous-runner
  Quand l'utilisateur déclenche Stop sur le run racine (DELETE /api/scenarios/:parentId/run ou runner.stop())
  Alors le sous-runner est arrêté
  Et les spawns enfant sont tués
  Et le scénario racine passe à l'état arrêté / ERREUR selon le chemin d'arrêt
```

---

## Données

| Élément | Valeur |
|---|---:|
| Parent | branches parallèles : CallScenario(enfant) ∥ Run-B |
| Échec enfant | exit CLI non nul ou exception runner |
| Stop | `DELETE /api/scenarios/:parentId/run` ou `runner.stop()` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut global parent (échec) | `ERREUR` | R-25 / AC-ENG-04-3 |
| Spawns survivants | `0` | halt récursif ADR-018 |
| Message aval CallScenario | aucun | pas d'émission après échec |
| Stop pendant nested | sous-runner + spawns enfant tués | R-34 / REQ-025 |

---

## Ce que ce cas ne vérifie pas

- Await nominal, échec enfant (sans détail spawns), self-call autorisé, borne `CALL_SCENARIO_MAX_DEPTH` → `CASE-ENG-03-7` ;
- Bouton Stop UI / non-recovery enfant → `CASE-UI-03-2`, `CASE-UI-03-10` ;
- Sessions isolées → `CASE-ADPT-03-6`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_11_call_scenario_child_failure_and_stop_halt_root`  
**Fichier :** `tests/units/eng/CASE-ENG-04-11.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'interruption des spawns parent (parallèle) et enfant après échec nested.
- [ ] Le test couvre un Stop pendant CallScenario (halt récursif).
- [ ] Le test échoue si des spawns survivent après échec ou Stop.
- [ ] Le nom du test contient `CASE_ENG_04_11`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 — extension nested de `AC-ENG-04-3` (complète `CASE-ENG-04-3`).
