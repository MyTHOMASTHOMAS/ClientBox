/**
 * CASE-ARCH-09-2 — Synthèse exécutive, décomptes, erreurs bloquantes et
 * avertissements dans `out/rapport-arch.md` (`AC-ARCH-09-2` / `SPEC-ARCH-09`).
 *
 * Module cible (même déduction que `CASE-ARCH-09-1`) :
 * `src/lib/arch/audit-markdown-reporter.ts` —
 * `generateArchitectureMarkdownAuditReport({ projectRoot, results })`.
 * Génération fichier → `09-1` ; exemptions → `09-3` ; JSON → `09-4`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_audit_report_summary_and_error_warning_counts` ;
 * CASE fait foi (POINT-013).
 *
 * Isolation ADR-006 : `createTempDir` + résultats d'audit simulés injectés.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { generateArchitectureMarkdownAuditReport } from '../../helpers/audit-markdown-reporter.js';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Statuts globaux possibles (Données CASE). */
type ArchitectureAuditGlobalStatus = 'SUCCÈS' | 'AVERTISSEMENTS' | 'ÉCHEC';

interface BlockingErrorEntry {
  readonly file: string;
  readonly rule: string;
  readonly message: string;
}

interface TransitionWarningEntry {
  readonly file: string;
  readonly kind: 'added' | 'del';
}

/** Résultats bruts injectés (checklist CASE — audit simulé). */
interface ArchitectureAuditRunResults {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly warningCount: number;
  readonly blockingErrors: readonly BlockingErrorEntry[];
  readonly transitionWarnings: readonly TransitionWarningEntry[];
}

/** Oracle table — exactitude des compteurs. */
const EXPECTED_COUNTER_ACCURACY = '100 %';

/** Oracle table — restitution des erreurs. */
const EXPECTED_ERROR_RESTITUTION = 'Exhaustive avec fichier et règle';

interface ExecutiveSummaryAndErrorTrackingAnalysis {
  /**
   * Exactitude des compteurs (clause Alors / table) —
   * comparaison résultats bruts vs synthèse du rapport.
   */
  readonly counterAccuracy: string;
  /**
   * Restitution des erreurs bloquantes et avertissements
   * (clause Et / table).
   */
  readonly errorAndWarningRestitution: string;
}

const REPORT_RELATIVE_PATH = 'out/arch/rapport-arch.md';

/**
 * Jeu Gherkin : réussites + avertissements + erreur éventuelle.
 * Statut attendu : `ÉCHEC` (failedTests > 0 / erreur bloquante).
 */
const SIMULATED_AUDIT_RESULTS: ArchitectureAuditRunResults = {
  totalTests: 10,
  passedTests: 8,
  failedTests: 1,
  warningCount: 2,
  blockingErrors: [
    {
      file: 'src/domain/graph/graph-integrity.validator.ts',
      rule: 'AC-ARCH-01-1',
      message: 'Import illicite détecté',
    },
  ],
  transitionWarnings: [
    { file: 'src/utils/string-helper.added.ts', kind: 'added' },
    { file: 'src/domain/legacy-check.del.ts', kind: 'del' },
  ],
};

function deriveExpectedGlobalStatus(
  results: ArchitectureAuditRunResults,
): ArchitectureAuditGlobalStatus {
  if (results.failedTests > 0 || results.blockingErrors.length > 0) {
    return 'ÉCHEC';
  }
  if (results.warningCount > 0 || results.transitionWarnings.length > 0) {
    return 'AVERTISSEMENTS';
  }
  return 'SUCCÈS';
}

function resolveReportPath(projectRoot: string): string {
  return path.join(projectRoot, ...REPORT_RELATIVE_PATH.split('/'));
}

function reportContainsCount(content: string, label: RegExp, value: number): boolean {
  const escaped = String(value);
  return label.test(content) && new RegExp(`${escaped}`, 'u').test(content);
}

function analyzeExecutiveSummaryAndErrorTracking(
  reportContent: string,
  expected: ArchitectureAuditRunResults,
): ExecutiveSummaryAndErrorTrackingAnalysis {
  const expectedStatus = deriveExpectedGlobalStatus(expected);

  const statusOk = reportContent.includes(expectedStatus);
  const totalOk = reportContainsCount(reportContent, /total|ex[eé]cut/iu, expected.totalTests);
  const passedOk = reportContainsCount(reportContent, /r[eé]ussi/iu, expected.passedTests);
  const failedOk = reportContainsCount(reportContent, /[eé]chou/iu, expected.failedTests);
  const warningsOk = reportContainsCount(
    reportContent,
    /avertissement|warning/iu,
    expected.warningCount,
  );

  const counterAccuracy =
    statusOk && totalOk && passedOk && failedOk && warningsOk
      ? EXPECTED_COUNTER_ACCURACY
      : 'COMPTEURS_NON_FIDÈLES';

  let allErrorsListed = true;
  for (const error of expected.blockingErrors) {
    if (!reportContent.includes(error.file) || !reportContent.includes(error.rule)) {
      allErrorsListed = false;
      break;
    }
  }

  let allWarningsListed = true;
  for (const warning of expected.transitionWarnings) {
    if (!reportContent.includes(warning.file)) {
      allWarningsListed = false;
      break;
    }
  }

  const distinguishesErrorsFromWarnings =
    /erreur\s*bloquante|erreurs\s*bloquantes/iu.test(reportContent) &&
    /avertissement/iu.test(reportContent);

  const errorAndWarningRestitution =
    allErrorsListed && allWarningsListed && distinguishesErrorsFromWarnings
      ? EXPECTED_ERROR_RESTITUTION
      : 'RESTITUTION_INCOMPLETE';

  return {
    counterAccuracy,
    errorAndWarningRestitution,
  };
}

describe('CASE-ARCH-09-2 — synthèse exécutive et erreurs (SPEC-ARCH-09)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_09_2_report_executive_summary_and_error_tracking', () => {
    tempHandle = createTempDir('clientsbox-arch-09-2-');
    const projectRoot = tempHandle.dir;

    generateArchitectureMarkdownAuditReport({
      projectRoot,
      results: SIMULATED_AUDIT_RESULTS,
    });

    const reportPath = resolveReportPath(projectRoot);
    const reportContent = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';

    const analysis = analyzeExecutiveSummaryAndErrorTracking(
      reportContent,
      SIMULATED_AUDIT_RESULTS,
    );

    // Alors la synthèse exécutive affiche le statut global exact et les décomptes
    expect(analysis.counterAccuracy).toBe(EXPECTED_COUNTER_ACCURACY);

    // Et la liste exhaustive des erreurs bloquantes et des avertissements
    // y est consignée (fichier + règle)
    expect(analysis.errorAndWarningRestitution).toBe(EXPECTED_ERROR_RESTITUTION);
  });
});
