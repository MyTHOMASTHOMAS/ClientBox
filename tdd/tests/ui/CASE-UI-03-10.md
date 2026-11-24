# CASE-UI-03-10 — CallScenario : non-recovery canvas enfant et Stop racine

**Spécification :** `SPEC-UI-03`, `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-03-4`  
**Type :** acceptation / composant  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-018`  
**Modules cibles :** `UI-010` (stream / snapshot), `UI-031` (studio), `UI-026` (Stop)

---

## Ce que ce cas protège

Pendant un **CallScenario**, l'inspection live (pastilles, snapshot `GET /run`, SSE) porte uniquement sur le scénario **racine** (`REQ-024`, `REQ-040`). Ouvrir le canvas d'un scénario **enfant** ne doit **pas** réhydrater l'état interne du sous-run (comportement idle / foreign run). Le **Stop** du run racine doit rester actif et propager l'arrêt à la sous-exécution (`R-34`, ADR-018).

Sans cette règle, l'UI exposerait un état nested non supporté en V1 ou laisserait croire qu'un second run HTTP enfant existe.

---

## Cas

```gherkin
Scénario : Canvas enfant pendant CallScenario actif
  Étant donné un run racine "parent" en cours avec un CallScenario exécutant "enfant"
  Quand l'utilisateur ouvre le Scenario Studio sur "enfant"
  Alors aucune pastille / statut de bloc du sous-run n'est réhydraté depuis le snapshot nested
  Et le Studio "enfant" se comporte en idle ou foreign run (pas de isRunning local sur l'enfant)

Scénario : Stop racine pendant CallScenario
  Étant donné le Studio ouvert sur "parent" pendant un CallScenario actif
  Quand l'utilisateur déclenche Stop
  Alors la requête d'arrêt cible le run racine
  Et l'UI reflète l'arrêt (isRunning false / Launch déverrouillé)
```

---

## Données

| Élément | Valeur |
|---|---|
| Run HTTP | id = scénario parent uniquement |
| Snapshot enfant | ne publie pas le sous-run (voir `CASE-SRV-02-19`) |
| Stop | action UI racine → halt récursif |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Réhydratation enfant | non | REQ-040 |
| Stop racine | actif + effet | R-34 / AC-UI-03-4 |

---

## Ce que ce cas ne vérifie pas

- Contrat HTTP 409 / activeScenarioId → `CASE-SRV-02-19` ;
- Halt moteur + kill spawns → `CASE-ENG-04-11` ;
- Dropdown CallScenario → `CASE-UI-02-18`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_03_10_call_scenario_no_child_recovery_and_root_stop`  
**Fichier :** `tests/units/ui/CASE-UI-03-10.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'absence de réhydratation nested sur le canvas enfant.
- [ ] Le test vérifie que Stop racine reste opérationnel pendant CallScenario.
- [ ] Le nom du test contient `CASE_UI_03_10`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 — pas de canal SSE « scénario enfant » en V1.
