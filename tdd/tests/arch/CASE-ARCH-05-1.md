# CASE-ARCH-05-1 — Volumétrie des fichiers de src/ (prédicat <= 150 lignes standard, <= 250 lignes TSX, avec @fileExemption en L1 au-delà)

**Spécification :** `SPEC-ARCH-05`
**Critère d'acceptation :** `AC-ARCH-05-1`
**Type :** acceptation
**Niveau de risque :** élevé
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`

## Ce que ce cas protège

Pour garantir la compacité et la maintenabilité de la base de code sous `src/`, tout fichier standard `.ts` doit comporter ≤ 150 lignes physiques (hors TSDoc, blancs consécutifs ignorés) ; entre 151 et 200 lignes, une balise `@fileExemption <motif>` est obligatoire dans le premier bloc TSDoc en L1 ; tout fichier `.ts` > 200 lignes est rejeté (sauf exception documentée `ROOT-001`).
Pour les fichiers déclaratifs Preact TSX (`*.tsx`), la verbosité du balisage VDOM et de Tailwind autorise jusqu'à ≤ 250 lignes physiques nominales sans exemption ; au-delà de 250 lignes, une balise `@fileExemption <motif>` est obligatoire dans le premier bloc TSDoc en L1.

## Cas

```gherkin
Étant donné les fichiers TypeScript et TSX situés sous "src/" (163 modules canoniques)
Quand on mesure le nombre de lignes physiques de chaque fichier selon la formule déterministe
Alors les fichiers TSX (*.tsx) de taille <= 250 lignes passent sans exemption (ou > 250 avec "@fileExemption" en L1)
Et les fichiers standards (.ts) de taille <= 150 lignes passent sans exemption
Et les fichiers standards (.ts) de 151 à 200 lignes portent obligatoirement "@fileExemption" dans leur premier bloc TSDoc en L1
Et aucun fichier standard (.ts) ne dépasse 200 lignes (sauf "src/index.ts" muni de son exemption)
```

## Données

| Élément | Valeur |
|---|---:|
| Formule de comptage | Lignes physiques hors blocs TSDoc uniquement ; commentaires `//` et `/* */` inclus ; séquence de lignes blanches = 0 ; blanc isolé = 1 |
| Fichiers ciblés | `src/**/*.{ts,tsx}` (163 modules canoniques, hors `*.generated.ts`) |
| Seuils fichiers standards (`.ts`) | <= 150 (nominal), 151–200 (avec `@fileExemption` L1), > 200 (FAIL) |
| Seuils fichiers Preact TSX (`*.tsx`) | <= 250 (nominal), 251–300 (avec `@fileExemption` L1), > 300 (FAIL) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fichiers non conformes | `0` | Mesure déterministe sur les 163 modules de `src/` |

## Ce que ce cas ne vérifie pas

- La taille des fonctions -> `CASE-ARCH-05-2` ;
- L'arité des fonctions -> `CASE-ARCH-05-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_05_1_file_size_and_file_exemption_compliance`
**Fichier :** `tests/units/arch/case-arch-05-1.test.ts`

## Revue du test automatisé

- [ ] Le test mesure la taille de chaque fichier de `src/` (fichiers `.ts` et `.tsx`) selon la règle déterministe.
- [ ] Le test applique les seuils 150 / 200 pour les fichiers standards et 250 / 300 pour les fichiers TSX.
- [ ] Le test valide la présence de `@fileExemption` en L1 au-delà des seuils nominaux.
- [ ] Le nom du test contient `CASE_ARCH_05_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

