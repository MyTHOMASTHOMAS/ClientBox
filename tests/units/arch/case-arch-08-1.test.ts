/**
 * CASE-ARCH-08-1 — Complétude d'inventaire : présence physique des 172 modules
 * signés sous nom canonique ou `*.del.{ext}` (`AC-ARCH-08-1` / `SPEC-ARCH-08`).
 *
 * Source de vérité : inventaires `tdd/docs/signature/signature-*.md`
 * (hors templates). Intrus → `CASE-ARCH-08-2` ; WARNING transition → `08-3`.
 *
 * Nom de test : contrat fiche CASE (= prompt §1, alignés).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Résultat d'audit de complétude d'inventaire signé. */
interface SignedModulesInventoryCompletenessAnalysis {
  /**
   * Modules signés absents en canonique et absents en `*.del.ts`
   * (clause Alors).
   */
  readonly missingSignedModuleCount: number;
  /**
   * Modules officiels manquants sans flag de transition
   * (clause Et — même oracle opérationnel).
   */
  readonly officialModuleMissingWithoutFlagCount: number;
  /** Cardinalité SoT (Données : 172 modules signés). */
  readonly signedModuleCount: number;
}

const EXPECTED_SIGNED_MODULE_COUNT = 200;

/** Ligne d'inventaire : `| \`ID\` | \`chemin/relatif.(ts|tsx)\` | … |`. */
const INVENTORY_ROW_RE = /^\|\s*`[^`]+`\s*\|\s*`([^`]+\.tsx?)`\s*\|/u;

function resolveProjectRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../..');
}

function resolveSignatureDir(projectRoot: string): string {
  return path.join(projectRoot, 'tdd/docs/signature');
}

function resolveSrcRoot(projectRoot: string): string {
  return path.join(projectRoot, 'src');
}

function listSignatureInventoryFiles(signatureDir: string): readonly string[] {
  if (!fs.existsSync(signatureDir)) {
    return [];
  }
  return fs
    .readdirSync(signatureDir)
    .filter(
      (name) =>
        name.startsWith('signature-') && name.endsWith('.md') && !name.endsWith('.template.md'),
    )
    .map((name) => path.join(signatureDir, name))
    .sort();
}

/**
 * Extrait les chemins relatifs `src/` délimités par <!-- SIGNATURE-INVENTORY-START -->
 * et <!-- SIGNATURE-INVENTORY-END --> avec fallback rétrocompatible sur l'ancienne syntaxe.
 */
function extractSignedRelativePaths(signatureDir: string): readonly string[] {
  const collected = new Set<string>();
  const TAG_START = '<!-- SIGNATURE-INVENTORY-START -->';
  const TAG_END = '<!-- SIGNATURE-INVENTORY-END -->';
  const ROW_RE = /^\|\s*`?([A-Z]+-[0-9]+)`?\s*\|\s*`?([^`|\s]+\.tsx?)`?\s*\|/u;

  for (const absolute of listSignatureInventoryFiles(signatureDir)) {
    const content = fs.readFileSync(absolute, 'utf8');

    // 1. Extraction prioritaire via balises normalisées
    if (content.includes(TAG_START) && content.includes(TAG_END)) {
      const block = content.substring(
        content.indexOf(TAG_START) + TAG_START.length,
        content.indexOf(TAG_END),
      );
      for (const line of block.split(/\r?\n/u)) {
        const match = ROW_RE.exec(line.trim());
        if (match?.[2]) {
          collected.add(match[2].replace(/\\/gu, '/'));
        }
      }
      continue;
    }

    // 2. Fallback rétrocompatible sur ancienne syntaxe
    const lines = content.split(/\r?\n/u);
    let inInventory = false;
    for (const line of lines) {
      if (line.includes('Inventaire des Fichiers')) {
        inInventory = true;
        continue;
      }
      if (inInventory && /^##\s+/u.test(line)) {
        inInventory = false;
        continue;
      }
      if (!inInventory) {
        continue;
      }
      const match = INVENTORY_ROW_RE.exec(line);
      if (match?.[1] !== undefined) {
        collected.add(match[1].replace(/\\/gu, '/'));
      }
    }
  }

  return [...collected].sort();
}

function toDelTransitionPath(relativePath: string): string {
  if (relativePath.endsWith('.tsx')) {
    return `${relativePath.slice(0, -4)}.del.tsx`;
  }
  if (relativePath.endsWith('.ts')) {
    return `${relativePath.slice(0, -3)}.del.ts`;
  }
  return `${relativePath}.del.ts`;
}

function hasCanonicalOrDelPresence(srcRoot: string, relativePath: string): boolean {
  const canonical = path.join(srcRoot, relativePath);
  if (fs.existsSync(canonical) && fs.statSync(canonical).isFile()) {
    return true;
  }
  const delPath = path.join(srcRoot, toDelTransitionPath(relativePath));
  return fs.existsSync(delPath) && fs.statSync(delPath).isFile();
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface SignedModulesInventoryCompletenessAnalysis {
  readonly missingSignedModuleCount: number;
  readonly officialModuleMissingWithoutFlagCount: number;
  readonly signedModuleCount: number;
  readonly missingModules: readonly ArchitectureViolation[];
}

function analyzeSignedModulesInventoryCompleteness(
  projectRoot: string,
): SignedModulesInventoryCompletenessAnalysis {
  const signatureDir = resolveSignatureDir(projectRoot);
  const srcRoot = resolveSrcRoot(projectRoot);
  const signedPaths = extractSignedRelativePaths(signatureDir);

  const missingModules: ArchitectureViolation[] = [];
  let missingSignedModuleCount = 0;
  for (const relativePath of signedPaths) {
    if (!hasCanonicalOrDelPresence(srcRoot, relativePath)) {
      missingSignedModuleCount += 1;
      missingModules.push({
        file: `src/${relativePath}`,
        message: 'Module officiel signé manquant (aucun fichier canonique ni *.del.ts)',
      });
    }
  }

  return {
    missingSignedModuleCount,
    officialModuleMissingWithoutFlagCount: missingSignedModuleCount,
    signedModuleCount: signedPaths.length,
    missingModules,
  };
}

describe('CASE-ARCH-08-1 — complétude inventaire modules signés (SPEC-ARCH-08)', () => {
  it('test_CASE_ARCH_08_1_signed_modules_inventory_completeness', () => {
    const projectRoot = resolveProjectRoot();
    const srcRoot = resolveSrcRoot(projectRoot);
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeSignedModulesInventoryCompleteness(projectRoot);

    if (analysis.signedModuleCount !== EXPECTED_SIGNED_MODULE_COUNT) {
      throw new Error(
        `SoT signatures : attendu ${String(EXPECTED_SIGNED_MODULE_COUNT)} modules, trouvé ${String(analysis.signedModuleCount)}`,
      );
    }

    const detailsMsg = formatViolationsMessage(
      'Modules signés officiels manquants sous src/',
      analysis.missingModules,
    );

    // Alors chaque module existe sous son chemin canonique (ou "*.del.ts")
    expect(analysis.missingSignedModuleCount, detailsMsg).toBe(0);

    // Et aucun module officiel n'est manquant sans flag
    expect(analysis.officialModuleMissingWithoutFlagCount, detailsMsg).toBe(0);
  });
});
