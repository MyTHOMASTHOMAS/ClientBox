# CASE-ENG-04-10 — Stop : reset des statuts de blocs `running` / `paused` vers `idle`

**Spécification :** `SPEC-ENG-04`, `SPEC-UI-02`  
**Critère d'acceptation :** `AC-ENG-04-3`, `AC-UI-02-4`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`  
**Service / contrats cibles :** `SVC-001` (`ScenarioRunnerService`)

---

## Ce que ce cas protège

`CASE-ENG-04-4` / `CASE-ADPT-03-1` couvrent le kill process et le statut global `stopped`. Ils ne garantissent pas que les **badges de blocs** cessent d'afficher `running` / `paused`. Sans reset, le canvas garde `animate-pulse` sur les nœuds interrompus alors que le scénario est arrêté.

Ce case impose : au `stop()`, tout bloc encore `running` ou `paused` passe à `idle`, avec émission `blockStatusChanged` pour chaque transition, afin que l'UI (SSE) efface immédiatement l'état « en cours ».

Les blocs déjà `completed` ou `error` restent inchangés.

---

## Cas

```gherkin
Étant donné un scénario Start → Run en cours d'exécution
Et le bloc "run-slow" au statut "running"
Quand "ScenarioRunnerService.stop()" est invoqué
Alors le statut global du runner vaut "stopped"
Et le statut du bloc "run-slow" vaut "idle"
Et un événement "blockStatusChanged" a été émis pour "run-slow" avec status "idle"
Et aucun bloc ne reste en statut "running" ou "paused"

Étant donné un bloc au statut "paused" (join en attente) et un autre "completed"
Quand stop() est invoqué
Alors le bloc "paused" passe à "idle"
Et le bloc "completed" reste "completed"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Surface | `ScenarioRunnerService.stop()` + `getBlockStatuses()` / events `blockStatusChanged` |
| Statuts à réinitialiser | `running`, `paused` → `idle` |
| Statuts préservés | `completed`, `error`, `idle` |

---

## Résultat attendu, calculé à la main

| Avant stop | Après stop |
|---|---|
| bloc `running` | `idle` + event |
| bloc `paused` | `idle` + event |
| bloc `completed` | `completed` (inchangé) |
| runner | `stopped` |

---

## Ce que ce cas ne vérifie pas

- Kill OS / grâce SIGTERM→SIGKILL → `CASE-ENG-04-6`, `CASE-ADPT-03-1` ;
- Course Stop pendant `prepareRunContext` → `CASE-ENG-04-9` ;
- Rendering CSS `animate-pulse` Preact → `CASE-UI-02-4` (consommateur des events) ;
- HTTP `DELETE /run` → `CASE-SRV-02-8`.

---

## Interdiction explicite (anti-faux-vert)

Ne pas se contenter de `getStatus() === 'stopped'` : il faut inspecter les statuts de blocs (map ou events). Un Stop qui laisse un bloc en `running` doit faire échouer le test.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_10_stop_resets_running_and_paused_block_statuses_to_idle`  
**Fichier :** `tests/units/eng/CASE-ENG-04-10.test.ts`

## Revue du test automatisé

- [ ] Stop pendant un Run actif → plus aucun bloc `running` / `paused`.
- [ ] Event `blockStatusChanged` émis vers `idle` pour le bloc interrompu.
- [ ] Un bloc `completed` n'est pas rétrogradé.
- [ ] Nom contient `CASE_ENG_04_10`.

**Relu par :** *(à renseigner)*  
**Remarques :** Complète `04-4` sur l'aspect badges / pulse UI.
