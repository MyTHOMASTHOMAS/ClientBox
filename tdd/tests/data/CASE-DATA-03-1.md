# CASE-DATA-03-1 — Persistance et rechargement fidèle du document JSON de scénario (nœuds, positions, paramètres, liaisons)

**Spécification :** `SPEC-DATA-03`
**Critère d'acceptation :** `AC-DATA-03-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le document JSON d'un scénario doit enregistrer fidèlement l'intégralité du graphe : types de blocs, positions canvas, paramètres statiques et connexions câblées avec leurs clés (`R-16`, `REQ-011`, `REQ-014`, `REQ-034`). Si la sérialisation est incomplète, le rechargement restituera un graphe corrompu ou partiel, rendant le scénario inexécutable.

## Cas

```gherkin
Étant donné un scénario composé des blocs et connexions suivants :
  Blocs :
    - { id: "start-1", type: "Start", position: { x: 100, y: 50 } }
    - { id: "run-1",   type: "Run",   position: { x: 300, y: 50 }, params: { agentId: "agent-dev" } }
    - { id: "if-1",    type: "If",    position: { x: 500, y: 50 }, params: { ifScriptId: "check-status" } }
  Connexions :
    - { source: "start-1", sourcePort: "out", target: "run-1",  targetPort: "in", key: "0" }
    - { source: "run-1",   sourcePort: "out", target: "if-1",   targetPort: "in", key: "0" }
Quand le gestionnaire persiste ce scénario dans ".agents/data/scenarios/mon-flux.json"
Alors le fichier JSON contient l'intégralité des blocs avec leur type, position et paramètres
Et le fichier JSON contient l'intégralité des connexions avec leur clé

Quand le gestionnaire recharge le scénario depuis ".agents/data/scenarios/mon-flux.json"
Alors le graphe rechargé contient exactement 3 blocs avec leurs types et positions
Et le graphe rechargé contient exactement 2 connexions avec leurs clés "0"
Et le paramètre "agentId" du bloc "run-1" vaut "agent-dev"
Et le paramètre "ifScriptId" du bloc "if-1" vaut "check-status"
```

## Données

| Élément | Valeur |
|---|---:|
| Nombre de blocs | `3` (Start, Run, If) |
| Position Start | `{ x: 100, y: 50 }` |
| Position Run | `{ x: 300, y: 50 }` |
| Param Run | `agentId: "agent-dev"` |
| Param If | `ifScriptId: "check-status"` |
| Nombre de connexions | `2` |
| Clés des connexions | `"0"`, `"0"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Blocs après rechargement | `3` | Bijection sérialisation ↔ désérialisation |
| Connexions après rechargement | `2` | Bijection sérialisation ↔ désérialisation |
| Paramètres préservés | `OUI` | `agentId` et `ifScriptId` intacts |
| Positions préservées | `OUI` | `x`, `y` de chaque bloc intacts |
| Clés de connexion préservées | `OUI` | `"0"` sur chaque connexion |

## Ce que ce cas ne vérifie pas

- La renumérotation des clés après suppression → `CASE-DATA-03-2` ;
- La préservation des clés personnalisées → `CASE-DATA-03-3` ;
- La détection de collision de clés → `CASE-DATA-03-4` ;
- L'exclusion des champs no-save (`status`, …) → `CASE-DATA-03-6` ;
- Le rendu visuel Canvas → hors périmètre DATA.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_03_1_scenario_json_persist_and_reload`
**Fichier :** `tests/tests-unitaires/data/case-data-03-1.test.ts`

## Revue du test automatisé

- [ ] Le test construit un graphe avec 3 blocs et 2 connexions et le persiste.
- [ ] Le test recharge le fichier JSON et vérifie le nombre de blocs et connexions.
- [ ] Le test vérifie la fidélité des positions canvas de chaque bloc.
- [ ] Le test vérifie la préservation des paramètres statiques (`agentId`, `ifScriptId`).
- [ ] Le test vérifie la préservation des clés de connexion.
- [ ] Le test échoue si la sérialisation omet un champ du graphe.
- [ ] Le nom du test contient `CASE_DATA_03_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
