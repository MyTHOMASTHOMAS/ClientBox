# CASE-ARCH-01-4 — Isolation de la couche UI navigateur (src/ui/ n'importe ni lib/, ni services/, ni module natif Node.js)

**Spécification :** `SPEC-ARCH-01`
**Critère d'acceptation :** `AC-ARCH-01-4`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-012`, `ADR-013`, `ADR-015`

## Ce que ce cas protège

Le code de `src/ui/` (31 modules `UI-001..057` en extensions `.ts` et `.tsx`) s'exécute exclusivement dans l'environnement navigateur client et ne doit pas référencer de modules natifs Node.js (`fs`, `child_process`, `http`, `net`, `path`, etc.) ni de couches serveur (`lib/`, `services/`, `controllers/`).

## Cas

```gherkin
Étant donné les fichiers TypeScript et TSX situés dans "src/ui/" (57 modules canoniques UI-001..057)
Quand on analyse l'ensemble de leurs déclarations d'importation
Alors aucun fichier n'importe de module natif Node.js ("node:fs", "node:child_process", "node:http", "node:net", "node:path", etc.)
Et aucun fichier n'importe de module serveur provenant de "src/lib/" ou "src/services/"
Et les seuls modules internes importés proviennent de "src/types/", "src/utils/" ou "src/domain/"
```

## Données

| Élément | Valeur |
|---|---:|
| Couche cible | `src/ui/` (`UI-001..057`, fichiers `.(ts|tsx)`) |
| Modules Node interdits | `fs`, `child_process`, `http`, `net`, `os`, `path`, `url`, `vm` (avec ou sans préfixe `node:`) |
| Couches serveur interdites | `src/lib/**`, `src/services/**`, `src/controllers/**` |
| Imports internes autorisés | `src/types/**`, `src/utils/**`, `src/domain/**` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Imports Node.js dans `ui/` | `0` | Analyse AST des imports sous `src/ui/**/*.{ts,tsx}` |
| Imports serveur (`lib/`, `services/`) | `0` | Analyse AST des imports sous `src/ui/**/*.{ts,tsx}` |

## Ce que ce cas ne vérifie pas

- L'isomorphisme de domain/ -> `CASE-ARCH-02-3` ;
- La matrice unilatérale globale -> `CASE-ARCH-01-5` ;
- Le Micro-DAG interne par dossier de `src/ui/` -> `CASE-ARCH-01-6`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_01_4_ui_layer_browser_isolation`
**Fichier :** `tests/units/arch/case-arch-01-4.test.ts`

## Revue du test automatisé

- [ ] Le test analyse les imports de l'ensemble des 31 modules sous `src/ui/` (fichiers `.ts` et `.tsx`).
- [ ] Le test vérifie l'absence absolue de modules natifs Node.js.
- [ ] Le test vérifie l'absence d'import vers `src/lib/`, `src/services/` et `src/controllers/`.
- [ ] Le test échoue si un fichier sous ui/ importe un module serveur ou contrôleur.
- [ ] Le nom du test contient `CASE_ARCH_01_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

