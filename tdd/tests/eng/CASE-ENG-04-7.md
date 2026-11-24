# CASE-ENG-04-7 — Ordre d'exécution dicté par les connexions, indépendant de l'ordre de `nodes[]`

**Spécification :** `SPEC-ENG-01`, `SPEC-ENG-03`, `SPEC-ENG-04`  
**Critère d'acceptation :** `AC-ENG-03-1`, `AC-ENG-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`  
**Service cible :** `SVC-001` (`ScenarioRunnerService`)  

---

## Ce que ce cas protège

`ScenarioRunnerService` doit résoudre l'ordre d'exécution **uniquement via le graphe** (`connections` + join), jamais via l'ordre d'apparition des nœuds dans le tableau JSON `nodes[]`.  
Ce cas empêche une régression où le runner « marche » sur des scénarios dont `nodes` est déjà trié topologiquement, mais échoue dès que l'ordre du tableau diverge du câblage canvas.

---

## Cas

```gherkin
Étant donné un scénario valide câblé ainsi :
  Start --[key: "0"]--> RunA --[key: "0"]--> RunB
Et le tableau "nodes" sérialisé volontairement dans l'ordre inverse du flux :
  [ RunB, RunA, Start ]
Quand "ScenarioRunnerService.run()" est exécuté
Alors Start est activé en premier
Et RunA est exécuté ensuite (après réception du message Start)
Et RunB est exécuté en dernier (après réception du message de RunA)
Et l'ordre observé des exécutions (timestamps / journal / mocks d'adapter) est Start, RunA, RunB
Et RunB n'est jamais exécuté avant RunA

Étant donné le même câblage
Et le tableau "nodes" dans un ordre quelconque différent (ex. [ RunA, Start, RunB ])
Quand "ScenarioRunnerService.run()" est exécuté
Alors l'ordre d'exécution reste Start, RunA, RunB
```

---

## Données

| Élément | Valeur |
|---|---:|
| Graphe logique | `Start → RunA → RunB` |
| Ordre piège `nodes[]` | `[ RunB, RunA, Start ]` |
| Clés de connexion | `"0"` sur chaque câble |
| Observation | ordre des appels `buildCommand` / spawn / événements `blockStatusChanged` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| 1er bloc exécuté | Start | Racine du graphe (R-19) |
| 2e bloc exécuté | RunA | Unique successeur de Start |
| 3e bloc exécuté | RunB | Unique successeur de RunA |
| Influence de l'ordre `nodes[]` | Aucune | Ordonnancement = connexions + join |

---

## Ce que ce cas ne vérifie pas

- La validation structurelle Start unique → `CASE-ENG-04-4` ;
- Join waiting/pause multi-entrées → `CASE-ENG-02-4` ;
- Distribution If power → `CASE-ENG-03-3` / `CASE-ENG-04-4` ;
- ClearContext → `CASE-ENG-03-4`.

---

## Interdiction explicite (anti-faux-vert)

Le test **doit** construire un scénario où l'ordre de `nodes[]` est **différent** de l'ordre topologique des `connections`.  
Un test qui n'utilise que `nodes` déjà triés Start→… ne prouve pas cette règle et est insuffisant pour ce CASE.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_7_runner_execution_order_follows_connections_not_nodes_array`  
**Fichier :** `tests/units/eng/CASE-ENG-04-7.test.ts`  

## Revue du test automatisé

- [ ] Le test sérialise `nodes` dans un ordre différent du flux câblé.
- [ ] Le test exécute `ScenarioRunnerService.run()` et enregistre l'ordre d'exécution des blocs.
- [ ] Le test affirme l'ordre Start → RunA → RunB malgré le désordre de `nodes[]`.
- [ ] Le test échoue si le runner parcourt `for (const node of scenario.nodes)`.
- [ ] Le nom du test contient `CASE_ENG_04_7`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** Autrement (`U`)  
**Remarques :** Case ajoutée pour fermer le trou TDD entre runner linéaire actuel et contrat graphe `SVC-001`.
