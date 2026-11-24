# CASE-ARCH-07-2 — Conventions de nommage des fichiers (kebab-case.suffixe.ts et *.tsx pour l'UI) et des identifiants (camelCase, PascalCase, UPPER_SNAKE_CASE, préfixes booléens)

**Spécification :** `SPEC-ARCH-07`
**Critère d'acceptation :** `AC-ARCH-07-2`
**Type :** acceptation
**Niveau de risque :** élevé
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`

## Ce que ce cas protège

Tous les fichiers de `src/` doivent respecter la convention de nommage normalisée : `kebab-case.suffixe.ts` pour le backend et la logique, `app.tsx` et `kebab-case.tsx` pour les composants et pages déclaratives de `src/ui/` (`ADR-013`, `ADR-015`, `SPEC-ARCH-08`). Les identifiants doivent suivre strictement les conventions : `camelCase` pour fonctions/variables, `is*`/`has*`/`should*`/`can*` pour booléens, `PascalCase` pour classes/types/interfaces/composants, et `UPPER_SNAKE_CASE` pour constantes globales.

## Cas

```gherkin
Étant donné l'arborescence des fichiers et les déclarations sous "src/" (163 modules canoniques)
Quand on vérifie la nomenclature des fichiers et symboles
Alors les fichiers backend adoptent le format "kebab-case.suffixe.ts" ou "index.ts"
Et les composants et pages UI adoptent "kebab-case.tsx" ou "app.tsx"
Et les fonctions/variables sont en camelCase, les booléens préfixés par is/has/should/can, les constantes en UPPER_SNAKE_CASE et les types/composants en PascalCase
```

## Données

| Élément | Valeur |
|---|---:|
| Formats fichiers backend | `*.contract.ts`, `*.model.ts`, `*.utils.ts`, `*.service.ts`, `*.controller.ts`, `*.adapter.ts`, `index.ts` |
| Formats fichiers UI | `app.tsx`, `*.types.ts`, `*.ts` (`api/`, `i18n/`, `hooks/`), `*.tsx` (`components/`, `pages/`) |
| Formats symboles | Fonctions/variables (`camelCase`), Booléens (`is*`, `has*`, `should*`, `can*`), Constantes (`UPPER_SNAKE_CASE`), Types/Classes/Composants (`PascalCase`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fichiers non conformes | `0` | Regex sur les 163 modules canoniques sous `src/` |
| Identifiants non conformes | `0` | Analyse AST des déclarations de symboles |

## Ce que ce cas ne vérifie pas

- L'inventaire officiel des signatures -> `CASE-ARCH-08-1` ;
- La documentation TSDoc -> `CASE-ARCH-07-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_07_2_naming_conventions_compliance`
**Fichier :** `tests/units/arch/case-arch-07-2.test.ts`

## Revue du test automatisé

- [ ] Le test valide les noms de fichiers sous `src/` (autorisant `.ts` et `.tsx` selon la couche).
- [ ] Le test valide le style de nommage de chaque symbole exporté.
- [ ] Le test vérifie que la règle de profondeur d'imbrication ne tolère aucune exception (≤ 3 niveaux).
- [ ] Le nom du test contient `CASE_ARCH_07_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

