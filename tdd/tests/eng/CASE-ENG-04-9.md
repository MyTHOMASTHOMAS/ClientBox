# CASE-ENG-04-9 — Stop pendant la préparation d'un Run : aucun processus CLI orphelin après `stop()`

**Spécification :** `SPEC-ENG-04`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-ENG-04-3`, `AC-ADPT-03-1`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-006`  
**Service / contrats cibles :** `SVC-001` (`ScenarioRunnerService`), `LIB-004` (`spawnAgent`)

---

## Ce que ce cas protège

`CASE-ENG-04-4` et `CASE-ADPT-03-1` couvrent le Stop quand un sous-processus CLI est **déjà** enregistré dans `activeSpawnHandles`. Il reste une fenêtre critique : entre le début de `prepareRunContext` (résolution agent / profil / prompt, éventuel `createSession`) et l'enregistrement du handle de spawn, un `stop()` peut interrompre le scénario alors qu'aucun handle n'est encore tracké.

Sans garde-fou, le Run peut ensuite appeler `spawnAgent` **après** le Stop : le processus Cursor tourne hors contrôle, le scénario est déjà `stopped`, et aucun kill n'est émis. Ce cas protège cette course (`R-23`, `R-34`, `REQ-022`, `REQ-025`) sous l'hypothèse opérationnelle que tout process Cursor utile est enfant du PID spawné (kill arbre via `LIB-004`).

`createSession` / `create-chat` n'est **pas** exigé stoppable ici : commande courte renvoyant un UUID ; le prédicat porte sur le spawn Run qui suit.

---

## Cas

```gherkin
Étant donné un scénario Start → Run en cours d'exécution
Et un "prepareRunContext" asynchrone non encore résolu (aucun handle dans "activeSpawnHandles")
Quand "ScenarioRunnerService.stop()" est invoqué
Alors le statut global du runner bascule à "stopped"
Et aucun sous-processus CLI de Run n'est laissé actif après la résolution de la préparation
Et aucun bloc en aval du Run n'est déclenché

Étant donné la même fenêtre : "stop()" déjà effectué pendant "prepareRunContext"
Quand "prepareRunContext" se résout ensuite et qu'un "spawnAgent" serait tenté
Alors le spawn Run n'est pas démarré
Ou, s'il démarre par course extrême, son handle est stoppé immédiatement à l'enregistrement
Et "activeSpawnHandles" est vide à la fin du cycle d'arrêt

Étant donné un scénario avec un second Run en aval du premier
Et un "stop()" survenu pendant la préparation du premier Run
Quand le scheduler reprend après la fin du premier bloc
Alors le second Run n'est jamais exécuté
```

---

## Données

| Élément | Valeur |
|---|---:|
| Surface sous test | `ScenarioRunnerService.run()` / `stop()` + chemin `prepareRunContext` → `executeSpawn` |
| Graphe minimal | `Start --[key: "0"]--> Run("run-prep")` |
| Graphe aval (2ᵉ scénario) | `Start → Run("run-prep") → Run("run-downstream")` |
| Simulation préparation | `createSession` (ou équivalent) retardé par une promesse contrôlée ; `activeSpawnHandles` vide au moment du Stop |
| Observation | statut runner, appels `spawn` / `handle.stop()`, contenu de `activeSpawnHandles`, exécution éventuelle de `run-downstream` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut après Stop pendant préparation | `stopped` | `isStopped = true` (`R-23`) |
| Handles actifs post-cycle | `0` | Pas d'orphelin après résolution de `prepareRunContext` |
| Spawn Run après Stop | `0` **ou** `stop()` immédiat sur le handle | Re-check `isHalted` avant spawn / à l'enregistrement |
| Appels `createSession` déclenchés **par** le Stop | `0` | Stop ≠ Clear (`R-24`) — inchangé vs `CASE-ADPT-03-1` |
| Exécution de `run-downstream` | `JAMAIS` | Scheduler halté (`isHalted`) |

---

## Ce que ce cas ne vérifie pas

- Stop avec handle **déjà** présent dans `activeSpawnHandles` → `CASE-ENG-04-4`, `CASE-ADPT-03-1` ;
- Escalade temporelle `SIGTERM` → `SIGKILL` à `STOP_GRACE_MS` → `CASE-ENG-04-6` ;
- Arrêt HTTP `DELETE /api/scenarios/:id/run` → `CASE-SRV-02-8` ;
- ClearContext sans kill → `CASE-ADPT-03-4` ;
- `createSession` stoppable / kill de `create-chat` → hors périmètre (commande UUID courte) ;
- Shutdown processus Node / orphelins serveur → `CASE-ADPT-03-5`.

---

## Interdiction explicite (anti-faux-vert)

Le test **ne doit pas** :
- se limiter à appeler `stop()` alors qu'un handle est déjà dans `activeSpawnHandles` (déjà couvert par `04-4`) ;
- mocker `executeSpawn` en enregistrant le handle **avant** le Stop ;
- considérer le seul statut `stopped` comme preuve suffisante sans vérifier l'absence de spawn orphelin (ou le `stop()` immédiat du handle).

Il doit forcer la fenêtre : Stop pendant un await de préparation, **puis** laisser la préparation se résoudre, et constater qu'aucun CLI Run ne survit.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_9_stop_during_run_prepare_leaves_no_orphan_cli_process`  
**Fichier :** `tests/units/eng/CASE-ENG-04-9.test.ts`

## Revue du test automatisé

- [ ] Le test démarre `run()` et bloque volontairement la préparation du Run (`prepareRunContext` / `createSession` async) avec `activeSpawnHandles` encore vide.
- [ ] Le test invoque `stop()` dans cette fenêtre, puis libère la préparation.
- [ ] Le test vérifie le statut `stopped`.
- [ ] Le test vérifie qu'aucun spawn Run orphelin ne reste actif (0 spawn, ou `handle.stop()` immédiat si spawn de course).
- [ ] Le test vérifie qu'un Run en aval n'est pas exécuté (scénario à deux Runs).
- [ ] Le nom du test contient `CASE_ENG_04_9`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée (grâce 3000 ms → `04-6` ; Clear → `ADPT-03-4`).

**Relu par :** *(à renseigner)*  
**Remarques :** Complète `CASE-ENG-04-4` sur la course Stop ↔ préparation ; ne rend pas `create-chat` stoppable.
