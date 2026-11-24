# CASE-ARCH-09-5 — Bilan d'étanchéité du DAG et matrice de conformité des flux d'imports des 8 couches dans out/arch/rapport-arch.md per signature.md §5

**Spécification :** `SPEC-ARCH-09`
**Critère d'acceptation :** `AC-ARCH-09-5`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le rapport d'audit Markdown `out/arch/rapport-arch.md` doit comporter obligatoirement la matrice de conformité d'étanchéité des 8 couches alignée sur `signature.md` §5, résumant pour chaque couche le statut de conformité de ses imports et l'absence de dépendances illicites.

## Cas

```gherkin
Étant donné la génération du rapport d'architecture
Quand on inspecte la section d'étanchéité du DAG dans "out/arch/rapport-arch.md"
Alors un tableau de conformité présente les 8 couches logicielles
Et indique pour chacune le statut de conformité de ses flux d'imports conformément à `signature.md` §5
```

## Données

| Élément | Valeur |
|---|---:|
| Référentiel | `signature.md` §5 (matrice 8 couches) |
| Section rapport | Tableau Markdown de conformité des flux d'imports par couche |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Présence des 8 couches | `OUI (8/8 couches listées)` | Parsing du tableau d'étanchéité DAG |
| Statut par couche | `CONFORME / NON-CONFORME` | Évaluation des flux réels d'imports |

## Ce que ce cas ne vérifie pas

- La conformité unitaire des imports -> `CASE-ARCH-01-5` ;
- Le rapport JSON -> `CASE-ARCH-09-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_09_5_dag_layer_matrix_in_markdown_report`
**Fichier :** `tests/tests-unitaires/arch/case-arch-09-5.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que le rapport Markdown inclut le bilan d'étanchéité des 8 couches.
- [ ] Le test valide l'alignement avec la matrice de `signature.md` §5.
- [ ] Le test vérifie que la matrice reproduit les 8 couches architecturales.
- [ ] Le test échoue si la matrice d'étanchéité omet une couche ou une relation d'import autorisée.
- [ ] Le nom du test contient `CASE_ARCH_09_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
