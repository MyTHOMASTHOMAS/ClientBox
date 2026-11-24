# CASE-DATA-03-5 — Validation topologique backend : Start unique, degré entrant 0, références valides

**Spécification :** `SPEC-DATA-03`
**Critère d'acceptation :** `AC-DATA-03-5`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Tout scénario doit comporter exactement un bloc Start (`R-19`, `REQ-015`) sans aucune connexion entrante (`R-20`). Le validateur de graphe (`DOM-008` / `validateGraph`) doit signaler en français les erreurs de structure (0 ou >1 Start, entrée vers Start, références vers des nœuds inexistants) avant persistance ou exécution. Sans ce garde-fou backend, un graphe invalide pourrait être écrit puis rejeté seulement à l'exécution ou côté UI (`CASE-UI-02-2` ne couvre que l'unicité canvas).

## Cas

```gherkin
Étant donné un scénario JSON sans aucun bloc de type "Start"
Quand validateGraph est invoqué sur ce scénario
Alors la validation échoue
Et le diagnostic contient un message en français indiquant l'absence de bloc Start

Étant donné un scénario JSON contenant deux blocs de type "Start"
Quand validateGraph est invoqué sur ce scénario
Alors la validation échoue
Et le diagnostic indique que le Start doit être unique

Étant donné un scénario avec un unique Start "start-1"
Et une connexion dont la cible "targetNodeId" vaut "start-1"
Quand validateGraph est invoqué
Alors la validation échoue
Et le diagnostic indique qu'aucune entrée n'est autorisée vers le bloc Start (R-20)

Étant donné un scénario avec un unique Start valide (0 entrée)
Et une connexion référençant un "sourceNodeId" ou "targetNodeId" inexistant
Quand validateGraph est invoqué
Alors la validation échoue
Et le diagnostic mentionne une référence de nœud invalide

Étant donné un scénario avec exactement un Start sans entrée et des connexions vers des nœuds existants
Quand validateGraph est invoqué
Alors la validation réussit
Et le tableau d'erreurs est vide
```

## Données

| Élément | Valeur |
|---|---:|
| Fonction sous test | `validateGraph(nodes, connections)` (`DOM-008`) |
| Règles | `R-19`, `R-20`, `REQ-015`, `SPEC-DATA-03` cas limite 4 |
| Langue des diagnostics | Français (`REQ-007`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| 0 Start | `FAIL` + message FR | Cas limite 4 |
| 2 Start | `FAIL` + message FR | R-19 |
| Entrée → Start | `FAIL` + message FR | R-20 |
| Ref fantôme | `FAIL` + message FR | Intégrité graphe |
| Graphe nominal | `PASS` (erreurs `[]`) | Structure valide |

## Ce que ce cas ne vérifie pas

- Le blocage UI d'ajout d'un second Start sur le canvas → `CASE-UI-02-2` ;
- Les collisions de clés → `CASE-DATA-03-4` / `DOM-007` ;
- L'émission runtime du message Start → `CASE-ENG-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_03_5_graph_topology_start_unique_and_no_inbound`
**Fichier :** `tests/tests-unitaires/data/case-data-03-5.test.ts`

## Revue du test automatisé

- [ ] Le test couvre 0 Start, multi-Start, entrée→Start, ref invalide, graphe nominal.
- [ ] Les messages d'erreur assertés sont en français.
- [ ] Le nom du test contient `CASE_DATA_03_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
