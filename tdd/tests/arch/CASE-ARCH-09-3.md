# CASE-ARCH-09-3 — Registre exhaustif de la totalité des exemptions TSDoc (@fileExemption, @functionExemption, @returnTypeExemption, @complexityExemption) avec justifications textuelles dans le rapport d'audit Markdown

**Spécification :** `SPEC-ARCH-09`
**Critère d'acceptation :** `AC-ARCH-09-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le rapport `out/arch/rapport-arch.md` doit dresser un tableau exhaustif de toutes les exemptions actives trouvées dans le code (`@fileExemption`, `@functionExemption`, `@returnTypeExemption`, `@complexityExemption`), en précisant pour chacune : le chemin du fichier, la ligne, le symbole concerné et la justification textuelle exacte.

## Cas

```gherkin
Étant donné des fichiers sources comportant des balises d'exemption TSDoc valides
Quand le rapport d'audit est généré
Alors il comporte une section dédiée listant chacune des exemptions actives
Et chaque ligne mentionne le fichier, la ligne, le symbole et la justification textuelle
```

## Données

| Élément | Valeur |
|---|---:|
| 4 balises d'exemption | `@fileExemption`, `@functionExemption`, `@returnTypeExemption`, `@complexityExemption` |
| Champs du tableau | Chemin fichier, Ligne, Symbole/Contexte, Type d'exemption, Justification textuelle |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Exemptions omises | `0` | Extraction AST vs tableau Markdown du rapport |
| Justification verbatim | `Exacte` | Préservation textuelle de la justification |

## Ce que ce cas ne vérifie pas

- La matrice DAG -> `CASE-ARCH-09-5` ;
- Le rapport JSON -> `CASE-ARCH-09-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_09_3_tsdoc_exemptions_registry_in_report`
**Fichier :** `tests/tests-unitaires/arch/case-arch-09-3.test.ts`

## Revue du test automatisé

- [ ] Le test soumet un jeu de fichiers avec différentes balises d'exemption TSDoc.
- [ ] Le test vérifie que le tableau des exemptions dans le rapport est complet et fidèle.
- [ ] Le test vérifie que les 4 types de balises (@fileExemption, @functionExemption, @returnTypeExemption, @complexityExemption) sont recensés.
- [ ] Le test échoue si une exemption présente dans le code source est omise dans le registre d'exemptions.
- [ ] Le nom du test contient `CASE_ARCH_09_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
