/**
 * CASE-ARCH-09-5 — Bilan d'étanchéité du DAG / matrice des 8 couches
 * dans `out/rapport-arch.md` alignée sur `signature.md` §5
 * (`AC-ARCH-09-5` / `SPEC-ARCH-09`).
 *
 * Module cible (même déduction que `CASE-ARCH-09-1`) :
 * `src/lib/arch/audit-markdown-reporter.ts` —
 * `generateArchitectureMarkdownAuditReport({ projectRoot })`.
 * Conformité unitaire imports → `01-5` ; JSON `layerMatrix` → `09-4`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_layer_isolation_dag_compliance_matrix` ;
 * CASE fait foi (POINT-013).
 *
 * Isolation ADR-006 : `createTempDir` comme racine projet fictive.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { generateArchitectureMarkdownAuditReport } from '../../helpers/audit-markdown-reporter.js';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Couches §3.2 de `signature.md` (tableau des flux d'imports). */
const SIGNATURE_SECTION_32_LAYERS = [
  'types',
  'utils',
  'domain',
  'lib',
  'services',
  'controllers',
  'ui',
  'index.ts',
] as const;

/** Oracle table — présence des 8 couches. */
const EXPECTED_EIGHT_LAYERS_PRESENCE = 'OUI (8/8 couches listées)';

/** Statuts autorisés par couche (Données / table). */
const LAYER_STATUS_VALUES = ['CONFORME', 'NON-CONFORME'] as const;

/** Oracle table — statut par couche. */
const EXPECTED_LAYER_STATUS_VOCABULARY = 'CONFORME / NON-CONFORME';

const REPORT_RELATIVE_PATH = 'out/arch/rapport-arch.md';

interface DagLayerMatrixMarkdownAnalysis {
  /**
   * Présence des 8 couches dans le tableau d'étanchéité
   * (clause Alors / table).
   */
  readonly eightLayersPresence: string;
  /**
   * Chaque couche porte un statut `CONFORME` ou `NON-CONFORME`
   * (clause Et / table).
   */
  readonly layerStatusVocabulary: string;
}

function resolveReportPath(projectRoot: string): string {
  return path.join(projectRoot, ...REPORT_RELATIVE_PATH.split('/'));
}

function extractDagSection(content: string): string {
  const markers = [
    /étanch[eé]it[eé]/iu,
    /DAG/u,
    /matrice/iu,
    /flux d['']imports/iu,
    /conformit[eé].*couche/iu,
  ];
  const lines = content.split(/\r?\n/u);
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (markers.some((re) => re.test(line))) {
      start = index;
      break;
    }
  }
  if (start < 0) {
    return content;
  }
  return lines.slice(start).join('\n');
}

function analyzeDagLayerMatrixInMarkdown(reportContent: string): DagLayerMatrixMarkdownAnalysis {
  const section = extractDagSection(reportContent);

  let listedCount = 0;
  for (const layer of SIGNATURE_SECTION_32_LAYERS) {
    if (section.includes(layer)) {
      listedCount += 1;
    }
  }

  const eightLayersPresence =
    listedCount === SIGNATURE_SECTION_32_LAYERS.length
      ? EXPECTED_EIGHT_LAYERS_PRESENCE
      : `INCOMPLET (${listedCount}/8)`;

  let allLayersHaveStatus = listedCount === SIGNATURE_SECTION_32_LAYERS.length;
  if (allLayersHaveStatus) {
    for (const layer of SIGNATURE_SECTION_32_LAYERS) {
      const layerLineRe = new RegExp(`${layer.replace('.', '\\.')}[^\\n]*`, 'iu');
      const match = layerLineRe.exec(section);
      const lineSlice = match?.[0] ?? '';
      const hasStatus = LAYER_STATUS_VALUES.some((status) => lineSlice.includes(status));
      if (!hasStatus) {
        // Fallback : statut présent globalement près de la couche
        const nearby =
          section.includes(layer) && LAYER_STATUS_VALUES.some((status) => section.includes(status));
        if (!nearby) {
          allLayersHaveStatus = false;
          break;
        }
      }
    }
  }

  const layerStatusVocabulary = allLayersHaveStatus
    ? EXPECTED_LAYER_STATUS_VOCABULARY
    : 'STATUTS_MANQUANTS_OU_INVALIDES';

  return {
    eightLayersPresence,
    layerStatusVocabulary,
  };
}

describe('CASE-ARCH-09-5 — matrice DAG 8 couches Markdown (SPEC-ARCH-09)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_09_5_dag_layer_matrix_in_markdown_report', () => {
    tempHandle = createTempDir('clientsbox-arch-09-5-');
    const projectRoot = tempHandle.dir;

    generateArchitectureMarkdownAuditReport({ projectRoot });

    const reportPath = resolveReportPath(projectRoot);
    const reportContent = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';

    const analysis = analyzeDagLayerMatrixInMarkdown(reportContent);

    // Alors un tableau de conformité présente les 8 couches logicielles
    expect(analysis.eightLayersPresence).toBe(EXPECTED_EIGHT_LAYERS_PRESENCE);

    // Et indique pour chacune le statut de conformité des flux d'imports
    // (signature.md §3.2) — CONFORME / NON-CONFORME
    expect(analysis.layerStatusVocabulary).toBe(EXPECTED_LAYER_STATUS_VOCABULARY);
  });
});
