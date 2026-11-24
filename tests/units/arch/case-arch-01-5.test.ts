/**
 * CASE-ARCH-01-5 — Conformité unilatérale des imports inter-couches
 * à la matrice signature.md §5 (`AC-ARCH-01-5` / `SPEC-ARCH-01`).
 *
 * Sujet sous test : imports statiques inter-couches sous src/
 * (8 couches : types, utils, domain, lib, services, controllers, ui, index).
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Identifiants des 8 couches (Données CASE / signature.md §5). */
type LayerName = 'types' | 'utils' | 'domain' | 'lib' | 'services' | 'controllers' | 'ui' | 'index';

/**
 * Matrice « Ce qu'elle PEUT importer » — signature.md §5
 * (couches src uniquement ; deps externes / Node hors prédicat inter-couches).
 * Intra-couche toujours autorisée (non « inter-couches »).
 */
const LAYER_ALLOW_LIST: Readonly<Record<LayerName, readonly LayerName[]>> = {
  types: [],
  utils: ['types'],
  domain: ['types', 'utils'],
  lib: ['types', 'utils'],
  services: ['types', 'utils', 'domain', 'lib'],
  controllers: ['types', 'utils', 'services'],
  ui: ['types', 'utils', 'domain'],
  index: ['types', 'utils', 'domain', 'lib', 'services', 'controllers', 'ui', 'index'],
};

/** Résultat d'audit de conformité à la matrice §5. */
interface MatrixComplianceAnalysis {
  /** Imports inter-couches hors allow-list de la couche source. */
  readonly matrixViolationCount: number;
  /** Imports empruntant une direction interdite (même ensemble que violations). */
  readonly forbiddenDirectionCount: number;
  /** Nombre de couches du modèle (réf. Données CASE). */
  readonly analyzedLayerCount: number;
  /** Liste détaillée des violations pour le reporting d'audit. */
  readonly violations: readonly ArchitectureViolation[];
}

const ARCH_LAYER_COUNT = 8;

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

function layerOfSrcPath(filePath: string, srcRoot: string): LayerName | null {
  const relative = path.normalize(path.relative(srcRoot, filePath));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  if (relative === 'index.ts') {
    return 'index';
  }
  const firstSegment = relative.split(path.sep)[0];
  const known: readonly LayerName[] = [
    'types',
    'utils',
    'domain',
    'lib',
    'services',
    'controllers',
    'ui',
  ];
  if (firstSegment !== undefined && (known as readonly string[]).includes(firstSegment)) {
    return firstSegment as LayerName;
  }
  return null;
}

function isAllowedInterLayerImport(sourceLayer: LayerName, targetLayer: LayerName): boolean {
  if (sourceLayer === targetLayer) {
    return true;
  }
  return LAYER_ALLOW_LIST[sourceLayer].includes(targetLayer);
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeMatrixCompliance(srcRoot: string): MatrixComplianceAnalysis {
  const files = listTypeScriptFiles(srcRoot);
  let matrixViolationCount = 0;
  const violations: ArchitectureViolation[] = [];

  for (const file of files) {
    const sourceLayer = layerOfSrcPath(file, srcRoot);
    if (sourceLayer === null) {
      continue;
    }

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

        const targetLayer = layerOfSrcPath(resolved, srcRoot);
        if (targetLayer === null || sourceLayer === targetLayer) {
          continue;
        }

        if (!isAllowedInterLayerImport(sourceLayer, targetLayer)) {
          matrixViolationCount += 1;
          const targetRel = path.relative(srcRoot, resolved);
          violations.push({
            file: relFile,
            line,
            message: `Import interdit par la matrice §3.2 : couche ${sourceLayer} -> couche ${targetLayer} (${targetRel})`,
          });
        }
      }
    };

    checkSpecifiers(IMPORT_SPECIFIER_RE);
    checkSpecifiers(EXPORT_FROM_SPECIFIER_RE);
  }

  return {
    matrixViolationCount,
    forbiddenDirectionCount: matrixViolationCount,
    analyzedLayerCount: ARCH_LAYER_COUNT,
    violations,
  };
}

describe('CASE-ARCH-01-5 — conformité matrice imports inter-couches (SPEC-ARCH-01)', () => {
  it('test_CASE_ARCH_01_5_layer_import_matrix_compliance', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire source introuvable : ${srcRoot}`);
    }

    const analysis = analyzeMatrixCompliance(srcRoot);

    // Alors chaque dépendance respecte la liste autorisée de la couche source
    expect(
      analysis.matrixViolationCount,
      formatViolationsMessage(
        'Conformité matrice imports inter-couches (§3.2)',
        analysis.violations,
      ),
    ).toBe(0);

    // Et aucun import n'emprunte de direction interdite
    expect(
      analysis.forbiddenDirectionCount,
      formatViolationsMessage("Directions d'imports interdites (§3.2)", analysis.violations),
    ).toBe(0);
  });
});
