# CASE-ARCH-06-3 — Bannissement strict du mot-clé any (no-explicit-any) au profit d'unknown avec rétrécissement de type (type guard)

**Spécification :** `SPEC-ARCH-06`
**Critère d'acceptation :** `AC-ARCH-06-3`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`

## Ce que ce cas protège

Le mot-clé `any` est formellement banni de l'ensemble de la base de code sous `src/` (déclarations, variables, casts, génériques sur les 163 modules canoniques en extensions `.ts` et `.tsx`). Les types dynamiques doivent impérativement utiliser `unknown` avec rétrécissement de type (*type narrowing*).

## Cas

```gherkin
Étant donné la totalité des fichiers TypeScript et TSX sous "src/" (163 modules canoniques)
Quand on analyse l'arbre syntaxique (AST) à la recherche du type "any"
Alors aucune occurrence de "any" n'est détectée
Et toutes les valeurs non typées utilisent "unknown" avec validation par type guard
```

## Données

| Élément | Valeur |
|---|---:|
| Couches surveillées | L'ensemble de `src/` (163 modules canoniques en `.(ts|tsx)`) |
| Règle ESLint / AST | `no-explicit-any` strict |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Occurrences de `any` | `0` | Scan AST de tous les `AnyKeyword` dans `src/**/*.{ts,tsx}` |

## Ce que ce cas ne vérifie pas

- L'immutabilité des arguments -> `CASE-ARCH-06-4` ;
- Les conventions de nommage -> `CASE-ARCH-07-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_06_3_no_explicit_any_compliance`
**Fichier :** `tests/units/arch/case-arch-06-3.test.ts`

## Revue du test automatisé

- [ ] Le test parcourt l'AST complet de tous les fichiers `.(ts|tsx)` sous `src/`.
- [ ] Le test vérifie qu'aucun nœud `TSAnyKeyword` n'est présent.
- [ ] Le test vérifie l'utilisation de unknown associée à des guards de type pour les données non typées.
- [ ] Le test échoue si le type any explicite est présent dans le code source.
- [ ] Le nom du test contient `CASE_ARCH_06_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

