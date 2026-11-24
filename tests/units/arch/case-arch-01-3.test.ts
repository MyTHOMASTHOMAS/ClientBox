/**
 * CASE-ARCH-01-3 — Étanchéité stricte de la couche src/controllers/
 * (`AC-ARCH-01-3` / `SPEC-ARCH-01` / `CTL-001..003`).
 *
 * Sujet sous test : fichiers TypeScript sous src/controllers/.
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70 — aucun analyseur signé sous src/).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Couches autorisées en import depuis controllers/ (Données CASE + signature-controllers). */
const ALLOWED_LAYER_NAMES: readonly string[] = [
  'types',
  'utils',
  'services',
  'controllers',
] as const;

/** Résultat d'audit d'étanchéité des contrôleurs. */
interface ControllersIsolationAnalysis {
  /** Imports relatifs résolus vers src/domain/. */
  readonly domainImportCount: number;
  /** Imports relatifs résolus vers src/lib/. */
  readonly libImportCount: number;
  /**
   * Imports relatifs sous src/ hors allow-list
   * (types / utils / services / intra-controllers).
   */
  readonly nonAllowListedSrcImportCount: number;
  /** Liste détaillée des violations par règle. */
  readonly violationsByCheck: {
    readonly domainImports: readonly ArchitectureViolation[];
    readonly libImports: readonly ArchitectureViolation[];
    readonly nonAllowListedSrcImports: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

function resolveControllersRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src/controllers');
}

function resolveSrcRoot(): string {
  return path.resolve(resolveControllersRoot(), '..');
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

function resolveRelativeToFile(fromFile: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates: readonly string[] = [
    base,
    `${base}.ts`,
    base.replace(/\.js$/u, '.ts'),
    path.join(base, 'index.ts'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && candidate.endsWith('.ts')) {
      return path.normalize(candidate);
    }
  }
  return path.normalize(base.replace(/\.js$/u, '.ts'));
}

function layerOfSrcPath(resolvedPath: string, srcRoot: string): string | null {
  const relative = path.normalize(path.relative(srcRoot, resolvedPath));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  if (relative === 'index.ts') {
    return 'index';
  }
  const firstSegment = relative.split(path.sep)[0];
  return firstSegment ?? null;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeControllersIsolation(controllersRoot: string): ControllersIsolationAnalysis {
  const srcRoot = resolveSrcRoot();
  const files = listTypeScriptFiles(controllersRoot);

  let domainImportCount = 0;
  let libImportCount = 0;
  let nonAllowListedSrcImportCount = 0;

  const domainImports: ArchitectureViolation[] = [];
  const libImports: ArchitectureViolation[] = [];
  const nonAllowListedSrcImports: ArchitectureViolation[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(srcRoot, file);

    const checkSpecifiers = (pattern: RegExp) => {
      for (const match of raw.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier === undefined || !specifier.startsWith('.')) {
          continue;
        }

        const offset = match.index ?? 0;
        const line = lineAtOffset(raw, offset);

        const resolved = resolveRelativeToFile(file, specifier);
        if (resolved === null) {
          continue;
        }

        const layer = layerOfSrcPath(resolved, srcRoot);
        if (layer === null) {
          continue;
        }

        const targetRel = path.relative(srcRoot, resolved);

        if (layer === 'domain') {
          domainImportCount += 1;
          domainImports.push({
            file: relFile,
            line,
            message: `Import interdit du module domain (${targetRel}) depuis les contrôleurs`,
          });
        }
        if (layer === 'lib') {
          libImportCount += 1;
          libImports.push({
            file: relFile,
            line,
            message: `Import interdit du module lib (${targetRel}) depuis les contrôleurs`,
          });
        }

        if (!ALLOWED_LAYER_NAMES.includes(layer)) {
          nonAllowListedSrcImportCount += 1;
          nonAllowListedSrcImports.push({
            file: relFile,
            line,
            message: `Import interdit de la couche ${layer} (${targetRel}) depuis les contrôleurs`,
          });
        }
      }
    };

    checkSpecifiers(IMPORT_SPECIFIER_RE);
    checkSpecifiers(EXPORT_FROM_SPECIFIER_RE);
  }

  return {
    domainImportCount,
    libImportCount,
    nonAllowListedSrcImportCount,
    violationsByCheck: {
      domainImports,
      libImports,
      nonAllowListedSrcImports,
    },
  };
}

describe('CASE-ARCH-01-3 — étanchéité stricte de src/controllers/ (SPEC-ARCH-01)', () => {
  it('test_CASE_ARCH_01_3_controllers_layer_isolation', () => {
    const controllersRoot = resolveControllersRoot();
    const analysis = analyzeControllersIsolation(controllersRoot);

    // Alors aucun fichier de contrôleur n'importe de module depuis "src/domain/"
    expect(
      analysis.domainImportCount,
      formatViolationsMessage(
        'Imports illicites de src/domain/ depuis controllers/',
        analysis.violationsByCheck.domainImports,
      ),
    ).toBe(0);

    // Et aucun fichier de contrôleur n'importe de module depuis "src/lib/"
    expect(
      analysis.libImportCount,
      formatViolationsMessage(
        'Imports illicites de src/lib/ depuis controllers/',
        analysis.violationsByCheck.libImports,
      ),
    ).toBe(0);

    // Et toutes les interactions métier et techniques passent par services/ et types/
    // (allow-list Données CASE : types, utils, services ; intra-controllers toléré)
    expect(
      analysis.nonAllowListedSrcImportCount,
      formatViolationsMessage(
        'Imports de couches non autorisées depuis controllers/',
        analysis.violationsByCheck.nonAllowListedSrcImports,
      ),
    ).toBe(0);
  });
});
