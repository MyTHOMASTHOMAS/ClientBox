/**
 * CASE-ARCH-03-1 — Monopole absolu des imports I/O Node.js dans src/lib/
 * (`AC-ARCH-03-1` / `SPEC-ARCH-03` / `LIB-001..011`).
 *
 * Sujet sous test : fichiers TypeScript sous src/ hors src/lib/
 * (couches types/utils/domain/services/controllers/ui + src/index.ts).
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70).
 *
 * `process.on` dans index (SIGINT/SIGTERM) est hors périmètre de ce scan
 * (AC-ARCH-03-1) : seules les déclarations d'import sont comptées.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * aligné avec le prompt dédié.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Modules I/O surveillés (Données CASE) —
 * équivalence stricte node:X ≡ X.
 */
const MONITORED_IO_MODULES: ReadonlySet<string> = new Set([
  'fs',
  'child_process',
  'os',
  'path',
  'net',
  'http',
  'url',
  'vm',
  'module',
  'process',
]);

/** Couches interdites pour la clause Alors (hors lib/, hors index). */
const FORBIDDEN_LAYERS: readonly string[] = [
  'types',
  'utils',
  'domain',
  'services',
  'controllers',
  'ui',
];

/** Résultat d'audit monopole I/O hors lib/. */
interface LibIoMonopolyAnalysis {
  /** Imports I/O dans types/utils/domain/services/controllers/ui. */
  readonly forbiddenLayerIoImportCount: number;
  /** Imports I/O dans src/index.ts. */
  readonly indexIoImportCount: number;
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

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
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        collected.push(path.normalize(absolute));
      }
    }
  }

  walk(rootDir);
  return collected;
}

function stripComments(sourceText: string): string {
  const withoutBlock = sourceText.replace(/\/\*[\s\S]*?\*\//gu, '');
  return withoutBlock.replace(/^\s*\/\/.*$/gmu, '');
}

function extractSpecifiers(sourceText: string, pattern: RegExp): readonly string[] {
  const found: string[] = [];
  for (const match of sourceText.matchAll(pattern)) {
    const specifier = match[1];
    if (specifier !== undefined) {
      found.push(specifier);
    }
  }
  return found;
}

function normalizeNodeModuleId(specifier: string): string {
  return specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;
}

function isMonitoredIoModule(specifier: string): boolean {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return false;
  }
  const normalized = normalizeNodeModuleId(specifier);
  const rootId = normalized.split('/')[0] ?? normalized;
  return MONITORED_IO_MODULES.has(rootId);
}

function countIoImportsInFile(filePath: string): number {
  const raw = fs.readFileSync(filePath, 'utf8');
  const stripped = stripComments(raw);
  const specifiers = [
    ...extractSpecifiers(stripped, IMPORT_SPECIFIER_RE),
    ...extractSpecifiers(stripped, EXPORT_FROM_SPECIFIER_RE),
  ];
  let count = 0;
  for (const specifier of specifiers) {
    if (isMonitoredIoModule(specifier)) {
      count += 1;
    }
  }
  return count;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface LibIoMonopolyAnalysis {
  readonly forbiddenLayerIoImportCount: number;
  readonly indexIoImportCount: number;
  readonly forbiddenLayerViolations: readonly ArchitectureViolation[];
  readonly indexViolations: readonly ArchitectureViolation[];
}

function collectIoImportsInFile(displayPath: string, filePath: string): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/u);

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx] ?? '';
    const stripped = stripComments(line);
    const specifiers = [
      ...extractSpecifiers(stripped, IMPORT_SPECIFIER_RE),
      ...extractSpecifiers(stripped, EXPORT_FROM_SPECIFIER_RE),
    ];
    for (const specifier of specifiers) {
      if (isMonitoredIoModule(specifier)) {
        violations.push({
          file: displayPath,
          line: idx + 1,
          symbol: specifier,
          message: `Import I/O Node.js "${specifier}" interdit (monopole exclusif à src/lib/)`,
        });
      }
    }
  }

  return violations;
}

function analyzeLibIoMonopoly(srcRoot: string): LibIoMonopolyAnalysis {
  const forbiddenLayerViolations: ArchitectureViolation[] = [];
  const indexViolations: ArchitectureViolation[] = [];

  for (const layer of FORBIDDEN_LAYERS) {
    const layerRoot = path.join(srcRoot, layer);
    for (const file of listTypeScriptFiles(layerRoot)) {
      const rel = path.relative(srcRoot, file).split(path.sep).join('/');
      const v = collectIoImportsInFile(`src/${rel}`, file);
      forbiddenLayerViolations.push(...v);
    }
  }

  const indexPath = path.join(srcRoot, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const v = collectIoImportsInFile('src/index.ts', indexPath);
    indexViolations.push(...v);
  }

  return {
    forbiddenLayerIoImportCount: forbiddenLayerViolations.length,
    indexIoImportCount: indexViolations.length,
    forbiddenLayerViolations,
    indexViolations,
  };
}

describe('CASE-ARCH-03-1 — monopole I/O Node.js dans src/lib/ (SPEC-ARCH-03)', () => {
  it('test_CASE_ARCH_03_1_lib_layer_io_monopoly', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeLibIoMonopoly(srcRoot);
    const forbiddenMsg = formatViolationsMessage(
      'Imports I/O Node.js interdits hors de src/lib/',
      analysis.forbiddenLayerViolations,
    );
    const indexMsg = formatViolationsMessage(
      'Imports I/O Node.js interdits dans src/index.ts',
      analysis.indexViolations,
    );

    // Alors aucune occurrence n'est trouvée dans types/, utils/, domain/, services/, controllers/ ou ui/
    expect(analysis.forbiddenLayerIoImportCount, forbiddenMsg).toBe(0);

    // Et src/index.ts n'importe aucun de ces modules I/O
    expect(analysis.indexIoImportCount, indexMsg).toBe(0);
  });
});
