# Sommaire des cas de test — Domaine ARCH (Architecture Technique, DAG, Qualité & Audit)

**Domaine :** `ARCH`  
**Document maître des spécifications :** [`tdd/specs/ARCH.md`](../../specs/ARCH.md)  
**ADR d'ancrage :** [`ADR-001`](../../docs/adr/ADR-001-socle-applicatif.md), [`ADR-002`](../../docs/adr/ADR-002-contrat-adapter.md), [`ADR-003`](../../docs/adr/ADR-003-adapter-cursor-cli.md), [`ADR-004`](../../docs/adr/ADR-004-moteur-blocs.md), [`ADR-005`](../../docs/adr/ADR-005-persistance-data.md), [`ADR-006`](../../docs/adr/ADR-006-strategie-et-harnais-de-test.md), [`ADR-007`](../../docs/adr/ADR-007-framework-de-test-typescript.md), [`ADR-013`](../../docs/adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../../docs/adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md)  
**Signatures de référence :** [`tdd/docs/signature/signature.md`](../../docs/signature/signature.md) (et inventaires des 8 couches, 172 modules canoniques)
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v1.md` (statut §12 verrouillé)  

---

## 1. Spécifications couvertes

- [`SPEC-ARCH-01`](../../specs/ARCH.md#spec-arch-01--graphe-acyclique-de-dépendances-dag-et-étanchéité-des-couches-logicielles) — Graphe acyclique de dépendances (DAG), étanchéité des couches et Micro-DAG Front (`R-01..45`, `C-01..15`, `REQ-001..112`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`)
- [`SPEC-ARCH-02`](../../specs/ARCH.md#spec-arch-02--pureté-zéro-io-et-isomorphisme-de-la-couche-domaine-domain) — Pureté, zéro-I/O et isomorphisme de la couche Domaine (`domain/`) (`REQ-014..020`, `REQ-026`, `REQ-033..038`, `R-06..17`, `R-20`, `R-42..45`, `C-09`, `C-10`, `C-14`, `C-15`, `ADR-004`, `ADR-005`, signatures `DOM-001..019`)
- [`SPEC-ARCH-03`](../../specs/ARCH.md#spec-arch-03--isolation-des-effets-de-bord-et-connecteurs-techniques-aveugles-lib) — Isolation des effets de bord et connecteurs techniques aveugles (`lib/`) (`REQ-001..006`, `REQ-008`, `REQ-013`, `REQ-021..023`, `REQ-025`, `REQ-027..032`, `REQ-101..104`, `REQ-112`, `R-04`, `R-18`, `R-23..24`, `R-27..35`, `R-36..40`, `C-01..05`, `C-07`, `C-08`, `C-11..13`, `ADR-001..003`, `ADR-005`, `ADR-006`, signatures `LIB-001..022`)
- [`SPEC-ARCH-04`](../../specs/ARCH.md#spec-arch-04--découplage-par-interfaces-composition-root-et-conformité-des-erreurs) — Découplage par interfaces, Composition Root et conformité des erreurs (`REQ-001`, `REQ-003`, `REQ-005`, `REQ-007`, `REQ-021`, `REQ-025`, `R-03..05`, `R-28`, `R-30`, `R-35`, `C-06`, `C-11`, `ADR-001`, `ADR-002`, `ADR-006`, signatures `ROOT-001`, `TYPES-001`, `TYPES-011`, `TYPES-012`, `SVC-001..013`, `CTL-001..007`)
- [`SPEC-ARCH-05`](../../specs/ARCH.md#spec-arch-05--volumétrie-de-code-compacité-et-exemptions-tsdoc) — Volumétrie de code, compacité et exemptions TSDoc (`R-01..45`, `C-01..15`, `REQ-001..112`, `ADR-001..015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`)
- [`SPEC-ARCH-06`](../../specs/ARCH.md#spec-arch-06--inférence-automatique-de-typage-pureté-des-retours-et-bannissement-de-any) — Inférence automatique de typage, pureté des retours et bannissement de any (`R-01..45`, `C-01..15`, `REQ-001..112`, `ADR-001..015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`)
- [`SPEC-ARCH-07`](../../specs/ARCH.md#spec-arch-07--complexité-algorithmique-conventions-de-nommage-et-documentation) — Complexité algorithmique, conventions de nommage et documentation (`R-01..45`, `C-01..15`, `REQ-001..112`, `ADR-001..015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`)
- [`SPEC-ARCH-08`](../../specs/ARCH.md#spec-arch-08--conformité-dinventaire-gouvernance-des-transitions-pendingaudit-et-extraction-machine-lisible) — Conformité d'inventaire, gouvernance des transitions (@pendingAudit) et extraction machine-lisible (`R-01..45`, `C-01..15`, `REQ-001..112`, `ADR-001..015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`)
- [`SPEC-ARCH-09`](../../specs/ARCH.md#spec-arch-09--génération-du-rapport-daudit-et-de-conformité-darchitecture-dossier-outarch) — Génération du rapport d'audit et de conformité d'architecture (dossier out/arch/) (`R-01..45`, `C-01..15`, `REQ-001..112`, `ADR-001..015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`)

---

## 2. Tableau d'indexation des Cas de Test (38 Cas)

| numéro | testfile | description rapide | clause / exigence spec liée |
|---|---|---|---|
| 01-1 | `CASE-ARCH-01-1.md` | Validation de l'acyclicité stricte du graphe de dépendances statique (DAG) de l'ensemble de `src/` (163 modules en `.(ts\|tsx)`) | `SPEC-ARCH-01`, `AC-ARCH-01-1`, DAG `src/` |
| 01-2 | `CASE-ARCH-01-2.md` | Pureté déclarative de la couche `src/types/` (allow-list déclarative pure, zéro statement/runtime, imports bornés) | `SPEC-ARCH-01`, `AC-ARCH-01-2`, `TYPES-001..013` |
| 01-3 | `CASE-ARCH-01-3.md` | Étanchéité stricte des contrôleurs (`src/controllers/` n'importe ni `domain/` ni `lib/`) | `SPEC-ARCH-01`, `AC-ARCH-01-3`, `CTL-001..007` |
| 01-4 | `CASE-ARCH-01-4.md` | Isolation de la couche UI navigateur (`src/ui/` n'importe ni `lib/`, ni `services/`, ni module natif Node.js — 31 modules `UI-001..057`) | `SPEC-ARCH-01`, `AC-ARCH-01-4`, `UI-001..057` |
| 01-5 | `CASE-ARCH-01-5.md` | Conformité unilatérale de l'ensemble des imports inter-couches à la matrice d'architecture `signature.md` §5 | `SPEC-ARCH-01`, `AC-ARCH-01-5`, `signature.md` §5 |
| 01-6 | `CASE-ARCH-01-6.md` | Conformité des Micro-DAGs intra-couches (domain/ sans sous-domaine `exit/`, 6 sous-domaines) | `SPEC-ARCH-01`, `AC-ARCH-01-1`, `AC-ARCH-01-5`, `AC-ARCH-01-6`, `signature.md` §2.2, CR-012 |
| 02-1 | `CASE-ARCH-02-1.md` | Absence totale d'I/O et de modules système dans `src/domain/` (zéro import Node.js, zéro `process.env/cwd`, zéro `fetch`/`WebSocket`) | `SPEC-ARCH-02`, `AC-ARCH-02-1`, `DOM-001..019` |
| 02-2 | `CASE-ARCH-02-2.md` | Pureté et déterminisme des 10 fonctions de calcul/validation métier dans `src/domain/` (sans `evaluateExitMatchers`) | `SPEC-ARCH-02`, `AC-ARCH-02-2`, `DOM-001..008`, `DOM-010..020`, CR-012 |
| 02-3 | `CASE-ARCH-02-3.md` | Isomorphisme strict de `src/domain/` (directement exécutable sans polyfill en environnement navigateur et Node.js) | `SPEC-ARCH-02`, `AC-ARCH-02-3`, `DOM-001..019` |
| 02-4 | `CASE-ARCH-02-4.md` | Validation topologique pure par `DOM-008` (unicité Start et degré entrant 0 per `R-20`) sans accès disque | `SPEC-ARCH-02`, `AC-ARCH-02-4`, `REQ-015`, `R-20`, `DOM-008` |
| 03-1 | `CASE-ARCH-03-1.md` | Monopole absolu des imports de modules système I/O Node.js dans `src/lib/` (aucun import I/O hors `lib/`) | `SPEC-ARCH-03`, `AC-ARCH-03-1`, monopole I/O `lib/`, `node:X`≡`X` |
| 03-2 | `CASE-ARCH-03-2.md` | Cécité métier de la couche `src/lib/` (aucun import depuis `src/domain/`) | `SPEC-ARCH-03`, `AC-ARCH-03-2`, `LIB-*` ↛ `DOM-*` |
| 03-3 | `CASE-ARCH-03-3.md` | Persistance atomique anti-corruption des données JSON via `.tmp` adjacent et renommage atomique (`LIB-001`) | `SPEC-ARCH-03`, `AC-ARCH-03-3`, `R-37`, `LIB-001` |
| 03-4 | `CASE-ARCH-03-4.md` | Spawner de sous-processus et escalade temporelle déterministe SIGTERM (3000 ms) vers SIGKILL (`LIB-004`) | `SPEC-ARCH-03`, `AC-ARCH-03-4`, `ADR-006`, `LIB-004` |
| 03-5 | `CASE-ARCH-03-5.md` | Monopole absolu des accès à `process.env` et `process.cwd()` dans le moteur d'environnement (`src/lib/process/env/`) | `SPEC-ARCH-03`, `AC-ARCH-03-5`, `R-40`, `REQ-112`, `LIB-005`, `LIB-025` |
| 04-1 | `CASE-ARCH-04-1.md` | Enregistrement des routes de contrôleurs (`CTL-001..007`) exclusivement contre l'interface pure `HttpRouter` (`TYPES-011`) | `SPEC-ARCH-04`, `AC-ARCH-04-1`, `TYPES-011`, `CTL-001..007` |
| 04-2 | `CASE-ARCH-04-2.md` | Rôle de Composition Root unique de `src/index.ts` et orchestration de l'arrêt gracieux sur signaux OS (`SIGINT`/`SIGTERM`) | `SPEC-ARCH-04`, `AC-ARCH-04-2`, `ROOT-001` |
| 04-3 | `CASE-ARCH-04-3.md` | Conformité linguistique intégrale en français de l'ensemble des messages d'erreur exposés (HTTP JSON des contrôleurs et du routeur `LIB-007`/MiniRouter y compris fallback 404/500, exceptions services, erreurs console ROOT-001) | `SPEC-ARCH-04`, `AC-ARCH-04-3`, `REQ-007`, `C-06`, `LIB-007` |
| 04-4 | `CASE-ARCH-04-4.md` | Déterminisme complet du harnais de test selon `ADR-006` (zéro réseau externe, mocks processus, isolation workspace, flushPromises) | `SPEC-ARCH-04`, `AC-ARCH-04-4`, `ADR-006` |
| 05-1 | `CASE-ARCH-05-1.md` | Volumétrie des fichiers de `src/` (prédicat standard ≤ 150L, 151–200L avec `@fileExemption` en L1, > 200L interdit sauf `ROOT-001` ; fichiers TSX ≤ 250L, 251–300L avec `@fileExemption` en L1, > 300L interdit — 163 modules en `.(ts\|tsx)`) | `SPEC-ARCH-05`, `AC-ARCH-05-1`, `@fileExemption`, `ROOT-001` |
| 05-2 | `CASE-ARCH-05-2.md` | Volumétrie des corps de fonctions et méthodes (prédicat standard ≤ 35L, 36–40L avec `@functionExemption` dans TSDoc précédent, > 40L interdit ; fonctions et composants TSX ≤ 200L, 201–250L avec `@functionExemption` dans TSDoc précédent, > 250L interdit) | `SPEC-ARCH-05`, `AC-ARCH-05-2`, `@functionExemption` |
| 05-3 | `CASE-ARCH-05-3.md` | Arité des fonctions bornée (≤ 3 paramètres positionnels ou passage obligatoire par un objet d'options typé) | `SPEC-ARCH-05`, `AC-ARCH-05-3`, arité ≤ 3 |
| 06-1 | `CASE-ARCH-06-1.md` | Inférence automatique native des types de retour de fonction sans typage explicite sur les fonctions concrètes | `SPEC-ARCH-06`, `AC-ARCH-06-1`, inférence retours |
| 06-2 | `CASE-ARCH-06-2.md` | Exemption documentée obligatoire via `@returnTypeExemption` dans le TSDoc immédiatement précédent en cas de retour explicite inévitable | `SPEC-ARCH-06`, `AC-ARCH-06-2`, `@returnTypeExemption` |
| 06-3 | `CASE-ARCH-06-3.md` | Bannissement strict du mot-clé `any` (`no-explicit-any`) au profit d'`unknown` avec rétrécissement de type (*type guard*) sur 163 modules en `.(ts\|tsx)` | `SPEC-ARCH-06`, `AC-ARCH-06-3`, `no-explicit-any` |
| 06-4 | `CASE-ARCH-06-4.md` | Immutabilité stricte des arguments reçus en entrée et absence totale de mutation *in-place* | `SPEC-ARCH-06`, `AC-ARCH-06-4`, immutabilité args |
| 07-1 | `CASE-ARCH-07-1.md` | Complexité cyclomatique bornée (CC ≤ 10 ou `@complexityExemption`) et profondeur d'imbrication ≤ 3 niveaux (non exemptable) | `SPEC-ARCH-07`, `AC-ARCH-07-1`, CC ≤ 10, imbrication ≤ 3 |
| 07-2 | `CASE-ARCH-07-2.md` | Conventions de nommage des fichiers (`kebab-case.suffixe.ts` et `*.tsx` pour l'UI) et des identifiants | `SPEC-ARCH-07`, `AC-ARCH-07-2`, kebab/camel/Pascal |
| 07-3 | `CASE-ARCH-07-3.md` | Documentation TSDoc obligatoire sur tous les exports publics selon prédicat par kind AST, et zéro effet de bord à l'importation | `SPEC-ARCH-07`, `AC-ARCH-07-3`, TSDoc exports publics |
| 08-1 | `CASE-ARCH-08-1.md` | Complétude d'inventaire : réconciliation Lcode ↔ Ldoc et extraction machine-lisible des 197 modules canoniques signés en `.(ts\|tsx)` | `SPEC-ARCH-08`, `AC-ARCH-08-1`, 197 modules, CR-012 |
| 08-2 | `CASE-ARCH-08-2.md` | Légitimité d'inventaire : échec bloquant sur tout fichier intrus sous `src/` non répertorié sans balise `@pendingAudit` (scan `.(ts\|tsx)`) | `SPEC-ARCH-08`, `AC-ARCH-08-2`, 197 modules, CR-012 |
| 08-3 | `CASE-ARCH-08-3.md` | Tolérance encadrée des composants en transition (`@pendingAudit`, `@deprecated`) avec émission obligatoire d'avertissements (WARNING) | `SPEC-ARCH-08`, `AC-ARCH-08-3`, WARNING transitions |
| 08-4 | `CASE-ARCH-08-4.md` | Gouvernance des assets statiques et artefacts générés hors décompte machine-lisible (`app.css`, `embedded-assets.generated.ts`) | `SPEC-ARCH-08`, `SPEC-ARCH-05`, `AC-ARCH-08-1`, `AC-ARCH-08-2`, `ADR-012` |
| 09-1 | `CASE-ARCH-09-1.md` | Génération automatique du fichier de rapport d'audit Markdown `out/arch/rapport-arch.md` à l'issue de l'exécution des tests d'architecture | `SPEC-ARCH-09`, `AC-ARCH-09-1`, `out/arch/rapport-arch.md`, `ADR-007` |
| 09-2 | `CASE-ARCH-09-2.md` | Synthèse globale, décompte des tests, liste des erreurs bloquantes et avertissements dans le rapport d'audit | `SPEC-ARCH-09`, `AC-ARCH-09-2`, statut/décomptes/erreurs/warnings |
| 09-3 | `CASE-ARCH-09-3.md` | Registre exhaustif de la totalité des exemptions TSDoc (`@fileExemption`, `@functionExemption`, `@returnTypeExemption`, `@complexityExemption`) avec fichier, ligne, symbole et justifications textuelles dans le rapport d'audit Markdown | `SPEC-ARCH-09`, `AC-ARCH-09-3`, registre 4 balises TSDoc |
| 09-4 | `CASE-ARCH-09-4.md` | Génération concomitante du fichier structuré JSON `out/arch/arch-report.json` exposant le statut global, les décomptes, les avertissements de transition, le registre des exemptions et la matrice d'étanchéité des 8 couches | `SPEC-ARCH-09`, `AC-ARCH-09-4`, `out/arch/arch-report.json`, matrice 8 couches |
| 09-5 | `CASE-ARCH-09-5.md` | Bilan d'étanchéité du DAG et matrice de conformité des flux d'imports des 8 couches dans `out/arch/rapport-arch.md` per `signature.md` §5 | `SPEC-ARCH-09`, `AC-ARCH-09-5`, `signature.md` §5 |

