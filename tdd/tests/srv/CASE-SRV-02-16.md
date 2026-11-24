# CASE-SRV-02-16 — Snapshot d'exécution `GET /api/scenarios/:id/run` pour réhydratation UI

**Spécification :** `SPEC-SRV-02`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-UI-03-1`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`  
**Service / contrats cibles :** `CTL-002` (`execution.controller.ts`), `SVC-001`

---

## Ce que ce cas protège

Après navigation ou F5, l'IHM perd `isRunning` et les badges de blocs (état React local). Ce case impose un **snapshot en mémoire vive** exposé par `GET /api/scenarios/:id/run` pour que le Studio puisse se resynchroniser sans rejouer le terminal (`R-26`, `R-37`) :
1. Aucun runner actif → statut `idle`, `activeScenarioId: null`, `blocks: []`.
2. Runner actif sur le même `:id` → statut runtime + liste des statuts de blocs.
3. Runner actif sur un **autre** scénario → le client apprend le conflit (`activeScenarioId` différent, `busy: true`) sans recevoir de chunks stdout/stderr.

---

## Cas

```gherkin
Étant donné aucun runner actif (activeRunner = null)
Quand un client appelle "GET /api/scenarios/sc-1/run"
Alors le serveur répond 200 avec un corps JSON :
  | status            | "idle" |
  | activeScenarioId  | null   |
  | busy              | false  |
  | blocks            | []     |

Étant donné un runner actif sur "sc-1" (statut "running")
Et des blocs avec statuts "running" / "completed" / "idle"
Quand un client appelle "GET /api/scenarios/sc-1/run"
Alors le serveur répond 200
Et "status" vaut "running"
Et "activeScenarioId" vaut "sc-1"
Et "busy" vaut true
Et "blocks" contient les paires { nodeId, status } du runner
Et le corps ne contient aucun champ de chunks stdout/stderr ni historique terminal

Étant donné un runner actif sur "sc-1"
Quand un client appelle "GET /api/scenarios/sc-2/run"
Alors le serveur répond 200
Et "busy" vaut true
Et "activeScenarioId" vaut "sc-1"
Et "status" reflète le statut du runner actif
Et "blocks" peut être vide ou omis pour un :id non actif (le client doit bloquer Launch)
```

---

## Données

| Élément | Valeur |
|---|---:|
| Route | `GET /api/scenarios/:id/run` |
| Source | Mémoire `runnerHolder.activeRunner` uniquement |
| Champs obligatoires | `status`, `activeScenarioId`, `busy`, `blocks` |
| Interdit dans la réponse | `chunks`, `stdout`, `stderr`, `terminal`, écriture disque |

---

## Résultat attendu, calculé à la main

| Situation | `busy` | `activeScenarioId` | `blocks` |
|---|:---:|---|---|
| Idle | `false` | `null` | `[]` |
| Run sur même id | `true` | id demandé | non vide si blocs connus |
| Run sur autre id | `true` | id du runner actif | `[]` ou non applicable |

---

## Ce que ce cas ne vérifie pas

- Gardes POST 503 / 409 → `CASE-SRV-02-11` ;
- SSE live → `CASE-SRV-02-8` ;
- Réhydratation côté Preact → `CASE-UI-03-9` ;
- Replay du terminal → **interdit** (`R-26`).

---

## Interdiction explicite (anti-faux-vert)

Le test ne doit pas se contenter d'enregistrer la route GET : il doit exercer le handler et assert sur le JSON. Aucun stub qui renverrait des chunks terminal.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_16_execution_snapshot_get_run_for_ui_rehydration`  
**Fichier :** `tests/units/srv/CASE-SRV-02-16.test.ts`

## Revue du test automatisé

- [ ] Route `GET /api/scenarios/:id/run` enregistrée.
- [ ] Idle → `busy: false`, `activeScenarioId: null`, `blocks: []`.
- [ ] Runner actif même id → `busy: true` + blocks.
- [ ] Runner actif autre id → `busy: true`, `activeScenarioId` de l'actif.
- [ ] Aucun champ terminal / chunk dans la réponse.
- [ ] Nom contient `CASE_SRV_02_16`.

**Relu par :** *(à renseigner)*  
**Remarques :** Complète CTL-002 ; pas de nouveau module fichier si possible (étendre `execution.controller.ts`).
