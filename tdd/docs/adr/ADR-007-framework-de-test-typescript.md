# ADR-007 — Choix du framework de test TypeScript et exécution ESM native (Vitest)

**Statut :** accepté  
**Date :** 06/10/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC & Spécifications

| Référence | Rôle |
|---|---|
| Contrainte 1 | Socle technique TypeScript & runtime Node ≥ 24 |
| ADR-006 | Stratégie de test unitaire, FakeTimers (`vi.useFakeTimers()`) et mocking système |
| SPEC-ARCH-01 à 09 | Qualité modulaire, étanchéité DAG et reporting automatique sous `out/` |
| REQ-022, REQ-025, R-23, R-34 | Cycle de vie des sous-processus CLI, signaux et délais de grâce |

Cet ADR **complète** l'ADR-006 en formalisant le choix de l'outillage de test unitaire et d'intégration pour l'ensemble du projet ClientsBox.

---

## Contexte

Le projet ClientsBox est intégralement développé en **TypeScript** avec modules ECMAScript stricts (**ESM**, `type: "module"`). Selon les conventions modernes de TypeScript (`moduleResolution: "NodeNext"`), les imports relatifs dans les sources TypeScript référencent des extensions `.js` (ex. `import { foo } from './foo.js'`).

L'exécution initiale reposait sur le runner natif Node.js (`node:test`) assisté de hooks expérimentaux et de liens symboliques pour résoudre les fichiers sources `.ts`. Ce mécanisme présentait des limites :
1. **Pollution de l'arborescence :** Nécessité de créer des liens symboliques ou des doublons `.js` à côté de chaque fichier `.ts`.
2. **Fragilité des hooks de chargement :** Maintenance de polyfills personnalisés (`scripts/*.mjs`) pour intercepter la résolution des modules et les apostrophes de titres.
3. **Outillage de reporting limité :** Complexité pour automatiser nativement la génération des rapports d'architecture prescrits par `SPEC-ARCH-09` (`out/rapport-arch.md` et `out/arch-report.json`).

Il est nécessaire d'adopter un framework de test standardisé, propre et rapide, capable d'exécuter directement les sources TypeScript sans artefact intermédiaire.

---

## Options envisagées

### Option A — Vitest (Retenue)

| | |
|---|---|
| **Ce qu'elle apporte** | Support natif TypeScript + ESM (résolution automatique `.js` $\rightarrow$ `.ts`) ; zéro symlink ni artefact polluant ; timers virtuels puissants (`vi.useFakeTimers()`) alignés avec l'ADR-006 ; exécution multithread très rapide ; reporters extensibles pour `SPEC-ARCH-09` (`out/rapport-arch.md`). |
| **Ce qu'elle coûte** | Dépendance de développement (`vitest` dans `devDependencies`). |
| **Ce qu'elle rend difficile plus tard** | Rien de bloquant (compatible API standard `describe`/`it`/`expect`). |

### Option B — Runner natif `node:test` avec loader `tsx`

| | |
|---|---|
| **Ce qu'elle apporte** | Conservation de la syntaxe `node:test` sans transpileur lourd. |
| **Ce qu'elle coûte** | Moins d'outils avancés pour le mocking de modules, les timers virtuels fins et le reporting automatique. |
| **Ce qu'elle rend difficile plus tard** | Intégration de pipelines de reporting sur mesure pour l'architecture. |

### Option C — Jest avec `ts-jest` ou `@swc/jest`

| | |
|---|---|
| **Ce qu'elle apporte** | Framework historique très répandu. |
| **Ce qu'elle coûte** | Configuration ESM lourde et fragile sous Node 24 ; performances moindres que Vitest. |
| **Ce qu'elle rend difficile plus tard** | Maintenance de la configuration de bundling ESM. |

---

## Décision

ClientsBox adopte formellement **`Vitest`** comme framework et runner de test officiel :

1. **Exécution 100 % TypeScript native :** Les fichiers sous `src/` et `tests/` restent exclusivement au format `.ts`. Aucun fichier ou symlink `.js` intermédiaire n'est toléré sur disque dans les dossiers sources.
2. **Suppression des hooks artisanaux :** Les scripts de polyfills ESM sous `scripts/` sont supprimés au profit du moteur de résolution natif de Vitest.
3. **Conformité ADR-006 :** Utilisation des utilitaires de Vitest (`vi.useFakeTimers()`, `vi.advanceTimersByTime()`, `vi.mock()`) pour les tests d'escalade de processus (`STOP_GRACE_MS`) et le mocking des streams CLI.
4. **Commande standardisée :** La commande officielle de lancement des tests est `npm test` (aliasée sur `vitest run`).
5. **Génération des rapports d'architecture (`SPEC-ARCH-09`) :** L'outillage Vitest servira de base à l'automatisation de la génération des artéfacts d'audit sous `out/` (`out/rapport-arch.md` et `out/arch-report.json`).

---

## Raisons

- Vitest résout nativement les imports TypeScript `NodeNext` avec extensions `.js` sans nécessiter aucune mutation de fichiers sur le disque.
- L'ADR-006 anticipait déjà l'usage des faux timers compatibles Vitest (`vi.useFakeTimers()`).
- L'arborescence du dépôt reste parfaitement saine et épurée.

---

## Conséquences acceptées

- Ajout de `vitest` dans les `devDependencies` de `package.json`.
- Création d'un fichier de configuration racine `vitest.config.ts`.
- Maintien d'une compatibilité directe avec les suites de tests unitaires existantes (`tests/`).

---

## Ce qui nous ferait revenir dessus

- Intégration native par Node.js du support direct et sans configuration des imports TypeScript `.ts` dans `node:test`.
- Décision produit d'abandonner l'environnement ESM strict.

---

## Liens

- Socle applicatif : **ADR-001**.
- Mocking CLI & isolation asynchrone : **ADR-006**.
- Spécifications du reporting d'architecture : **SPEC-ARCH-09** (`out/rapport-arch.md`).
