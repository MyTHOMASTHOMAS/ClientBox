# Sommaire Général des Cas de Test — ClientsBox

> **Document de référence :** `tdd/tests/sommaire.md`  
> **Méthodologie TDD :** Chaîne `CDC/ADR → SPEC → CASE (tdd/tests/) → TEST (tests/) → CODE (src/)`  
> **Source des spécifications :** [`tdd/specs/sommaire.md`](../specs/sommaire.md)  
> **Source des signatures :** [`tdd/docs/signature/signature.md`](../docs/signature/signature.md) (172 modules canoniques)
> **Total des cas de test :** **193 cas de test (CASEs)** répartis sur 7 domaines (dont **16 cas E2E Playwright**) — +3 CASEs CR-009 CLI exec-scene, +3 CASEs CR-010 Canvas Pan & Zoom

---

## 1. Vue d'ensemble des Domaines de Test

| Domaine | Sommaire détaillé | Nombre de CASEs | Cas E2E inclus | Spécifications couvertes |
| :--- | :--- | :---: | :---: | :--- |
| **`SRV`** | [`tdd/tests/srv/sommaire.md`](./srv/sommaire.md) | **26 cas** | 2 E2E (02-10, 02-14) | `SPEC-SRV-01`, `SPEC-SRV-02` |
| **`DATA`** | [`tdd/tests/data/sommaire.md`](./data/sommaire.md) | **26 cas** | — | `SPEC-DATA-01` à `SPEC-DATA-05` |
| **`ADPT`** | [`tdd/tests/adpt/sommaire.md`](./adpt/sommaire.md) | **25 cas** | — | `SPEC-ADPT-01` à `SPEC-ADPT-05` |
| **`ENG`** | [`tdd/tests/eng/sommaire.md`](./eng/sommaire.md) | **26 cas** | — | `SPEC-ENG-01` à `SPEC-ENG-04` |
| **`UI`** | [`tdd/tests/ui/sommaire.md`](./ui/sommaire.md) | **48 cas** | 14 E2E (01-5, 01-9..12, 02-6, 02-11..13, 03-4..8) | `SPEC-UI-01` à `SPEC-UI-04` |
| **`UTILS`** | [`tdd/tests/utils/sommaire.md`](./utils/sommaire.md) | **4 cas** | — | `SPEC-UTILS-01`, `SPEC-UTILS-02`, `ADR-016` |
| **`ARCH`** | [`tdd/tests/arch/sommaire.md`](./arch/sommaire.md) | **38 cas** | — | `SPEC-ARCH-01` à `SPEC-ARCH-09` |
| **Total** | **7 domaines** | **193 cas** | **16 cas E2E** | **26 spécifications unitaires** |

---

## 2. Répartition et Matrice de Traçabilité des Signatures Officielles (170 Modules)

Les cas de test ci-dessus garantissent la conformité fonctionnelle et architecturale des 172 modules canoniques de `src/` (113 backend + 59 front) :

1. **Socle & Transport HTTP (`SRV`)** :
   - `ROOT-001` (`src/index.ts`) $\to$ `CASE-SRV-01-1..7`, `CASE-SRV-02-1..3`, `CASE-SRV-02-5`, `CASE-ADPT-03-5`, `CASE-ARCH-04-2`
   - `LIB-009` (`src/lib/http/json-body.parser.ts`) $\to$ `CASE-SRV-02-6`
   - `CTL-001` (`src/controllers/http/resource.controller.ts`) $\to$ `CASE-SRV-02-7`, `CASE-SRV-02-9`, `CASE-SRV-02-13`, `CASE-SRV-02-15`, `CASE-UI-01-2..3`
   - `CTL-002` (`src/controllers/http/execution/execution.controller.ts`) $\to$ `CASE-SRV-02-8`, `CASE-SRV-02-11`, `CASE-SRV-02-19`, `CASE-UI-02-5`, `CASE-UI-03-2..3`, `CASE-UI-03-10`
   - `CTL-003` (`src/controllers/sse/stream.controller.ts`) $\to$ `CASE-SRV-02-8`, `CASE-SRV-02-12`, `CASE-SRV-02-14`, `CASE-SRV-02-19`, `CASE-UI-02-4`, `CASE-UI-03-1`

2. **Ressources & Persistance (`DATA`)** :
   - `LIB-001` (`json-atomic-writer.fs.ts`), `LIB-002` (`json-fresh-reader.fs.ts`), `LIB-011` (`file-remover.fs.ts`) $\to$ `CASE-DATA-04-1..4`, `CASE-SRV-02-15`
   - `DOM-014` (`exit-condition.schema.ts`) $\to$ `CASE-DATA-01-3` (schéma `{ id, name, content }` ; `DOM-009` abrogé CR-012)
   - `SVC-002` (`resource-store.service.ts`) $\to$ `CASE-DATA-01-1..5`, `CASE-DATA-02-4`, `CASE-DATA-03-1..8`, `CASE-DATA-04-4`
   - `TYPES-002..008` (Modèles étendus Option B) $\to$ `CASE-DATA-01-7`

