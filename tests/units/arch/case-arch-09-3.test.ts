/**
 * CASE-ARCH-09-3 — Registre exhaustif des exemptions TSDoc dans
 * `out/rapport-arch.md` (`AC-ARCH-09-3` / `SPEC-ARCH-09`).
 *
 * Module cible (même déduction que `CASE-ARCH-09-1` / `09-2`) :
 * `src/lib/arch/audit-markdown-reporter.ts` —
 * `generateArchitectureMarkdownAuditReport({ projectRoot })`.
 * Génération fichier → `09-1` ; synthèse → `09-2` ; JSON → `09-4` ;
 * matrice DAG → `09-5`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_tsdoc_exemptions_registry_markdown_report` ;
 * CASE fait foi (POINT-013).
 *
 * Isolation ADR-006 : `createTempDir` + sources fixture avec les 4 balises —
 * aucune écriture sous le `src/` projet.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { generateArchitectureMarkdownAuditReport } from '../../helpers/audit-markdown-reporter.js';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Les 4 balises d'exemption (Données CASE). */
type TsDocExemptionTag =
  '@fileExemption' | '@functionExemption' | '@returnTypeExemption' | '@complexityExemption';

interface ExpectedExemptionEntry {
  readonly relativePath: string;
  readonly line: number;
  readonly symbol: string;
  readonly tag: TsDocExemptionTag;
  readonly justification: string;
}

/** Oracle table — justification verbatim. */
const EXPECTED_JUSTIFICATION_VERBATIM = 'Exacte';

interface TsDocExemptionsRegistryAnalysis {
  /**
   * Exemptions présentes dans les sources mais absentes du tableau
   * Markdown (clause Alors / table : attendu `0`).
   */
  readonly omittedExemptionsCount: number;
  /**
   * Préservation textuelle des justifications
   * (clause Et / table : `Exacte`).
   */
  readonly justificationVerbatimStatus: string;
}

const REPORT_RELATIVE_PATH = 'out/arch/rapport-arch.md';

const EXEMPTION_TAGS: readonly TsDocExemptionTag[] = [
  '@fileExemption',
  '@functionExemption',
  '@returnTypeExemption',
  '@complexityExemption',
];

/** Jeu fixture checklist — une occurrence de chaque balise. */
/** Lignes = position de la balise dans le contenu fixture ci-dessous. */
const EXPECTED_EXEMPTIONS: readonly ExpectedExemptionEntry[] = [
  {
    relativePath: 'lib/fs/atomic-writer.ts',
    line: 2,
    symbol: 'atomic-writer.ts',
    tag: '@fileExemption',
    justification: 'Fichier legacy hors volumétrie temporaire',
  },
  {
    relativePath: 'domain/graph/graph-integrity.validator.ts',
    line: 4,
    symbol: 'validateGraph',
    tag: '@functionExemption',
    justification: 'Fonction de migration exceptionnellement longue',
  },
  {
    relativePath: 'utils/id.utils.ts',
    line: 4,
    symbol: 'parseResourceId',
    tag: '@returnTypeExemption',
    justification: 'Retour explicite requis par contrat public',
  },
  {
    relativePath: 'lib/process/spawner.ts',
    line: 4,
    symbol: 'spawnAgent',
    tag: '@complexityExemption',
    justification: 'Branchements OS incompressibles',
  },
];

function resolveReportPath(projectRoot: string): string {
  return path.join(projectRoot, ...REPORT_RELATIVE_PATH.split('/'));
}

