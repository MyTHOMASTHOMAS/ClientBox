# CASE-ENG-01-2 — Constitution et indexation du sac d'entrées `BlockInputBag` par les clés d'entrées

**Spécification :** `SPEC-ENG-01`
**Critère d'acceptation :** `AC-ENG-01-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Sur tout bloc cible, chaque connexion d'entrée câblée porte une clé d'entrée (`key`). À l'arrivée d'un message sur ce port, le moteur le stocke dans le dictionnaire d'entrées du bloc sous sa clé : `BlockInputBag = Record<string, BlockMessage>` (`R-11`, `C-10`). Si l'indexation est erronée ou écrase les clés, le sac passé aux conditions de branchement sera faussé.

## Cas

```gherkin
Étant donné un bloc If "if-1" possédant deux entrées câblées :
  | portIndex | key        |
  | 0         | "spec_doc" |
  | 1         | "code_doc" |
Et un port d'entrée 2 non câblé avec la clé par défaut "2"
Quand le port 0 reçoit le message "{ blockType: 'run', value: 'Spécification v1', power: 1 }"
Et le port 1 reçoit le message "{ blockType: 'run', value: 'Implémentation v1', power: 1 }"
Alors le sac d'entrées "BlockInputBag" du bloc "if-1" contient exactement les clés "spec_doc" et "code_doc"
Et la valeur associée à "spec_doc" est le message reçu sur le port 0
Et la valeur associée à "code_doc" est le message reçu sur le port 1
Et la clé "2" n'est pas présente dans le sac d'entrées
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc cible | `"if-1"` |
| Port 0 (câblé) | `key: "spec_doc"` |
| Port 1 (câblé) | `key: "code_doc"` |
| Port 2 (non câblé) | `key: "2"` |
| Message port 0 (`msg0`) | `{ blockType: "run", value: "Spécification v1", power: 1 }` |
| Message port 1 (`msg1`) | `{ blockType: "run", value: "Implémentation v1", power: 1 }` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Clés présentes dans `sac` | `["spec_doc", "code_doc"]` | Entrées câblées uniquement (R-11, cas limite 1) |
| Valeur `sac["spec_doc"]` | `msg0` | Message reçu sur port 0 indexé sous sa clé |
| Valeur `sac["code_doc"]` | `msg1` | Message reçu sur port 1 indexé sous sa clé |
| Présence de `sac["2"]` | `false` (`undefined`) | Port 2 non câblé : exclu du sac |

## Ce que ce cas ne vérifie pas

- L'absence de clé sur les ports émetteurs → `CASE-ENG-01-1` ;
- L'évaluation effective de la fonction `if(sac)` → `CASE-ENG-03-3` ;
- La renumérotation des clés lors de la modification topologique → `CASE-DATA-03-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_01_2_input_bag_indexing_by_entry_keys`
**Fichier :** `tests/tests-unitaires/eng/case-eng-01-2.test.ts`

## Revue du test automatisé

- [ ] Le test configure un bloc avec 2 entrées câblées et 1 entrée non câblée.
- [ ] Le test injecte deux messages et inspecte l'objet `BlockInputBag`.
- [ ] Le test vérifie que chaque message est accessible via sa clé personnalisée (`spec_doc`, `code_doc`).
- [ ] Le test vérifie que le port non câblé n'est pas injecté dans le sac.
- [ ] Le test échoue si les clés d'entrées ne sont pas respectées dans le sac.
- [ ] Le nom du test contient `CASE_ENG_01_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
