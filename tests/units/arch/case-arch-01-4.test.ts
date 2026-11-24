/**
 * CASE-ARCH-01-4 — Isolation navigateur de la couche src/ui/
 * (`AC-ARCH-01-4` / `SPEC-ARCH-01` / `UI-001..015`).
 *
 * Sujet sous test : fichiers TypeScript sous src/ui/.
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

/**
 * Modules Node interdits (Données CASE — avec ou sans préfixe node:).
 * Équivalence stricte node:X ≡ X.
 */
const FORBIDDEN_NODE_MODULES: ReadonlySet<string> = new Set([
  'fs',
  'child_process',
  'http',
  'net',
  'os',
  'path',
  'url',
  'vm',
]);

/** Couches internes autorisées depuis ui/ (Données CASE + signature-ui). */
const ALLOWED_LAYER_NAMES: readonly string[] = ['types', 'utils', 'domain', 'ui'] as const;

/** Résultat d'audit d'isolation navigateur de src/ui/. */
interface UiIsolationAnalysis {
  /** Imports de modules natifs Node.js interdits. */
  readonly nodeImportCount: number;
  /** Imports relatifs résolus vers src/lib/ ou src/services/. */
  readonly serverImportCount: number;
  /**
   * Imports relatifs sous src/ hors allow-list
   * (types / utils / domain / intra-ui).
   */
  readonly nonAllowListedSrcImportCount: number;
  /** Liste détaillée des violations par règle. */
  readonly violationsByCheck: {
    readonly nodeImports: readonly ArchitectureViolation[];
    readonly serverImports: readonly ArchitectureViolation[];
    readonly nonAllowListedSrcImports: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

function resolveUiRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src/ui');
}

function resolveSrcRoot(): string {
  return path.resolve(resolveUiRoot(), '..');
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
    `${base}.tsx`,
    base.replace(/\.js$/u, '.ts'),
    base.replace(/\.js$/u, '.tsx'),
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && (candidate.endsWith('.ts') || candidate.endsWith('.tsx'))) {
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

function normalizeNodeModuleId(specifier: string): string {
  return specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;
}

function isForbiddenNodeModule(specifier: string): boolean {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return false;
  }
  const normalized = normalizeNodeModuleId(specifier);
  // Spécificateur nu ou sous-chemin (ex: 'fs/promises', 'node:fs/promises').
  const rootId = normalized.split('/')[0] ?? normalized;
  return FORBIDDEN_NODE_MODULES.has(rootId);
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeUiIsolation(uiRoot: string): UiIsolationAnalysis {
  const srcRoot = resolveSrcRoot();
  const files = listTypeScriptFiles(uiRoot);

  let nodeImportCount = 0;
  let serverImportCount = 0;
  let nonAllowListedSrcImportCount = 0;

  const nodeImports: ArchitectureViolation[] = [];
  const serverImports: ArchitectureViolation[] = [];
  const nonAllowListedSrcImports: ArchitectureViolation[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(srcRoot, file);

    const checkSpecifiers = (pattern: RegExp) => {
      for (const match of raw.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier === undefined) continue;
        const offset = match.index ?? 0;
        const line = lineAtOffset(raw, offset);

        if (isForbiddenNodeModule(specifier)) {
          nodeImportCount += 1;
          nodeImports.push({
            file: relFile,
            line,
            message: `Import interdit du module natif Node.js (${specifier}) depuis la couche ui/`,
          });
          continue;
        }

        if (!specifier.startsWith('.')) {
          continue;
        }

        const resolved = resolveRelativeToFile(file, specifier);
        if (resolved === null) {
          continue;
        }

        const layer = layerOfSrcPath(resolved, srcRoot);
        if (layer === null) {
          continue;
        }

        const targetRel = path.relative(srcRoot, resolved);

        if (layer === 'lib' || layer === 'services') {
          serverImportCount += 1;
          serverImports.push({
            file: relFile,
            line,
            message: `Import interdit du module serveur ${layer} (${targetRel}) depuis la couche ui/`,
          });
        }

        if (!ALLOWED_LAYER_NAMES.includes(layer)) {
          nonAllowListedSrcImportCount += 1;
          nonAllowListedSrcImports.push({
            file: relFile,
            line,
            message: `Import interdit de la couche ${layer} (${targetRel}) depuis la couche ui/`,
          });
        }
      }
    };

    checkSpecifiers(IMPORT_SPECIFIER_RE);
    checkSpecifiers(EXPORT_FROM_SPECIFIER_RE);
  }

  return {
    nodeImportCount,
    serverImportCount,
    nonAllowListedSrcImportCount,
    violationsByCheck: {
      nodeImports,
      serverImports,
      nonAllowListedSrcImports,
    },
  };
}

describe('CASE-ARCH-01-4 — isolation navigateur de src/ui/ (SPEC-ARCH-01)', () => {
  it('test_CASE_ARCH_01_4_ui_layer_browser_isolation', () => {
    const uiRoot = resolveUiRoot();
    if (!fs.existsSync(uiRoot)) {
      throw new Error(`Répertoire ui introuvable : ${uiRoot}`);
    }

    const analysis = analyzeUiIsolation(uiRoot);

    // Alors aucun fichier n'importe de module natif Node.js
    expect(
      analysis.nodeImportCount,
      formatViolationsMessage(
        'Imports de modules Node.js natifs depuis ui/',
        analysis.violationsByCheck.nodeImports,
      ),
    ).toBe(0);

    // Et aucun fichier n'importe de module serveur provenant de src/lib/ ou src/services/
    expect(
      analysis.serverImportCount,
      formatViolationsMessage(
        'Imports de modules serveur (lib/services) depuis ui/',
        analysis.violationsByCheck.serverImports,
      ),
    ).toBe(0);

    // Et les seuls modules internes importés proviennent de types/, utils/ ou domain/
    expect(
      analysis.nonAllowListedSrcImportCount,
      formatViolationsMessage(
        'Imports internes non autorisés depuis ui/',
        analysis.violationsByCheck.nonAllowListedSrcImports,
      ),
    ).toBe(0);
  });
});
