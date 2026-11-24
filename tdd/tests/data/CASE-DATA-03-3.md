# CASE-DATA-03-3 — Préservation stricte et intégrale des clés d'entrées personnalisées lors de modifications topologiques

**Spécification :** `SPEC-DATA-03`
**Critère d'acceptation :** `AC-DATA-03-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Lorsqu'une liaison est supprimée, les clés d'entrées personnalisées (textuelles) doivent rester strictement inchangées — seules les clés numériques par défaut sont renumérotées (`REQ-035`, `R-43`). Si les clés personnalisées étaient altérées lors d'une modification topologique, les scripts `if` qui s'y réfèrent par leur nom textuel produiraient des résultats erronés silencieusement.

## Cas

```gherkin
Étant donné un bloc cible "if-1" ayant 3 entrées câblées :
  - connexion A → clé personnalisée "promptData"
  - connexion B → clé numérique par défaut "0"
  - connexion C → clé numérique par défaut "1"
Quand l'utilisateur supprime la connexion correspondant à la clé "0" (connexion B)
Alors la clé "promptData" de la connexion A conserve exactement son libellé "promptData"
Et la clé de la connexion C est renumérotée de "1" à "0"
Et les clés résultantes sur le bloc "if-1" sont exactement : "promptData" et "0"

Étant donné un bloc cible "run-1" ayant 2 entrées :
  - connexion A → clé personnalisée "contextInput"
  - connexion B → clé personnalisée "mainPrompt"
Quand l'utilisateur supprime la connexion A (clé "contextInput")
Alors la clé "mainPrompt" de la connexion B conserve exactement son libellé "mainPrompt"
Et les clés résultantes sont exactement : "mainPrompt"
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc cible | `"if-1"` |
| Clé personnalisée | `"promptData"` |
| Clé numérique (supprimée) | `"0"` |
| Clé numérique (renumérotée) | `"1"` → `"0"` |
| Clés attendues après suppression | `"promptData"`, `"0"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Clé personnalisée après suppression | `"promptData"` (inchangée) | Préservation stricte R-43 |
| Clé numérique renumérotée | `"0"` | `"1"` renumérotée car `"0"` supprimée |
| Nombre de clés résultantes | `2` | `3 - 1 = 2` |

## Ce que ce cas ne vérifie pas

- La renumérotation des clés purement numériques → `CASE-DATA-03-2` ;
- La détection de collision de clés → `CASE-DATA-03-4` ;
- La persistance initiale du scénario → `CASE-DATA-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_03_3_custom_keys_preserved_after_deletion`
**Fichier :** `tests/tests-unitaires/data/case-data-03-3.test.ts`

## Revue du test automatisé

- [ ] Le test crée un bloc cible avec 1 clé personnalisée et 2 clés numériques.
- [ ] Le test supprime une connexion à clé numérique et vérifie que la clé personnalisée est inchangée.
- [ ] Le test vérifie que la renumérotation numérique s'applique correctement sur les clés restantes.
- [ ] Le test crée un bloc avec 2 clés personnalisées et vérifie la préservation après suppression de l'une d'elles.
- [ ] Le test échoue si l'algorithme modifie les clés personnalisées lors de la renumérotation.
- [ ] Le nom du test contient `CASE_DATA_03_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
