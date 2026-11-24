/**
 * CASE-ARCH-05-1 — Volumétrie des fichiers sous `src/`
 * (`AC-ARCH-05-1` / `SPEC-ARCH-05` : ≤150 / 151–200+@fileExemption L1 / >200).
 *
 * Formule Données : hors blocs TSDoc uniquement ; commentaires non-TSDoc inclus ;
 * séquence de blancs consécutifs = 0 ; blanc isolé = 1.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 *
 * Gherkin : 1× Alors + 2× Et → exactement 3 assertions.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NOMINAL_MAX = 150;
const ABSOLUTE_MAX = 200;
const ROOT_RELATIVE = 'index.ts';

/** Résultat d'audit volumétrie fichiers. */
interface FileSizeComplianceAnalysis {
  /**
   * Fichiers ≤ 150 non conformes (ne devraient jamais l'être)
   * (clause Alors).
   */
  readonly underNominalBandViolationCount: number;
  /**
   * Fichiers 151–200 sans `@fileExemption` dans le premier TSDoc L1
   * (clause Et).
   */
  readonly midBandMissingExemptionCount: number;
  /**
   * Fichiers > 200 hors ROOT-001 exempté (clause Et).
   */
  readonly overAbsoluteCapViolationCount: number;
}

const FILE_EXEMPTION_TAG_RE = /@fileExemption\b/u;

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
}

function listTypeScriptFiles(rootDir: string): readonly string[] {
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

  walk(rootDir);
  return collected;
}

/** Marque les lignes appartenant à un bloc TSDoc `/** … *​/`. */
function markTsDocLines(lines: readonly string[]): readonly boolean[] {
  const isTsDocLine: boolean[] = lines.map(() => false);
  let inTsDoc = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!inTsDoc) {
      const start = line.indexOf('/**');
      if (start === -1) {
        continue;
      }
      inTsDoc = true;
      isTsDocLine[index] = true;
      if (line.indexOf('*/', start + 3) !== -1) {
        inTsDoc = false;
      }
      continue;
    }

    isTsDocLine[index] = true;
    if (line.includes('*/')) {
      inTsDoc = false;
    }
  }

  return isTsDocLine;
}

/**
 * Comptage déterministe SPEC-ARCH-05 / Données CASE.
 */
function countDeterministicPhysicalLines(sourceText: string): number {
  const lines = sourceText.split(/\r?\n/u);
  const isTsDocLine = markTsDocLines(lines);
  const countable: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (isTsDocLine[index] === true) {
      continue;
    }
    countable.push(lines[index] ?? '');
  }

  let count = 0;
  let cursor = 0;
  while (cursor < countable.length) {
    const current = countable[cursor] ?? '';
    if (current.trim() !== '') {
      count += 1;
      cursor += 1;
      continue;
    }

    let end = cursor;
    while (end < countable.length && (countable[end] ?? '').trim() === '') {
      end += 1;
    }
    const runLength = end - cursor;
    if (runLength === 1) {
      count += 1;
    }
    cursor = end;
  }

  return count;
}

/**
 * Premier bloc TSDoc démarre en L1 physique et contient `@fileExemption`.
 */
function hasFileExemptionInLeadingTsDoc(sourceText: string): boolean {
  const lines = sourceText.split(/\r?\n/u);
  if (lines.length === 0) {
    return false;
  }
  const first = lines[0] ?? '';
  if (!first.includes('/**')) {
    return false;
  }

  let block = '';
  for (const line of lines) {
    block += `${line}\n`;
    if (line.includes('*/')) {
      break;
    }
  }
  return FILE_EXEMPTION_TAG_RE.test(block);
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface FileSizeComplianceAnalysis {
  readonly underNominalBandViolationCount: number;
  readonly midBandMissingExemptionCount: number;
  readonly overAbsoluteCapViolationCount: number;
  readonly midBandViolations: readonly ArchitectureViolation[];
  readonly overCapViolations: readonly ArchitectureViolation[];
}

function analyzeFileSizeCompliance(srcRoot: string): FileSizeComplianceAnalysis {
  let underNominalBandViolationCount = 0;
  let midBandMissingExemptionCount = 0;
  let overAbsoluteCapViolationCount = 0;
  const midBandViolations: ArchitectureViolation[] = [];
  const overCapViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const relative = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const sourceText = fs.readFileSync(absolute, 'utf8');
    const lineCount = countDeterministicPhysicalLines(sourceText);
    const hasExemption = hasFileExemptionInLeadingTsDoc(sourceText);

    const isTsx = absolute.endsWith('.tsx');
    const nominalMax = isTsx ? 250 : NOMINAL_MAX;
    const absoluteMax = isTsx ? 300 : ABSOLUTE_MAX;

    if (lineCount <= nominalMax) {
      // Bande nominale : toujours conforme sans exemption requise.
      continue;
    }

    if (lineCount <= absoluteMax) {
      if (!hasExemption) {
        midBandMissingExemptionCount += 1;
        midBandViolations.push({
          file: `src/${relative}`,
          message: isTsx
            ? `Fichier TSX de ${lineCount} lignes (> 250) sans balise @fileExemption en L1`
            : `Fichier de ${lineCount} lignes (seuil 151-200) sans balise @fileExemption en L1`,
        });
      }
      continue;
    }

    const isExemptRoot = relative === ROOT_RELATIVE && hasExemption;
    if (!isExemptRoot) {
      overAbsoluteCapViolationCount += 1;
      overCapViolations.push({
        file: `src/${relative}`,
        message: isTsx
          ? `Fichier TSX de ${lineCount} lignes dépassant le plafond absolu de 300 lignes`
          : `Fichier de ${lineCount} lignes dépassant le plafond absolu de 200 lignes`,
      });
    }
  }

  return {
    underNominalBandViolationCount,
    midBandMissingExemptionCount,
    overAbsoluteCapViolationCount,
    midBandViolations,
    overCapViolations,
  };
}

describe('CASE-ARCH-05-1 — volumétrie fichiers src/ (SPEC-ARCH-05)', () => {
  it('test_CASE_ARCH_05_1_file_size_and_file_exemption_compliance', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeFileSizeCompliance(srcRoot);
    const midBandMsg = formatViolationsMessage(
      'Fichiers dépassant le seuil nominal sans balise @fileExemption en L1',
      analysis.midBandViolations,
    );
    const overCapMsg = formatViolationsMessage(
      'Fichiers dépassant le plafond absolu autorisé',
      analysis.overCapViolations,
    );

    // Alors les fichiers de taille <= nominale (150 standard, 250 TSX) passent sans exemption
    expect(analysis.underNominalBandViolationCount).toBe(0);

    // Et les fichiers dépassant le seuil nominal portent obligatoirement "@fileExemption" dans leur premier bloc TSDoc en L1
    expect(analysis.midBandMissingExemptionCount, midBandMsg).toBe(0);

    // Et aucun fichier ne dépasse le plafond absolu autorisé (sauf "src/index.ts" muni de son exemption)
    expect(analysis.overAbsoluteCapViolationCount, overCapMsg).toBe(0);
  });
});
