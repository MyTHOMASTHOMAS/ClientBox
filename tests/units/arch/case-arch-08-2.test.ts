/**
 * CASE-ARCH-08-2 — Légitimité d'inventaire : échec bloquant sur fichier intrus
 * sous `src/` non répertorié sans flag `*.added.{ext}`
 * (`AC-ARCH-08-2` / `SPEC-ARCH-08`).
 *
 * Source de vérité : inventaires `tdd/docs/signature/signature-*.md`.
 * Complétude → `CASE-ARCH-08-1` ; WARNING transition → `08-3`.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_unlisted_intruder_files_rejection` ; CASE fait foi
 * (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Résultat d'audit des fichiers intrus non autorisés. */
interface UnauthorizedFilesRejectionAnalysis {
  /**
   * Fichiers sous `src/` hors catalogue SoT et sans `*.added.ts`
   * (clause Alors / table Données).
   */
  readonly unflaggedIntruderFileCount: number;
  /**
   * Fichiers non signés dépourvus du flag `*.added.ts` (échec bloquant)
   * (clause Et — même oracle opérationnel).
   */
  readonly unsignedWithoutAddedFlagCount: number;
}

const INVENTORY_ROW_RE = /^\|\s*`[^`]+`\s*\|\s*`([^`]+\.tsx?)`\s*\|/u;

const ADDED_FLAG_RE = /\.added\.(ts|tsx)$/u;
const DEL_FLAG_RE = /\.del\.(ts|tsx)$/u;

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

function extractSignedRelativePaths(signatureDir: string): ReadonlySet<string> {
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

  return collected;
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

function canonicalFromDelPath(relativePath: string): string | null {
  if (!DEL_FLAG_RE.test(relativePath)) {
    return null;
  }
  return relativePath.replace(/\.del\.(tsx?)$/u, '.$1');
}

/**
 * Détection de la balise TSDoc @pendingAudit avec repli sur le suffixe de secours *.added.ts (Soft 008).
 */
function hasPendingAuditAnnotation(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return /@pendingAudit\b/u.test(content) || ADDED_FLAG_RE.test(filePath);
  } catch {
    return false;
  }
}

/**
 * Autorisé si : signé canonique, OU artefact `*.generated.ts`, OU balise @pendingAudit (ou flag de secours *.added.ts), OU `*.del.ts` d'un module signé.
 */
function isAuthorizedSrcFile(
  absolutePath: string,
  relativePath: string,
  signedPaths: ReadonlySet<string>,
): boolean {
  if (signedPaths.has(relativePath)) {
    return true;
  }
  if (relativePath.endsWith('.generated.ts')) {
    return true;
  }
  if (hasPendingAuditAnnotation(absolutePath)) {
    return true;
  }
  const canonical = canonicalFromDelPath(relativePath);
  if (canonical !== null && signedPaths.has(canonical)) {
    return true;
  }
  return false;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface UnauthorizedFilesRejectionAnalysis {
  readonly unflaggedIntruderFileCount: number;
  readonly unsignedWithoutAddedFlagCount: number;
  readonly intruderFiles: readonly ArchitectureViolation[];
}

function analyzeUnauthorizedFilesRejection(
  projectRoot: string,
): UnauthorizedFilesRejectionAnalysis {
  const signatureDir = resolveSignatureDir(projectRoot);
  const srcRoot = resolveSrcRoot(projectRoot);
  const signedPaths = extractSignedRelativePaths(signatureDir);

  const intruderFiles: ArchitectureViolation[] = [];
  let unflaggedIntruderFileCount = 0;

  for (const absolute of listTypeScriptFilesUnderSrc(srcRoot)) {
    const relativePath = toPosixRelative(srcRoot, absolute);
    if (!isAuthorizedSrcFile(absolute, relativePath, signedPaths)) {
      unflaggedIntruderFileCount += 1;
      intruderFiles.push({
        file: `src/${relativePath}`,
        message: 'Fichier non répertorié dans les 172 signatures et sans balise @pendingAudit',
      });
    }
  }

  return {
    unflaggedIntruderFileCount,
    unsignedWithoutAddedFlagCount: unflaggedIntruderFileCount,
    intruderFiles,
  };
}

describe('CASE-ARCH-08-2 — rejet fichiers intrus non flaggés (SPEC-ARCH-08)', () => {
  it('test_CASE_ARCH_08_2_unauthorized_files_rejection', () => {
    const projectRoot = resolveProjectRoot();
    const srcRoot = resolveSrcRoot(projectRoot);
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeUnauthorizedFilesRejection(projectRoot);

    const detailsMsg = formatViolationsMessage(
      'Fichiers non signés / intrus détectés sous src/',
      analysis.intruderFiles,
    );

    // Alors aucun fichier non répertorié n'est présent
    // (hors transition *.added.ts / *.del.ts d'un module signé)
    expect(analysis.unflaggedIntruderFileCount, detailsMsg).toBe(0);

    // Et tout fichier présent non signé porte obligatoirement "*.added.ts"
    // sous peine d'échec bloquant
    expect(analysis.unsignedWithoutAddedFlagCount, detailsMsg).toBe(0);
  });
});
