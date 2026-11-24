# CASE-ENG-04-4 — Orchestration complète du graphe et cycle de vie d'exécution par ScenarioRunnerService

**Spécification :** `SPEC-ENG-01..04`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-ENG-04-3`, `AC-ADPT-03-1`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-006`  
**Service cible :** `SVC-001` (`ScenarioRunnerService`)  

---

## Ce que ce cas protège

Le service `ScenarioRunnerService` (`SVC-001`) est l'orchestrateur central du moteur de blocs (ADR-004). Il relie la logique métier pure du domaine (`DOM-001..008`, `DOM-010+` ; `DOM-009` abrogé CR-012) aux connecteurs `lib/` (`spawner`, `if-loader`, adapters). Ce cas protège :

1. la validation préalable du graphe (`REQ-015`) ;
2. l'ordonnancement **par connexions** (Start → Run + join) — pas un simple parcours de `nodes[]` ;
3. le cycle de vie des statuts et l'interruption `stop()` avec grâce `STOP_GRACE_MS = 3000`.

Compléments :
- ordre `nodes[]` vs connexions → `CASE-ENG-04-7` ;
- **fan-out multi-sorties** et **bifurcation If oui/non** (deux flux exclusifs) → `CASE-ENG-04-8` ;
- Stop pendant `prepareRunContext` (handle pas encore tracké) → `CASE-ENG-04-9`.

---

## Cas

```gherkin
Étant donné un document de scénario valide :
  Start --[key: "0"]--> Run("run-1")
Et les adapters opérationnels injectés dont "cursor-cli"
Et un ResourceStore fournissant agent / profil / prompt / exit
Quand "ScenarioRunnerService.run()" est exécuté
Alors le runner valide le graphe via "validateGraph"
Et il démarre en activant Start puis propage via la connexion vers "run-1"
Et "run-1" n'est exécuté qu'après réception du message Start (join satisfait)
Et le statut global passe à "running" puis à "completed" à l'issue nominale
Et un spawn CLI a bien eu lieu pour "run-1" (adapter / spawner sollicité)

Étant donné un document de scénario contenant 0 bloc Start ou plus de 1 bloc Start
Quand "ScenarioRunnerService.run()" est appelé
Alors l'exécution est immédiatement refusée avec une exception explicite en français
Et aucun sous-processus CLI n'est démarré

Étant donné un scénario en cours d'exécution avec un sous-processus CLI actif
Quand la méthode "stop()" est invoquée sur le ScenarioRunnerService
Alors un signal SIGTERM est immédiatement transmis au processus enfant
Et si le processus ne s'arrête pas dans un délai de 3000 ms ("STOP_GRACE_MS"), un signal SIGKILL est envoyé
Et le statut final du runner bascule à "stopped"
```

> Bifurcation If (port 0 / port 1) et fan-out multi-connexions : **`CASE-ENG-04-8`**.

---

## Données

| Élément | Valeur |
|---|---:|
| Surface sous test | `ScenarioRunnerService.run()` / `stop()` — pas de helper `fanOut` local |
| Délai de grâce d'arrêt | `3000 ms` (`STOP_GRACE_MS`, ADR-006, SPEC-ADPT-03) |
| Statuts Runner | `'idle'`, `'running'`, `'paused'`, `'stopped'`, `'completed'`, `'error'` |
| Statuts Blocs | `'idle'`, `'running'`, `'paused'`, `'completed'`, `'error'` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Validation graphe invalide | Rejet immédiat FR | Unicité Start (`REQ-015`) |
| Ordre nominal | Start puis Run via connexion | Propagation + join $N=1$ |
| Escalade stop | SIGTERM → SIGKILL à 3000 ms | ADR-006 |

---

## Ce que ce cas ne vérifie pas

- L'algorithme mathématique de Join en isolation → `CASE-ENG-02-1` ;
- La suspension scheduler waiting/pause seule → `CASE-ENG-02-4` ;
- L'ordre d'exécution **indépendant** de l'ordre du tableau `nodes[]` → `CASE-ENG-04-7` ;
- Fan-out multi-sorties et bifurcation If true/false → `CASE-ENG-04-8` ;
- Stop pendant préparation Run (avant enregistrement du handle) → `CASE-ENG-04-9` ;
- Reset des badges blocs `running`/`paused` au Stop → `CASE-ENG-04-10` ;
- ClearContext adapter + propagation → `CASE-ENG-03-4` ;
- L'assemblage `exit.content` et l'absence de `stop()` sur mot-clé → `CASE-ENG-04-13` ;
- Le parsing des flux cursor-cli bruts → `CASE-ADPT-02-3` ;
- Le transport HTTP/SSE → `CASE-SRV-02-8`.

---

## Interdiction explicite (anti-faux-vert)

Le test **ne doit pas** se limiter à :
- construire le runner sans appeler `run()` en nominal ;
- valider seulement le rejet « Start manquant » / « adapter manquant » ;
- appeler `distributeIfPower` hors du runner.

Il doit exercer `run()` jusqu'à un état observable (`completed` / émissions / spawn) et faire échouer une implémentation qui ignore `connections`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_4_scenario_runner_service_full_lifecycle_orchestration`  
**Fichier :** `tests/units/eng/CASE-ENG-04-4.test.ts`  

## Revue du test automatisé

- [ ] Le test valide le rejet au lancement si graphe structurellement invalide (Start).
- [ ] Le test exécute `run()` sur un graphe Start→Run et constate l'exécution du Run (spawn / completed).
- [ ] Le test valide `stop()` et l'escalade 3000 ms (fake timers si besoin).
- [ ] Le nom du test contient `CASE_ENG_04_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée (If / fan-out → `04-8`).

**Relu par :** Autrement (`U`)  
**Remarques :** Durcissement TDD — `SVC-001` doit orchestrer le graphe, pas seulement valider la topologie. Mock `getExitCondition` → `{ id, name, content }` (CR-012).
