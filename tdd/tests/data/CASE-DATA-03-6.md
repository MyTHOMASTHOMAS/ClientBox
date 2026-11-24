# CASE-DATA-03-6 — Liste no-save : exclusion des champs runtime/UI du JSON scénario

**Spécification :** `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-DATA-03-6`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-005`  
**Modules cibles :** `DOM-018` (`node-transient-keys.constant.ts`), consommateurs UI/services de sérialisation

---

## Ce que ce cas protège

Le document JSON sous `.agents/data/scenarios/` ne doit contenir que la **configuration de design** du graphe. Les champs d'état d'exécution ou drapeaux UI (ex. `status`) restent en mémoire front/back. Sans liste canonique et strip obligatoire, un Enregistrer pendant/après un run pollue le disque et un cold start affiche un faux « run en cours » (`R-37`, `REQ-111`).

La source de vérité est la constante `SCENARIO_NODE_NO_SAVE_KEYS` exportée par `src/domain/graph/node-transient-keys.constant.ts` (`DOM-018`). En v1 elle contient au minimum `"status"`.

---

## Cas

```gherkin
Étant donné la constante SCENARIO_NODE_NO_SAVE_KEYS contenant au minimum "status"
Et un nœud Run { id: "run-1", type: "run", position: { x: 10, y: 20 }, agentId: "a1", status: "running" }
Quand on sérialise le nœud pour persistance scénario (strip no-save)
Alors l'objet résultant ne possède pas la clé "status"
Et l'objet résultant conserve id, type, position et agentId

Étant donné un fragment JSON nœud issu du disque :
  { "id": "run-1", "type": "run", "position": { "x": 10, "y": 20 }, "status": "completed" }
Quand on hydrate / strip le nœud à la lecture
Alors la clé "status" est absente du modèle résultant
Et id, type et position sont conservés
```

---

## Données

| Élément | Valeur |
|---|---|
| Constante | `SCENARIO_NODE_NO_SAVE_KEYS` |
| Fichier | `src/domain/graph/node-transient-keys.constant.ts` |
| Clé minimale v1 | `"status"` |
| Nœud avant strip (écriture) | `status: "running"` présent |
| Nœud après strip | `status` absent ; design intact |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Présence de `status` après strip écriture | `false` | Clé ∈ `SCENARIO_NODE_NO_SAVE_KEYS` → retirée |
| Présence de `agentId` après strip | `true` | Hors liste no-save |
| Présence de `status` après strip lecture | `false` | Idem sur JSON historique pollué |

---

## Nom de test suggéré

`test_CASE_DATA_03_6_scenario_node_no_save_keys_stripped_on_serialize_and_load`

---

## Checklist d'implémentation

- [ ] Exporter `SCENARIO_NODE_NO_SAVE_KEYS` (readonly) depuis `DOM-018`.
- [ ] Fournir une fonction pure de strip (même module ou consommateur domain) utilisée à l'écriture et à la lecture.
- [ ] Vérifier qu'aucune clé de la liste ne survit au round-trip sérialisation.
- [ ] Vérifier le strip d'un JSON pollué à la lecture.
- [ ] Hors scope : verrouillage édition pendant run (`SPEC-UI-02` ultérieur).