3. **Adapters CLI (`ADPT`)** :
   - `TYPES-001` (`cli-adapter.contract.ts`), `LIB-006` (`cursor-cli.adapter.ts`), `LIB-004` (`child-process.spawner.ts`) $\to$ `CASE-ADPT-01-1..3`, `CASE-ADPT-02-1..3`, `CASE-ADPT-03-1..3`, `CASE-ADPT-03-5..6`
   - `SVC-003` (`adapter-registry.service.ts`) $\to$ `CASE-ADPT-01-4`, `CASE-UI-01-3`
   - `SVC-004` (`agent.service.ts`) $\to$ `CASE-ADPT-03-4`, `CASE-ADPT-03-5`, `CASE-DATA-01-5`
   - `LIB-016..018` (`antigravity-cli.adapter.ts`) $\to$ `CASE-ADPT-04-1..6`
   - `LIB-020..022` (`codex-cli.adapter.ts`) $\to$ `CASE-ADPT-05-1..5`
   - `LIB-033..035` (`claude-cli.adapter.ts`) $\to$ `CASE-ADPT-06-1..5`

4. **Moteur de Blocs & Ordonnancement (`ENG`)** :
   - `DOM-001` (`join-barrier.evaluator.ts`), `DOM-002` (`orphan-node.guard.ts`), `DOM-003` (`injection-policy.evaluator.ts`), `DOM-004` (`prompt.assembler.ts`) $\to$ `CASE-ENG-01-1..2`, `CASE-ENG-02-1..3`, `CASE-ENG-04-1..2`
   - `SVC-001` (`scenario-runner.service.ts`) $\to$ `CASE-ENG-02-4`, `CASE-ENG-03-1..9`, `CASE-ENG-04-3..12`

5. **Interface Utilisateur Web Clean Code Preact TSX (`UI`, 57 modules `UI-001..057`)** :
   - `UI-001` (`src/ui/app.tsx`) $\to$ `CASE-UI-01-4`, `CASE-UI-01-8`, `CASE-UI-01-9`
   - `UI-002` (`src/ui/api/http.client.ts`), `UI-003` (`src/ui/api/sse.client.ts`) $\to$ `CASE-UI-01-6`, `CASE-UI-03-1`, `CASE-UI-03-4`
   - `UI-004` (`src/ui/i18n/fr.i18n.ts`) $\to$ `CASE-UI-01-1`, `CASE-UI-01-9`
   - `UI-005` (`src/ui/types/canvas.types.ts`), `UI-006` (`src/ui/types/ui.types.ts`) $\to$ `CASE-UI-01-2`, `CASE-UI-02-1`
   - `UI-007` (`src/ui/hooks/common/use-resources.hook.ts`) $\to$ `CASE-UI-01-2`, `CASE-UI-01-3`, `CASE-UI-01-10`, `CASE-UI-01-11`
   - `UI-008` (`src/ui/hooks/canvas/use-canvas-state.hook.ts`), `UI-009` (`src/ui/hooks/canvas/use-canvas-geometry.hook.ts`) $\to$ `CASE-UI-02-1`, `CASE-UI-02-2`, `CASE-UI-02-7`, `CASE-UI-02-8`, `CASE-UI-02-12`, `CASE-UI-02-13`, `CASE-UI-02-14`, `CASE-UI-02-17`, `CASE-UI-02-20..22`
   - `UI-010` (`src/ui/hooks/studio/use-execution-stream.hook.ts`) $\to$ `CASE-UI-02-4`, `CASE-UI-02-5`, `CASE-UI-03-1`, `CASE-UI-03-2`, `CASE-UI-03-4`, `CASE-UI-03-5`
   - `UI-011` (`src/ui/hooks/common/use-modal.hook.ts`) $\to$ `CASE-UI-01-7`, `CASE-UI-01-8`, `CASE-UI-01-12`
   - `UI-012..017` (`src/ui/components/common/`) : `button.tsx`, `input.tsx`, `select.tsx`, `modal.tsx`, `data-table.tsx`, `badge.tsx` $\to$ `CASE-UI-01-1..3`, `CASE-UI-01-7`, `CASE-UI-02-3..4`
   - `UI-018..019` (`src/ui/components/layout/`) : `app-layout.tsx`, `sidebar.tsx` $\to$ `CASE-UI-01-4`, `CASE-UI-01-9`
   - `UI-020..024` (`src/ui/components/canvas/`) : `canvas-board.tsx`, `canvas-node.tsx`, `canvas-cable.tsx`, `canvas-toolbar.tsx`, `inspector-panel.tsx` $\to$ `CASE-UI-02-1..5`, `CASE-UI-02-7..9`, `CASE-UI-02-11..13`, `CASE-UI-02-18..22`
   - `UI-025..026` (`src/ui/components/terminal/`) : `terminal-view.tsx`, `terminal-controls.tsx` $\to$ `CASE-UI-03-1..3`, `CASE-UI-03-5..6`
   - `UI-027..031` (`src/ui/pages/`) : `agents-page.tsx`, `profiles-page.tsx`, `resources-page.tsx`, `scenarios-page.tsx`, `scenario-studio-page.tsx` $\to$ `CASE-UI-01-2`, `CASE-UI-01-4`, `CASE-UI-01-10..12`, `CASE-UI-02-10`, `CASE-UI-03-4`

6. **Architecture, Qualité & DAG (`ARCH`)** :
   - 38 cas d'audit d'étanchéité, compacité, nommage, inférence, micro-DAGs et rapport sous `out/` $\to$ `CASE-ARCH-01-1` à `CASE-ARCH-09-5` (163 modules en `.(ts|tsx)`).

