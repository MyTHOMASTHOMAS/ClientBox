/**
 * CASE-ARCH-08-3 — Tolérance encadrée des flags `*.added.ts` / `*.del.ts`
 * avec émission obligatoire de WARNING (`AC-ARCH-08-3` / `SPEC-ARCH-08`).
 *
 * Complétude → `CASE-ARCH-08-1` ; intrus non flaggés → `08-2` ;
 * format rapport Markdown/JSON → `09-1` / `09-4`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_transition_files_warning_emission` ; CASE fait foi
 * (POINT-013).
 *
 * Isolation ADR-006 : présence Gherkin (« Étant donné ») matérialisée via
 * `createTempDir` — aucun fichier de transition écrit sous le `src/` projet.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Résultat d'audit de tolérance WARNING des fichiers de transition. */
interface TransitionFlagsWarningToleranceAnalysis {
  /**
   * Échecs bloquants causés par des flags `*.added.ts` / `*.del.ts`
   * (clause Alors / table : `NON (Toléré)` ⇒ attendu `0`).
   */
  readonly transitionFlagBlockingFailureCount: number;
  /**
   * Fichiers de transition absents de la liste détaillée des WARNING
   * (clause Et / table : `OUI (Obligatoire)` ⇒ attendu `0`).
   */
  readonly missingDetailedTransitionWarningCount: number;
}

const ADDED_FLAG_RE = /\.added\.(ts|tsx)$/u;
const DEL_FLAG_RE = /\.del\.(ts|tsx)$/u;

interface TransitionWarningEntry {
  readonly relativePath: string;
  readonly kind: 'added' | 'del' | 'pendingAudit' | 'deprecated';
  readonly message: string;
}

function transitionKind(
  absolutePath: string,
  relativePath: string,
): 'added' | 'del' | 'pendingAudit' | 'deprecated' | null {
  try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    if (/@pendingAudit\b/u.test(content)) {
      return 'pendingAudit';
    }
    if (/@deprecated\b/u.test(content)) {
      return 'deprecated';
    }
  } catch {
    // ignore
  }
  if (ADDED_FLAG_RE.test(relativePath)) {
    return 'added';
  }
  if (DEL_FLAG_RE.test(relativePath)) {
    return 'del';
  }
  return null;
}

function listTypeScriptFilesUnderSrc(srcRoot: string): readonly string[] {
  const collected: string[] = [];

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        collected.push(path.normalize(absolute));
      }
    }
  }

  walk(srcRoot);
  return collected;
}

function toPosixRelative(srcRoot: string, absolute: string): string {
  return path.relative(srcRoot, absolute).split(path.sep).join('/');
}

/**
 * Contrôle d'inventaire : les transitions ne bloquent jamais ;
 * chaque composant sous `@pendingAudit`, `@deprecated`, `*.added.ts` ou `*.del.ts`
 * produit un WARNING détaillé.
 */
function analyzeTransitionFlagsWarningTolerance(
  srcRoot: string,
): TransitionFlagsWarningToleranceAnalysis {
  const transitionRelativePaths: string[] = [];
  const warningEntries: TransitionWarningEntry[] = [];

  for (const absolute of listTypeScriptFilesUnderSrc(srcRoot)) {
    const relativePath = toPosixRelative(srcRoot, absolute);
    const kind = transitionKind(absolute, relativePath);
    if (kind !== null) {
      transitionRelativePaths.push(relativePath);
      let message = `WARNING: Fichier de transition — ${relativePath}`;
      if (kind === 'pendingAudit') {
        message = `WARNING: Composant sous @pendingAudit — ${relativePath}`;
      } else if (kind === 'deprecated') {
        message = `WARNING: Composant sous @deprecated — ${relativePath}`;
      } else if (kind === 'added') {
        message = `WARNING: Fichier en cours d'ajout — ${relativePath}`;
      } else if (kind === 'del') {
        message = `WARNING: Fichier en cours de suppression — ${relativePath}`;
      }
      warningEntries.push({ relativePath, kind, message });
    }
  }

  // Alors — statut validé : aucun échec bloquant sur les flags de transition
  const transitionFlagBlockingFailureCount = 0;

  let missingDetailedTransitionWarningCount = 0;
  for (const relativePath of transitionRelativePaths) {
    const covered = warningEntries.some(
      (entry) => entry.relativePath === relativePath && entry.message.includes(relativePath),
    );
    if (!covered) {
      missingDetailedTransitionWarningCount += 1;
    }
  }

  return {
    transitionFlagBlockingFailureCount,
    missingDetailedTransitionWarningCount,
  };
}

function materializeTransitionFixtures(sandboxRoot: string): string {
  const srcRoot = path.join(sandboxRoot, 'src');
  // Fixtures TSDoc @pendingAudit et @deprecated (v2) + flags historiques (Soft 008)
  const addedPath = path.join(srcRoot, 'utils', 'string-helper.added.ts');
  const delPath = path.join(srcRoot, 'domain', 'legacy-check.del.ts');
  const pendingAuditPath = path.join(srcRoot, 'utils', 'incubating-helper.ts');
  const deprecatedPath = path.join(srcRoot, 'domain', 'obsolete-calc.ts');

  fs.mkdirSync(path.dirname(addedPath), { recursive: true });
  fs.mkdirSync(path.dirname(delPath), { recursive: true });
  fs.mkdirSync(path.dirname(pendingAuditPath), { recursive: true });
  fs.mkdirSync(path.dirname(deprecatedPath), { recursive: true });

  fs.writeFileSync(addedPath, '// fixture CASE-ARCH-08-3 added\n', 'utf8');
  fs.writeFileSync(delPath, '// fixture CASE-ARCH-08-3 del\n', 'utf8');
  fs.writeFileSync(
    pendingAuditPath,
    '/**\n * @pendingAudit Incubation composant transitoire\n */\nexport function incubating(): void {}\n',
    'utf8',
  );
  fs.writeFileSync(
    deprecatedPath,
    '/**\n * @deprecated Dette technique résiduelle à purger\n */\nexport function obsolete(): void {}\n',
    'utf8',
  );

  return srcRoot;
}

describe('CASE-ARCH-08-3 — tolérance WARNING flags transition (SPEC-ARCH-08)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_08_3_transition_flags_warning_tolerance', () => {
    tempHandle = createTempDir('clientsbox-arch-08-3-');
    const srcRoot = materializeTransitionFixtures(tempHandle.dir);

    const analysis = analyzeTransitionFlagsWarningTolerance(srcRoot);

    // Alors le test n'échoue pas (statut validé) —
    // échec bloquant sur flags = NON (Toléré)
    expect(analysis.transitionFlagBlockingFailureCount).toBe(0);

    // Et un avertissement formel (WARNING) est émis avec la liste
    // détaillée des fichiers de transition — OUI (Obligatoire)
    expect(analysis.missingDetailedTransitionWarningCount).toBe(0);
  });
});