function materializeExemptionFixtures(sandboxRoot: string): void {
  const srcRoot = path.join(sandboxRoot, 'src');

  const fileExemptionPath = path.join(srcRoot, 'lib', 'fs', 'atomic-writer.ts');
  const functionExemptionPath = path.join(srcRoot, 'domain', 'graph', 'graph-integrity.validator.ts');
  const returnExemptionPath = path.join(srcRoot, 'utils', 'id.utils.ts');
  const complexityExemptionPath = path.join(srcRoot, 'lib', 'process', 'spawner.ts');

  fs.mkdirSync(path.dirname(fileExemptionPath), { recursive: true });
  fs.mkdirSync(path.dirname(functionExemptionPath), { recursive: true });
  fs.mkdirSync(path.dirname(returnExemptionPath), { recursive: true });
  fs.mkdirSync(path.dirname(complexityExemptionPath), { recursive: true });

  fs.writeFileSync(
    fileExemptionPath,
    [
      '/**',
      ` * @fileExemption ${EXPECTED_EXEMPTIONS[0].justification}`,
      ' */',
      'export const ATOMIC_MARKER = true;',
      '',
    ].join('\n'),
    'utf8',
  );

  fs.writeFileSync(
    functionExemptionPath,
    [
      '/** Module fixture CASE-ARCH-09-3. */',
      '',
      '/**',
      ` * @functionExemption ${EXPECTED_EXEMPTIONS[1].justification}`,
      ' */',
      'export function validateGraph(): void {}',
      '',
    ].join('\n'),
    'utf8',
  );

  fs.writeFileSync(
    returnExemptionPath,
    [
      '/** Module fixture CASE-ARCH-09-3. */',
      '',
      '/**',
      ` * @returnTypeExemption ${EXPECTED_EXEMPTIONS[2].justification}`,
      ' */',
      'export function parseResourceId(raw: string): string {',
      '  return raw;',
      '}',
      '',
    ].join('\n'),
    'utf8',
  );

  fs.writeFileSync(
    complexityExemptionPath,
    [
      '/** Module fixture CASE-ARCH-09-3. */',
      '',
      '/**',
      ` * @complexityExemption ${EXPECTED_EXEMPTIONS[3].justification}`,
      ' */',
      'export function spawnAgent(): void {}',
      '',
    ].join('\n'),
    'utf8',
  );
}

function hasDedicatedExemptionsSection(content: string): boolean {
  return (
    /exemption/iu.test(content) &&
    (/registre/iu.test(content) || /tableau/iu.test(content) || /##\s+/u.test(content))
  );
}

function analyzeTsDocExemptionsRegistry(
  reportContent: string,
  expected: readonly ExpectedExemptionEntry[],
): TsDocExemptionsRegistryAnalysis {
  let omittedExemptionsCount = 0;
  let allJustificationsExact = true;

  if (!hasDedicatedExemptionsSection(reportContent)) {
    omittedExemptionsCount = expected.length;
    allJustificationsExact = false;
  } else {
    for (const entry of expected) {
      const pathPresent = reportContent.includes(entry.relativePath);
      const linePresent = reportContent.includes(String(entry.line));
      const symbolPresent = reportContent.includes(entry.symbol);
      const tagPresent = reportContent.includes(entry.tag);
      const justificationExact = reportContent.includes(entry.justification);

      if (!pathPresent || !linePresent || !symbolPresent || !tagPresent) {
        omittedExemptionsCount += 1;
      }
      if (!justificationExact) {
        allJustificationsExact = false;
      }
    }
  }

  // Couverture des 4 types (Données)
  for (const tag of EXEMPTION_TAGS) {
    if (!reportContent.includes(tag)) {
      // Tag entièrement absent ⇒ au moins une omission de ce type
      const ofType = expected.filter((entry) => entry.tag === tag);
      if (ofType.length > 0 && omittedExemptionsCount === 0) {
        omittedExemptionsCount += ofType.length;
      }
    }
  }

  return {
    omittedExemptionsCount,
    justificationVerbatimStatus: allJustificationsExact
      ? EXPECTED_JUSTIFICATION_VERBATIM
      : 'ALTEREE_OU_ABSENTE',
  };
}

describe('CASE-ARCH-09-3 — registre exemptions TSDoc (SPEC-ARCH-09)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_09_3_tsdoc_exemptions_registry_in_report', () => {
    tempHandle = createTempDir('clientsbox-arch-09-3-');
    const projectRoot = tempHandle.dir;
    materializeExemptionFixtures(projectRoot);

    generateArchitectureMarkdownAuditReport({ projectRoot });

    const reportPath = resolveReportPath(projectRoot);
    const reportContent = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';

    const analysis = analyzeTsDocExemptionsRegistry(reportContent, EXPECTED_EXEMPTIONS);

    // Alors il comporte une section dédiée listant chacune des exemptions
    // actives — exemptions omises = 0
    expect(analysis.omittedExemptionsCount).toBe(0);

    // Et chaque ligne mentionne fichier, ligne, symbole et justification
    // textuelle — justification verbatim = Exacte
    expect(analysis.justificationVerbatimStatus).toBe(EXPECTED_JUSTIFICATION_VERBATIM);
  });
});
