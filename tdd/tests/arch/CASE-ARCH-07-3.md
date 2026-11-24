# CASE-ARCH-07-3 — Documentation TSDoc obligatoire sur tous les exports publics selon prédicat par kind AST, et zéro effet de bord à l'importation

**Spécification :** `SPEC-ARCH-07`
**Critère d'acceptation :** `AC-ARCH-07-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Tout symbole exporté publiquement sous `src/` doit comporter un bloc TSDoc complet conforme au prédicat par kind AST (`@param`, `@throws`, description). De plus, aucun module ne doit exécuter d'instruction à l'import (zéro effet de bord au chargement).

## Cas

```gherkin
Étant donné les symboles exportés sous "src/"
Quand on inspecte leur documentation et leur chargement
Alors chaque symbole exporté est immédiatement précédé d'un bloc TSDoc valide
Et l'importation de n'importe quel module sous "src/" ne produit aucun effet de bord runtime
```

## Données

| Élément | Valeur |
|---|---:|
| Prédicat TSDoc | Fonctions (`@param`, `@throws`, retour), Classes (description), Interfaces/Types (description) |
| Règle d'import | Zéro exécution d'I/O ou de logique lors du `import` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Exports sans TSDoc | `0` | Analyse AST des commentaires JSDoc |
| Effets de bord à l'import | `0` | Import dynamique sandboxed |

## Ce que ce cas ne vérifie pas

- Le registre des exemptions TSDoc out/ -> `CASE-ARCH-09-3` ;
- La compacité des fichiers -> `CASE-ARCH-05-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_07_3_tsdoc_exports_and_zero_import_side_effects`
**Fichier :** `tests/tests-unitaires/arch/case-arch-07-3.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie la présence et la complétude des blocs TSDoc sur chaque export.
- [ ] Le test valide l'absence d'effets de bord lors de l'import des modules.
- [ ] Le test vérifie la présence de blocs TSDoc conformes par kind AST.
- [ ] Le test échoue si une convention de nommage (kebab-case, camelCase, PascalCase) ou un bloc TSDoc obligatoire n'est pas respecté.
- [ ] Le nom du test contient `CASE_ARCH_07_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
