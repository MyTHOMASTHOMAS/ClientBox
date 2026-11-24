# CASE-SRV-02-11 — Contrôleur d'exécution : gardes 503 / 409 et absence de route de clear manuel

**Spécification :** `SPEC-SRV-02`, `SPEC-ENG-04`  
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-ENG-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`  
**Service / contrats cibles :** `CTL-002` (`execution.controller.ts`)

---

## Ce que ce cas protège

Le contrôleur d'exécution (`CTL-002 execution.controller.ts`) gère le cycle de vie du runner à travers les routes `POST /api/scenarios/:id/run` et `DELETE /api/scenarios/:id/run`. Ce cas garantit :
1. L'émission immédiate d'un statut `503 Service Indisponible` avec message explicite en français si le holder `startRunner` n'est pas encore rattaché par la Composition Root.
2. L'émission d'un statut `409 Conflit` dès qu'un runner est **déjà référencé** par `runnerHolder.activeRunner` (exécution concurrente interdite) — y compris si le statut runtime est `running` **ou** `paused`, et pas seulement lorsque `isRunning === true` ou `getStatus() === 'running'`.
3. Que la route de reset manuel `POST /api/agents/:id/clear` n'existe plus (`404`) : la mémoire d'un agent est spécifique à l'exécution et ne s'efface que par un bloc ClearContext (`SPEC-ADPT-03`, 2026-11-03). Le runner actif n'est pas affecté par cet appel.

Complément (hors ce case) : lecture du snapshot d'exécution pour réhydratation UI → `CASE-SRV-02-16` (`GET /api/scenarios/:id/run`).

---

## Cas

```gherkin
Étant donné le contrôleur d'exécution configuré avec un "RunnerHolder" dont "startRunner" est indéfini
Quand un client appelle "POST /api/scenarios/sc-1/run"
Alors le serveur répond avec un code HTTP 503 (Service Unavailable)
Et le corps JSON contient '{ "message": "Service de runner non initialisé." }'

Étant donné un runner actuellement en cours d'exécution sur le scénario "sc-1" (statut "running")
Quand un client appelle "POST /api/scenarios/sc-2/run"
Alors le serveur répond avec un code HTTP 409 (Conflict)
Et le corps JSON contient '{ "message": "Une exécution de scénario est déjà en cours." }'
Et "startRunner" n'est pas invoqué pour "sc-2"

Étant donné un runner actif sur le scénario "sc-1" dont le statut runtime est "paused" (join en attente)
Et "activeRunner" est non nul dans le RunnerHolder
Quand un client appelle "POST /api/scenarios/sc-2/run"
Alors le serveur répond avec un code HTTP 409 (Conflict)
Et "startRunner" n'est pas invoqué pour "sc-2"

Étant donné un RunnerHolder dont "activeRunner" est non nul (référence présente), indépendamment d'un flag "isRunning"
Quand un client appelle "POST /api/scenarios/sc-autre/run"
Alors le serveur répond avec un code HTTP 409 (Conflict)

Étant donné un runner actif sur le scénario "sc-1"
Quand un client appelle "POST /api/agents/agent-1/clear"
Alors le serveur répond avec un code HTTP 404 (route inexistante)
Et le runner actif n'est pas arrêté (sa méthode stop() n'est pas appelée)
```

---

## Données

| Élément | Valeur |
|---|---:|
| Statut si runner non prêt | `503 Service Unavailable` |
| Statut si run concurrent | `409 Conflict` |
| Condition de busy | `runnerHolder.activeRunner != null` (pas uniquement `isRunning` / `getStatus() === 'running'`) |
| Statuts runtime concernés | au minimum `running`, `paused` tant que `activeRunner` est retenu |
| Statut `POST /api/agents/:id/clear` | `404 Not Found` (route retirée) |
| Langue des messages | 100% français (`REQ-007`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code si holder vide | `503` | Garde `!runnerHolder.startRunner` |
| Code si `activeRunner != null` (running) | `409` | Unicité d'exécution globale |
| Code si `activeRunner != null` (paused) | `409` | Pause ≠ libre pour un nouveau run |
| Appels `startRunner` sur conflit | `0` | Rejet avant démarrage |
| Code `POST /api/agents/:id/clear` | `404` | Route non enregistrée |
| Appel `stop()` lors de cet appel | `0 appel` | Aucun effet sur le runner actif |

---

## Ce que ce cas ne vérifie pas

- L'ordonnancement interne des blocs du runner → `CASE-ENG-04-4` ;
- Le streaming SSE temps réel → `CASE-SRV-02-8` ;
- Le snapshot de réhydratation `GET /api/scenarios/:id/run` → `CASE-SRV-02-16` ;
- La réhydratation UI au retour sur le Studio → `CASE-UI-03-9`.

---

## Interdiction explicite (anti-faux-vert)

Le test **ne doit pas** se limiter à un mock où seul `isRunning: true` déclenche le 409. Il doit aussi échouer si la garde ignore un `activeRunner` présent avec statut `paused` (ou équivalent non terminal), ce qui laisserait démarrer un second scénario pendant une pause de join.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_11_execution_controller_lifecycle_guards`  
**Fichier :** `tests/units/srv/CASE-SRV-02-11.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie le rejet en 503 si `startRunner` est indéfini.
- [ ] Le test vérifie le rejet en 409 si un runner `running` est déjà actif.
- [ ] Le test vérifie le rejet en 409 si `activeRunner` est présent avec statut `paused` (ou sans se fier uniquement à `isRunning`).
- [ ] Le test vérifie que `startRunner` n'est pas appelé en cas de 409.
- [ ] Le test vérifie que `POST /api/agents/:id/clear` n'est pas une route enregistrée et n'invoque pas `stop()`.
- [ ] Le nom du test contient `CASE_SRV_02_11`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée (GET snapshot → `02-16`).

**Relu par :** *(à renseigner)*  
**Remarques :** Durcissement 409 pour unicité d'exécution (running **et** paused) ; snapshot GET reporté à `CASE-SRV-02-16`.
