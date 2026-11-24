# CASE-ARCH-07-1 — Complexité cyclomatique bornée (CC <= 10 ou @complexityExemption) et profondeur d'imbrication <= 3 niveaux (non exemptable)

**Spécification :** `SPEC-ARCH-07`
**Critère d'acceptation :** `AC-ARCH-07-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

La complexité cyclomatique de chaque fonction sous `src/` doit être bornée à CC ≤ 10 (selon la formule scellée de `SPEC-ARCH-07`) ou porter `@complexityExemption <motif>` dans le TSDoc précédent. La profondeur d'imbrication ne doit jamais dépasser 3 niveaux (non exemptable, impose les *early returns*).

## Cas

```gherkin
Étant donné l'ensemble des fonctions sous "src/"
Quand on calcule leur complexité cyclomatique et leur niveau maximal d'imbrication
Alors chaque fonction respecte CC <= 10 (ou porte "@complexityExemption" dans son TSDoc précédent)
Et aucune fonction ne dépasse 3 niveaux d'imbrication AST
```

## Données

| Élément | Valeur |
|---|---:|
| Formule CC | CC = 1 + Σ(If, For, ForIn, ForOf, While, DoWhile, Catch, Conditional, Logical &&/||, SwitchCase) |
| Allow-list imbrication | If, Switch, For, ForIn, ForOf, While, DoWhile, Try, Conditional (max 3 niveaux, reset sur frame enfant) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Violations CC > 10 sans exemption | `0` | Calcul AST par fonction |
| Violations imbrication > 3 | `0` | Calcul AST de la profondeur de bloc |

## Ce que ce cas ne vérifie pas

- La volumétrie des fonctions -> `CASE-ARCH-05-2` ;
- Les conventions de nommage -> `CASE-ARCH-07-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_07_1_cyclomatic_complexity_and_nesting_depth`
**Fichier :** `tests/tests-unitaires/arch/case-arch-07-1.test.ts`

## Revue du test automatisé

- [ ] Le test calcule la complexité cyclomatique de chaque fonction selon la formule scellée.
- [ ] Le test vérifie la balise `@complexityExemption` pour les CC > 10.
- [ ] Le test valide le plafond strict de 3 niveaux d'imbrication.
- [ ] Le test échoue si une fonction a une complexité cyclomatique > 10 sans balise @complexityExemption.
- [ ] Le nom du test contient `CASE_ARCH_07_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
