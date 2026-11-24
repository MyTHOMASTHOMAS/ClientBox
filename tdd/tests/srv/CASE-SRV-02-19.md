# CASE-SRV-02-19 — CallScenario : `activeScenarioId` racine, GET/SSE enfant inertes, POST 409

**Spécification :** `SPEC-SRV-02`  
**Critère d'acceptation :** `AC-SRV-02-12`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-018`  
**Modules cibles :** `CTL-002` (exécution), `CTL-003` (SSE)

---

## Ce que ce cas protège

Pendant un **CallScenario**, le holder HTTP mono-run conserve **`activeScenarioId` = id du scénario racine** (`REQ-040`, ADR-018). La sous-exécution est **in-process** et ne passe pas par un second `POST /api/scenarios/:id/run`. Un `GET /api/scenarios/:enfantId/run` ou un SSE `:enfantId/stream` ne publient **pas** l'état du sous-run. Tout `POST /run` concurrent répond **409**.

Sans ces gardes, un client pourrait croire à deux runs HTTP ou récupérer un snapshot nested non contractuel.

---

## Cas

```gherkin
Scénario : Identité du run racine pendant CallScenario
  Étant donné un POST /api/scenarios/parent/run réussi
  Et un bloc CallScenario exécutant "enfant" in-process
  Quand un client interroge l'état d'exécution actif
  Alors activeScenarioId vaut "parent" et busy est vrai

Scénario : GET run / SSE de l'enfant n'exposent pas le sous-run
  Étant donné un CallScenario actif sur "parent" → "enfant"
  Quand un client GET /api/scenarios/enfant/run
  Alors la réponse n'indique pas un run nested actif pour "enfant"
  Quand un client s'abonne à /api/scenarios/enfant/stream
  Alors aucun événement d'état du sous-runner n'est publié sur ce canal

Scénario : Second POST /run refusé
  Étant donné un run racine actif (y compris pendant CallScenario)
  Quand un client POST /api/scenarios/autre/run (ou parent/run à nouveau)
  Alors le serveur répond HTTP 409
```

---

## Données

| Élément | Valeur |
|---|---:|
| Route launch | `POST /api/scenarios/:id/run` |
| Snapshot | `GET /api/scenarios/:id/run` |
| Stream | `GET /api/scenarios/:id/stream` (SSE) |
| Conflit | `409` |
| `activeScenarioId` | id parent uniquement |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| `activeScenarioId` | parent | REQ-040 |
| Snapshot / SSE enfant | pas de sous-run | ADR-018 |
| Second POST | `409` | mono-run HTTP |

---

## Ce que ce cas ne vérifie pas

- Await / message CallScenario → `CASE-ENG-03-7` ;
- Non-recovery UI enfant → `CASE-UI-03-10` ;
- Isolation sessions → `CASE-ADPT-03-6`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_19_call_scenario_root_active_id_and_409`  
**Fichier :** `tests/units/srv/CASE-SRV-02-19.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie `activeScenarioId` = parent pendant CallScenario.
- [ ] Le test vérifie l'inertie GET/SSE sur l'id enfant.
- [ ] Le test vérifie le 409 sur second POST /run.
- [ ] Le nom du test contient `CASE_SRV_02_19`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / ADR-018 — sous-runner in-process, pas de second POST /run.
