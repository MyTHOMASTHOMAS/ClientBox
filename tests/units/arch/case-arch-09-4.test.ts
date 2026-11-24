/**
 * CASE-ARCH-09-4 — Génération concomitante de `out/arch-report.json`
 * (statut, métriques, warnings, exemptions, layerMatrix 8 couches)
 * (`AC-ARCH-09-4` / `SPEC-ARCH-09`).
 *
 * Module cible (génération concomitante MD+JSON, même déduction `09-1`) :
 * `src/lib/arch/audit-markdown-reporter.ts` —
 * `generateArchitectureMarkdownAuditReport({ projectRoot })`
 * produit aussi `out/arch-report.json`.
 * Markdown → `09-1` ; matrice Markdown → `09-5`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_structured_json_audit_report_generation` ;
 * CASE fait foi (POINT-013).
 *
 * Isolation ADR-006 : `createTempDir` comme racine projet fictive.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { generateArchitectureMarkdownAuditReport } from '../../helpers/audit-markdown-reporter.js';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Fichier JSON (Données CASE). */
const JSON_REPORT_RELATIVE_PATH = 'out/arch/arch-report.json';

/** Oracle table — validité JSON. */
const EXPECTED_JSON_VALIDITY = '100 % (Parse sans erreur)';

/** Les 8 couches (signature.md §3.2 / inventaires de couches). */
const EXPECTED_LAYER_KEYS = [
  'src',
  'types',
  'utils',
  'domain',
  'lib',
  'services',
  'controllers',
  'ui',
] as const;

/** Champs Gherkin Et + structure Données. */
const REQUIRED_TOP_LEVEL_KEYS = [
  'timestamp',
  'status',
  'metrics',
  'warnings',
  'exemptions',
  'layerMatrix',
] as const;

const REQUIRED_METRICS_KEYS = ['total', 'passed', 'failed', 'warnings'] as const;

interface JsonStructuredArchitectureReportAnalysis {
  /**
   * Validité du parse JSON (clause Alors / table).
   */
  readonly jsonParseValidity: string;
  /**
   * Présence de `layerMatrix` (8 couches) et des champs Gherkin Et
   * (clause Et / table : `OUI`).
   */
  readonly layerMatrixPresence: 'OUI' | 'NON';
}

function resolveJsonReportPath(projectRoot: string): string {
  return path.join(projectRoot, ...JSON_REPORT_RELATIVE_PATH.split('/'));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasRequiredMetrics(metrics: unknown): boolean {
  if (!isPlainObject(metrics)) {
    return false;
  }
  return REQUIRED_METRICS_KEYS.every((key) => key in metrics);
}

function hasEightLayerMatrix(layerMatrix: unknown): boolean {
  if (!isPlainObject(layerMatrix)) {
    return false;
  }
  return EXPECTED_LAYER_KEYS.every((layer) => layer in layerMatrix);
}

function analyzeJsonStructuredArchitectureReport(
  projectRoot: string,
): JsonStructuredArchitectureReportAnalysis {
  const reportPath = resolveJsonReportPath(projectRoot);

  if (!fs.existsSync(reportPath)) {
    return {
      jsonParseValidity: 'FICHIER_ABSENT_OU_INVALIDE',
      layerMatrixPresence: 'NON',
    };
  }

  const raw = fs.readFileSync(reportPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return {
      jsonParseValidity: 'FICHIER_ABSENT_OU_INVALIDE',
      layerMatrixPresence: 'NON',
    };
  }

  const jsonParseValidity = EXPECTED_JSON_VALIDITY;

  if (!isPlainObject(parsed)) {
    return { jsonParseValidity, layerMatrixPresence: 'NON' };
  }

  const topLevelOk = REQUIRED_TOP_LEVEL_KEYS.every((key) => key in parsed);
  const metricsOk = hasRequiredMetrics(parsed['metrics']);
  const warningsOk = Array.isArray(parsed['warnings']);
  const exemptionsOk = Array.isArray(parsed['exemptions']);
  const matrixOk = hasEightLayerMatrix(parsed['layerMatrix']);

  const layerMatrixPresence: 'OUI' | 'NON' =
    topLevelOk && metricsOk && warningsOk && exemptionsOk && matrixOk ? 'OUI' : 'NON';

  return { jsonParseValidity, layerMatrixPresence };
}

describe('CASE-ARCH-09-4 — out/arch-report.json structuré (SPEC-ARCH-09)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_09_4_json_structured_architecture_report_generation', () => {
    tempHandle = createTempDir('clientsbox-arch-09-4-');
    const projectRoot = tempHandle.dir;

    // Déclencheur : fin d'exécution / reporters (génération concomitante)
    generateArchitectureMarkdownAuditReport({ projectRoot });

    const analysis = analyzeJsonStructuredArchitectureReport(projectRoot);

    // Alors le fichier "out/arch-report.json" est créé et valide au format JSON
    expect(analysis.jsonParseValidity).toBe(EXPECTED_JSON_VALIDITY);

    // Et il contient status, metrics, warnings, exemptions et layerMatrix
    // (présence matrice 8 couches = OUI)
    expect(analysis.layerMatrixPresence).toBe('OUI');
  });
});
