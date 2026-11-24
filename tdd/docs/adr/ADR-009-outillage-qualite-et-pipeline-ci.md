# ADR-009 — Outillage de qualité de code (TypeScript, ESLint, Prettier) et pipeline CI en 2 étapes

**Statut :** accepté  
**Date :** 08/10/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| Contrainte 1 | Socle technique TypeScript strict & runtime Node ≥ 24 |
| ADR-001 | Socle applicatif standalone et zéro dépendance runtime externe |
| ADR-006 | Stratégie de test déterministe et isolation asynchrone |
| ADR-007 | Exécution des tests TypeScript native via Vitest (`npm test`) |
| ADR-008 (§ Conséquences) | « La vérification de types (`tsc --noEmit`) reste un outil à part » |
| SPEC-ARCH-06 | Inférence des types de retour, bannissement strict de `any` (`no-explicit-any`) |
| SPEC-ARCH-08 / CASE-ARCH-08-2 | Légitimité d'inventaire : isolation stricte du dossier `src/` sans fichiers intrus |

Cet ADR **complète** l'ADR-007 et l'ADR-008 en définissant l'outillage de validation statique de code, le formateur officiel et l'orchestration séquentielle de la chaîne d'intégration continue (CI).

---

## Contexte

Le projet ClientsBox s'appuie sur une suite de tests TDD complète (100 fichiers de tests) exécutée par Vitest (`npm test`). Cependant :
1. **Contrôle de typage global :** Vite (ADR-008) et Vitest (ADR-007) transforment le TypeScript à la volée en retirant les annotations sans vérifier l'exhaustivité statique des types. Une passe explicite `tsc --noEmit` est nécessaire.
2. **Analyse statique et règles de style :** Les règles architecturales de `SPEC-ARCH-06` (bannissement du mot-clé `any`, gestion du code mort, imports inutilisés) bénéficient d'un garde-fou continu par linter (`ESLint`).
3. **Uniformité stylistique :** L'uniformisation du formateur de code (`Prettier`) évite les écarts de mise en forme et les conflits de relecture.
4. **Orchestration séquentielle de CI :** La validation doit s'exécuter en deux étapes claires : d'abord le comportement et l'architecture via les tests fonctionnels (*Fail-Fast*), puis la propreté statique du code (types, linting, formatage).

---

## Options envisagées

### Option A — Chaîne standard TypeScript + ESLint (Flat Config) + Prettier (Retenue)

| | |
|---|---|
| **Ce qu'elle apporte** | Standards de l'écosystème TypeScript moderne (`tsc --noEmit`, ESLint 9 Flat Config avec `@typescript-eslint`, Prettier déterministe) ; découplage complet entre logique de test et contrôle statique ; aucun impact sur le runtime (`devDependencies` exclusives). |
| **Ce qu'elle coûte** | Fichiers de configuration à la racine (`tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`) et dépendances de développement additionnelles. |
| **Ce qu'elle rend difficile plus tard** | Rien de bloquant. |

### Option B — Linters et formateurs intégrés à l'IDE uniquement sans CI scriptée

| | |
|---|---|
| **Ce qu'elle apporte** | Zéro configuration dans le dépôt. |
| **Ce qu'elle coûte** | Risque d'incohérences entre développeurs ou environnements ; absence de garde-fou automatisé en CI. |
| **Ce qu'elle rend difficile plus tard** | Automatisation et robustesse de la qualité. |

---

## Décision

ClientsBox adopte formellement **TypeScript (`tsc`), ESLint 9 (`eslint.config.js`) et Prettier** comme chaîne officielle d'assurance qualité, avec une exécution en **2 étapes séquentielles** :

### 1. Zero Runtime Dependency (Conformité ADR-001)
Tous les outils (`typescript`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier`) sont installés exclusivement en `devDependencies`. Aucune dépendance externe n'est présente dans `dependencies`.

### 2. Sanctuarisation de l'inventaire `src/` (Conformité SPEC-ARCH-08)
Les fichiers de configuration sont situés **exclusivement à la racine** du projet :
- `tsconfig.json` : configuration du compilateur (`NodeNext`, strict, `noEmit: true`).
- `eslint.config.js` : configuration Flat Config ESLint 9 intégrant `@typescript-eslint` et `eslint-config-prettier`.
- `.prettierrc` et `.prettierignore` : règles de formatage déterministes.

Le dossier `src/` demeure strictement réservé aux 163 modules signés et aux extensions légales `*.added.ts`.

### 3. Pipeline CI en 2 Étapes

L'orchestration des contrôles s'organise selon le flux suivant :

1. **Étape 1 — Tests & Architecture (`npm test`) :**
   - Exécution complète des 100 suites Vitest (`vitest run`).
   - Principe *Fail-Fast* : en cas d'échec d'un test fonctionnel ou d'architecture, la CI s'interrompt immédiatement.
2. **Étape 2 — Qualité de code (`npm run quality`) :**
   - `npm run typecheck` : validation globale des types TypeScript via `tsc --noEmit`.
   - `npm run lint` : audit ESLint (absence de `any`, variables inutilisées, etc.).
   - `npm run format:check` : vérification de la conformité du formatage via `prettier --check .`.

### 4. Commandes standard (`package.json`)

| Commande | Action |
|---|---|
| `npm test` | Exécution des tests Vitest (`vitest run`) |
| `npm run typecheck` | Contrôle statique strict TypeScript (`tsc --noEmit`) |
| `npm run lint` | Analyse statique ESLint (`eslint .`) |
| `npm run lint:fix` | Correction automatique par ESLint (`eslint . --fix`) |
| `npm run format:check` | Contrôle de style Prettier (`prettier --check .`) |
| `npm run format` | Réécriture et alignement Prettier (`prettier --write .`) |
| `npm run quality` | Enchaînement : `typecheck` + `lint` + `format:check` |
| `npm run ci` | Enchaînement global : `npm test && npm run quality` |

---

## Raisons

- Séparer l'exécution des tests du contrôle de qualité permet d'isoler rapidement les régressions comportementales avant d'inspecter les détails stylistiques.
- `tsc --noEmit` comble l'absence de vérification de type pendant le build Vite et les tests Vitest.
- L'alignement ESLint renforce la conformité continue avec les règles `SPEC-ARCH-06` (zéro `any`).
- L'absence d'impact sur `src/` préserve à 100% l'intégrité de la Phase GREEN.

---

## Conséquences acceptées

- Ajout de `typescript`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier` dans `devDependencies`.
- Présence des fichiers racine `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`.
- Maintien du formatage Prettier et du typage strict sur l'ensemble des fichiers sources et tests.

---

## Liens

- Socle applicatif : **ADR-001**.
- Stratégie de test : **ADR-006**.
- Framework Vitest : **ADR-007**.
- Build Vite & TypeScript : **ADR-008**.
- Inférence et pureté de type : **SPEC-ARCH-06**.
- Inventaire modulaire : **SPEC-ARCH-08** / `CASE-ARCH-08-2`.
