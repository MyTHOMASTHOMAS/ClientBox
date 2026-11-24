/**
 * CASE-ARCH-09-1 — Génération automatique de `out/rapport-arch.md`
 * à l'issue des tests d'architecture (`AC-ARCH-09-1` / `SPEC-ARCH-09`).
 *
 * Module cible déduit (SPEC-ARCH-09 + ADR-007, hors inventaire signé v1) :
 * `src/lib/arch/audit-markdown-reporter.ts` —
 * `generateArchitectureMarkdownAuditReport({ projectRoot })`.
 * Synthèse détaillée → `09-2` ; exemptions → `09-3` ; JSON → `09-4` ;
 * matrice DAG → `09-5`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_architecture_markdown_audit_report_generation` ;
 * CASE fait foi (POINT-013).
 *
 * Isolation ADR-006 : `createTempDir` comme racine projet fictive —
 * aucun écriture sous le `src/` projet ; `out/` sandbox uniquement.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { generateArchitectureMarkdownAuditReport } from '../../helpers/audit-markdown-reporter.js';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Fichier de sortie (Données CASE). */
const REPORT_RELATIVE_PATH = 'out/arch/rapport-arch.md';

/** Oracle table — horodatage et sections. */
const EXPECTED_TIMESTAMP_AND_SECTIONS = 'Présents et formatés';

/** Résultat d'audit de génération du rapport Markdown. */
interface MarkdownAuditReportGenerationAnalysis {
  /**
   * Présence du dossier `out/` à la racine (clause Alors —
   * créé s'il n'existait pas).
   */
  readonly outDirectoryPresence: 'OUI' | 'NON';
  /**
   * Horodatage + synthèse complète formatée GFM dans
   * `out/rapport-arch.md` (clause Et / table).
   */
  readonly timestampAndSectionsStatus: string;
}

function resolveOutDir(projectRoot: string): string {
  return path.join(projectRoot, 'out');
}

function resolveReportPath(projectRoot: string): string {
  return path.join(projectRoot, ...REPORT_RELATIVE_PATH.split('/'));
}

/**
 * Structure minimale de synthèse obligatoire (SPEC-ARCH-09 § règle points 1–5,
 * hors détail exhaustif délégué aux CASE 09-2…09-5).
 */
function hasFormattedTimestampAndSynthesis(content: string): boolean {
  if (content.trim().length === 0) {
    return false;
  }
  const hasTimestamp =
    /Horodatage/iu.test(content) ||
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/u.test(content) ||
    /\d{4}-\d{2}-\d{2}/u.test(content);
  const hasSynthesisHeading = /Synth[eè]se/iu.test(content) || /##\s+/u.test(content);
  return hasTimestamp && hasSynthesisHeading;
}

function analyzeMarkdownAuditReportGeneration(
  projectRoot: string,
): MarkdownAuditReportGenerationAnalysis {
  const outDir = resolveOutDir(projectRoot);
  const reportPath = resolveReportPath(projectRoot);

  const outDirectoryPresence: 'OUI' | 'NON' = fs.existsSync(outDir) ? 'OUI' : 'NON';

  let timestampAndSectionsStatus = 'ABSENTS_OU_MAL_FORMES';
  if (fs.existsSync(reportPath)) {
    const content = fs.readFileSync(reportPath, 'utf8');
    if (hasFormattedTimestampAndSynthesis(content)) {
      timestampAndSectionsStatus = EXPECTED_TIMESTAMP_AND_SECTIONS;
    }
  }

  return {
    outDirectoryPresence,
    timestampAndSectionsStatus,
  };
}

describe('CASE-ARCH-09-1 — génération out/rapport-arch.md (SPEC-ARCH-09)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_09_1_markdown_audit_report_generation', () => {
    tempHandle = createTempDir('clientsbox-arch-09-1-');
    const projectRoot = tempHandle.dir;
    // Précondition cas limite SPEC : sandbox vide ⇒ `out/` absent

    // Déclencheur Données : fin d'exécution des tests d'architecture
    generateArchitectureMarkdownAuditReport({ projectRoot });

    const analysis = analyzeMarkdownAuditReportGeneration(projectRoot);

    // Alors le dossier "out/" est créé à la racine du projet s'il n'existait pas
    expect(analysis.outDirectoryPresence).toBe('OUI');

    // Et le fichier "out/rapport-arch.md" est généré avec l'horodatage
    // et la synthèse complète des contrôles (GFM)
    expect(analysis.timestampAndSectionsStatus).toBe(EXPECTED_TIMESTAMP_AND_SECTIONS);
  });
});
