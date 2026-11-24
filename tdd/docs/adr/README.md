# ADR ClientsBox — index

Décisions d'architecture v1 (CDC verrouillé 21/09/2026).  
Gabarit : `ADR-000-template.md`.

| ADR | Titre | Ancrage CDC (synthèse) |
|---|---|---|
| [ADR-001](./ADR-001-socle-applicatif.md) | Socle applicatif (livrable, runtime, serveur) | REQ-001…006, R-35, contraintes 1–7 |
| [ADR-002](./ADR-002-contrat-adapter.md) | Contrat `CLIAdapter` | R-18/27/29/45, REQ-027…029, D.1 |
| [ADR-003](./ADR-003-adapter-cursor-cli.md) | Adapter cursor-cli + `CURSOR_CLI_BIN` | R-40, REQ-013/031/112 |
| [ADR-004](./ADR-004-moteur-blocs.md) | Moteur join / power / pause | R-08…22, R-42*, REQ-015…020/037, Annexe B ; renvoi CallScenario → ADR-018 |
| [ADR-005](./ADR-005-persistance-data.md) | Persistance `.agents/data/` | R-01/02/14/16, Annexe A, REQ-009…012 |
| [ADR-006](./ADR-006-strategie-et-harnais-de-test.md) | Stratégie de test unitaire, mocking CLI et isolation asynchrone | REQ-001/013/017/022/031, R-23/34/35/42, C-07 |
| [ADR-007](./ADR-007-framework-de-test-typescript.md) | Choix du framework de test TypeScript et exécution ESM native (Vitest) | Contrainte 1, ADR-006, SPEC-ARCH-09, REQ-022 |
| [ADR-008](./ADR-008-pipeline-de-build-vite-et-injection-env.md) | Pipeline de build Vite et injection des variables d'environnement au build *(proposé)* | REQ-003/031/108/112, ADR-001, ADR-003, ADR-007 |
| [ADR-009](./ADR-009-outillage-qualite-et-pipeline-ci.md) | Outillage de qualité de code (TypeScript, ESLint, Prettier) et pipeline CI en 2 étapes | Contrainte 1, ADR-001, ADR-006, ADR-007, ADR-008, SPEC-ARCH-06/08 |
| [ADR-010](./ADR-010-ui-assets-embarques-et-public-dir.md) | UI Assets embarqués au build et configuration de PUBLIC_DIR *(remplacé par ADR-012)* | REQ-003/004/108, ADR-001, ADR-008, SPEC-SRV-02 |
| [ADR-011](./ADR-011-harnais-de-test-e2e-playwright.md) | Harnais de test E2E avec Playwright et validation du Canvas | REQ-003/014/024/035, ADR-001, ADR-007, ADR-012 |
| [ADR-012](./ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md) | Front in-memory exclusif compilé depuis `src/ui/` et retrait de `PUBLIC_DIR` | REQ-003/004/108, ADR-001, ADR-008, SPEC-SRV-02 |
| [ADR-013](./ADR-013-ihm-preact-et-tailwind-css.md) | Adoption de Preact et Tailwind CSS pour l'interface utilisateur web | REQ-003/007/009..012/014/024, ADR-001, ADR-008, ADR-012 |
| [ADR-014](./ADR-014-catalogue-evenements-logger-et-separation-severite.md) | Catalogue d'événements sémantiques et segmentation des logs par sévérité | SPEC-ARCH-01/05/07/08, REQ-007, C-06, ADR-001, ADR-006 |
| [ADR-015](./ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md) | Intégration opérationnelle de Tailwind CSS v4 et du Design System dans le pipeline in-memory | REQ-003/004/007/014/024/108, ADR-001, ADR-008, ADR-012, ADR-013 |
| [ADR-016](./ADR-016-cache-lru-et-memoization-modeles-cli.md) | Cache LRU en mémoire Node.js pour la découverte des modèles de CLI et suppression des catalogues statiques de secours | REQ-027, REQ-028, R-18, R-28, ADR-002, ADR-003 |
| [ADR-017](./ADR-017-documentation-utilisateur-et-export-agents-docs.md) | Documentation utilisateur embarquée et export vers `.agents/docs/` *(proposé)* | REQ-003/004/007/108, ADR-001, ADR-005, ADR-012, ADR-013, ADR-015 |
| [ADR-018](./ADR-018-call-scenario-sous-runner.md) | CallScenario : sous-runner in-process et identité du run racine *(proposé)* | R-46, REQ-039…041, ADR-004, CDC v2.1 |
| [ADR-019](./ADR-019-bloc-command.md) | Bloc Command : exécution shell OS, cycle de vie et tracking d'arrêt *(proposé)* | R-47, REQ-042…043, ADR-004, CDC v2.1 |
| [ADR-020](./ADR-020-cli-exec-scene.md) | Exécution directe de scénarios en ligne de commande (CLI Headless) sans socket HTTP *(proposé)* | REQ-044, R-48, ADR-001, ADR-004, CDC v2.2 |
| [ADR-021](./ADR-021-canvas-pan-zoom-interactions.md) | Navigation spatiale Canvas (Pan & Zoom) par matrice de vue découplée *(proposé)* | REQ-045, R-49, ADR-004, ADR-013, CDC v2.2 |
| [ADR-022](./ADR-022-chargement-dynamique-environnement.md) | Chargement dynamique des variables d'environnement au runtime et découplage du build Vite *(proposé)* | REQ-046, R-50, REQ-031, REQ-108, REQ-112, ADR-008, CDC v2.2 |

**Non retenus en v1 (explicite) :**

- ADR store de session agent — **non** : session / mémoire gérées par le **CLI** (voir ADR-002/003).

Chaîne : `CDC` → **ADR-001…022** → specs (`value`, enums, flags CLI) → CASE → code.
