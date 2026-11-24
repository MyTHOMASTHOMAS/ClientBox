# CASE-UI-03-9 — Réhydratation Studio : sync exécution active et verrouillage Launch

**Spécification :** `SPEC-UI-03`, `SPEC-UI-02`, `SPEC-SRV-02`  
**Critère d'acceptation :** `AC-UI-03-1`, `AC-UI-02-5`, `AC-SRV-02-1`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-013`  
**Surface :** `UI-031` / `UI-010` / `UI-023`, consommation de `GET /api/scenarios/:id/run`

---

## Ce que ce cas protège

Quitter le Studio puis y revenir (hash navigation ou remount Preact) réinitialisait `isRunning` et les badges nœuds alors que le runner serveur tournait encore — permettant un second Launch trompeur. Ce case impose :
1. Au (re)montage, appel à `GET /api/scenarios/:id/run` (snapshot, `CASE-SRV-02-16`).
2. Si busy sur **ce** scénario → `isRunning = true`, application des `blocks` sur le canvas, Stop actif, Launch désactivé.
3. Si busy sur un **autre** scénario → Launch désactivé + message FR indiquant qu'une exécution est déjà en cours (sans écraser les nœuds locaux avec les blocks étrangers).
4. Aucune restauration de lignes terminal passées (`R-26`) — le SSE reprend uniquement le flux futur (`CASE-UI-03-1`).

---

## Cas

```gherkin
Étant donné le Studio ouvert sur "#/scenarios/sc-1"
Et un snapshot GET renvoyant busy=true, activeScenarioId="sc-1", status="running",
  blocks=[{ nodeId: "run-1", status: "running" }]
Quand la page se monte (ou se remonte après navigation)
Alors un GET "/api/scenarios/sc-1/run" est émis
Et isRunning vaut true
Et le nœud "run-1" affiche le statut "running"
Et le bouton Launch est désactivé
Et le bouton Stop est actif

Étant donné le Studio ouvert sur "#/scenarios/sc-2"
Et un snapshot GET renvoyant busy=true, activeScenarioId="sc-1"
Quand la page se monte
Alors le bouton Launch est désactivé
Et un message en français indique qu'une exécution est déjà en cours
Et les statuts de blocs de sc-2 ne sont pas remplacés par ceux de sc-1

Étant donné un snapshot idle (busy=false)
Quand la page se monte
Alors isRunning vaut false
Et le Launch reste disponible si le graphe est lançable
```

---

## Données

| Élément | Valeur |
|---|---:|
| Endpoint snapshot | `GET /api/scenarios/:id/run` |
| Helpers / hook | logique de réhydratation Studio (`use-scenario-execution` ou équivalent) |
| Message conflit (FR) | indiquant qu'une exécution est déjà en cours |
| Terminal | non rejoué |

---

## Résultat attendu, calculé à la main

| Snapshot | Launch | Stop | Badges |
|---|---|---|---|
| idle | autorisé (si canLaunch) | inactif | inchangés / idle |
| busy même id | disabled | actif | appliqués depuis `blocks` |
| busy autre id | disabled | selon produit (Stop global OK) | non écrasés par l'autre scénario |

---

## Ce que ce cas ne vérifie pas

- Contenu JSON exact du snapshot serveur → `CASE-SRV-02-16` ;
- Streaming terminal live / F5 SSE → `CASE-UI-03-1` ;
- POST 409 serveur → `CASE-SRV-02-11` ;
- E2E Playwright bout-en-bout → peut compléter ultérieurement sans bloquer le TU.

---

## Interdiction explicite (anti-faux-vert)

Ne pas simuler uniquement un `isRunning` local sans vérifier l'appel `GET .../run`. Ne pas exiger un replay de stdout.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_03_9_studio_rehydrates_execution_snapshot_and_locks_launch`  
**Fichier :** `tests/units/ui/CASE-UI-03-9.test.ts`

## Revue du test automatisé

- [ ] Vérifie la consommation du snapshot (GET) et le mapping busy même id → isRunning + blocks.
- [ ] Vérifie busy autre id → Launch lock + message FR, sans appliquer les blocks étrangers.
- [ ] Vérifie idle → pas de lock artificiel.
- [ ] Nom contient `CASE_UI_03_9`.
- [ ] Pas d'assertion sur un historique terminal.

**Relu par :** *(à renseigner)*  
**Remarques :** Dépend du contrat `CASE-SRV-02-16` ; helpers testables sans Playwright si possible.
