# CASE-ARCH-01-5 — Conformité unilatérale de l'ensemble des imports inter-couches à la matrice d'architecture signature.md §5

**Spécification :** `SPEC-ARCH-01`
**Critère d'acceptation :** `AC-ARCH-01-5`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Chaque couche logicielle de ClientsBox possède une allow-list stricte de couches qu'elle est autorisée à importer (matrice d'architecture `signature.md` §5). L'acyclicité seule ne suffit pas : tout import transversal non autorisé doit être rejeté.

## Cas

```gherkin
Étant donné la matrice unilatérale d'imports de "tdd/docs/signature/signature.md" section 5
Quand on extrait la totalité des imports statiques inter-couches de "src/"
Alors chaque dépendance respecte la liste autorisée de la couche source
Et aucun import n'emprunte de direction interdite (ex: domain/ -> lib/, services/ -> ui/, controllers/ -> ui/)
```

## Données

| Élément | Valeur |
|---|---:|
| Référentiel | `tdd/docs/signature/signature.md` §5 |
| 8 couches analysées | `types` [1], `utils` [2], `domain` [3], `lib` [4], `services` [5], `controllers` [6], `ui` [7], `index.ts` [8] |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Violations de matrice | `0` | Vérification de chaque import inter-couches contre la matrice SoT |

## Ce que ce cas ne vérifie pas

- L'acyclicité du graphe -> `CASE-ARCH-01-1` ;
- La pureté de types/ -> `CASE-ARCH-01-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_01_5_layer_import_matrix_compliance`
**Fichier :** `tests/tests-unitaires/arch/case-arch-01-5.test.ts`

## Revue du test automatisé

- [ ] Le test extrait tous les imports inter-couches sous `src/`.
- [ ] Le test confronte chaque import à la matrice d'architecture `signature.md` §5.
- [ ] Le test signale toute importation transversale interdite.
- [ ] Le test échoue si un import trans-couche non autorisé par la matrice est détecté.
- [ ] Le nom du test contient `CASE_ARCH_01_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
