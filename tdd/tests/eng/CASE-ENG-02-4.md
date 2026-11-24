# CASE-ENG-02-4 — Suspension d'avancement du scheduler sur bloc Join en état Waiting ou Pause

**Spécification :** `SPEC-ENG-02`, `SPEC-ENG-04`  
**Critère d'acceptation :** `AC-ENG-02-2`, `AC-ENG-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`  
**Service cible :** `SVC-001` (`ScenarioRunnerService`)  

---

## Ce que ce cas protège

Le runner de scénario (`SVC-001`) ordonnance l'exécution des nœuds **en suivant les connexions du graphe**. Lorsqu'un bloc à $N \ge 1$ entrées n'a pas encore reçu l'intégralité de ses messages (`waiting`) ou a basculé en pause ($\sum power < N$), ce cas garantit que le moteur **suspend l'avancement sur cette branche** : il n'exécute pas le bloc cible, n'émet aucun message vers l'aval, et laisse les blocs aval strictement inactifs.

Ce cas protège l'**orchestration runtime**, pas l'algorithme pur `evaluateJoin` (déjà couvert par `CASE-ENG-02-1` / `02-2`).

---

## Cas

```gherkin
Étant donné un scénario exécuté via ScenarioRunnerService.run()
Et un bloc Run "run-join" possédant 2 entrées câblées ("0" et "1")
Et une seule entrée "0" ayant reçu un message (power: 1)
Quand le scheduler résout le cycle d'exécution
Alors evaluateJoin retourne "waiting"
Et le bloc "run-join" reste en BlockStatus "paused" (ou équivalent non-exécuté)
Et ScenarioRunnerService n'appelle pas l'exécution du bloc "run-join" (pas de spawn CLI / pas d'adapter.buildCommand)
Et aucun BlockMessage n'est émis sur les sorties de "run-join"
Et les blocs situés en aval de "run-join" demeurent strictement inactifs (statut idle)

Étant donné que "run-join" reçoit ensuite son second message sur "1" avec power: 0
# (somme power = 1 < N = 2)
Quand le runner réévalue le join
Alors evaluateJoin retourne "pause"
Et le BlockStatus de "run-join" est "paused"
Et le scheduler stoppe la propagation le long de cette branche
Et aucun spawn CLI n'est déclenché pour "run-join"
Et les blocs aval restent inactifs
```

---

## Données

| Élément | Valeur |
|---|---:|
| Surface sous test | `ScenarioRunnerService` (`SVC-001`), pas un mock local de scheduler |
| Entrées requises $N$ | $2$ (`"0"`, `"1"`) |
| Condition Waiting | Messages reçus $< N$ → `'waiting'` |
| Condition Pause | Messages reçus $= N$ et $\sum power < N$ → `'pause'` |
| Statut runtime | `'paused'` (`TYPES-012`) |
| Émission aval | `0` message tant que non `trigger` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Décision Join message incomplet | `'waiting'` | 1 message / 2 |
| Décision Join power insuffisante | `'pause'` | $1 + 0 = 1 < 2$ |
| Appels d'exécution du bloc cible | `0` | Scheduler suspendu |
| Messages émis vers l'aval | `0` | Pas de fan-out sans trigger |
| Blocs aval | `idle` | Branche gelée |

---

## Ce que ce cas ne vérifie pas

- L'algorithme pur `evaluateJoin` en isolation → `CASE-ENG-02-1`, `CASE-ENG-02-2` ;
- L'émission nominale d'un bloc Run après trigger → `CASE-ENG-03-2` ;
- L'ordre d'exécution Start→Run quand le join est complet → `CASE-ENG-04-4`, `CASE-ENG-04-7`.

---

## Interdiction explicite (anti-faux-vert)

Le test automatisé **ne doit pas** se contenter d'appeler `evaluateJoin` puis d'un `vi.fn()` local conditionné par `if (decision === 'trigger')`.  
Il doit exercer `ScenarioRunnerService` (ou une façade d'orchestration équivalente `SVC-001`) de façon à échouer si le runner ignore le join et exécute les nœuds linéairement.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_02_4_scheduler_join_waiting_pause_suspension`  
**Fichier :** `tests/units/eng/CASE-ENG-02-4.test.ts`  

## Revue du test automatisé

- [ ] Le test instancie `ScenarioRunnerService` (ou `SVC-001`) avec un graphe multi-entrées.
- [ ] Le test place le join en `waiting` (message partiel) et vérifie l'absence d'exécution du bloc cible.
- [ ] Le test place le join en `pause` (power insuffisante) et vérifie l'absence de propagation aval.
- [ ] Le test échoue si le runner parcourt `nodes[]` sans respecter join/waiting/pause.
- [ ] Le nom du test contient `CASE_ENG_02_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** Autrement (`U`)  
**Remarques :** Durcissement TDD — le vert ne peut plus être obtenu par simulation locale hors runner.
