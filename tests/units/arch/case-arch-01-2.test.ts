/**
 * CASE-ARCH-01-2 — Pureté déclarative de la couche src/types/
 * (`AC-ARCH-01-2` / `SPEC-ARCH-01` / `TYPES-001..012`).
 *
 * Sujet sous test : fichiers TypeScript sous src/types/ (12 modules signés).
 * Analyse syntaxique structurelle déterministe dans le harnais de test
 * (pattern POINT-001 Partie 70 — aucun analyseur signé sous src/).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Couches applicatives interdites en import depuis src/types/ (Gherkin + AC-ARCH-01-2). */
const FORBIDDEN_LAYER_SEGMENTS: readonly string[] = [
  `${path.sep}utils${path.sep}`,
  `${path.sep}domain${path.sep}`,
  `${path.sep}lib${path.sep}`,
  `${path.sep}services${path.sep}`,
  `${path.sep}controllers${path.sep}`,
  `${path.sep}ui${path.sep}`,
] as const;

/** Résultat d'audit de pureté déclarative de src/types/. */
interface TypesPurityAnalysis {
  /** Déclarations hors allow-list (interface / type / const enum / types structuraux). */
  readonly disallowedDeclarationCount: number;
  /** Statements exécutables : corps de fonction, boucles, variables runtime. */
  readonly executableStatementCount: number;
  /** Classes instanciables détectées. */
  readonly instantiableClassCount: number;
  /** Imports vers utils/domain/lib/services/controllers/ui/index.ts. */
  readonly forbiddenLayerImportCount: number;
  /** Imports ni intra-types ni dépendance externe de types pure. */
  readonly unauthorizedImportCount: number;
  /** Liste détaillée des violations pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly disallowedDeclarations: readonly ArchitectureViolation[];
    readonly executableStatements: readonly ArchitectureViolation[];
    readonly instantiableClasses: readonly ArchitectureViolation[];
    readonly forbiddenLayerImports: readonly ArchitectureViolation[];
    readonly unauthorizedImports: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

function resolveTypesRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src/types');
}

function resolveSrcRoot(): string {
  return path.resolve(resolveTypesRoot(), '..');
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

function isUnderDirectory(filePath: string, directory: string): boolean {
  const normalizedFile = path.normalize(filePath);
  const normalizedDir = path.normalize(directory);
  return normalizedFile === normalizedDir || normalizedFile.startsWith(normalizedDir + path.sep);
}

function isForbiddenLayerTarget(resolvedPath: string, srcRoot: string): boolean {
  const relative = path.normalize(path.relative(srcRoot, resolvedPath));
  if (relative === 'index.ts') {
    return true;
  }
  const prefixed = `${path.sep}${relative}${path.sep}`;
  return FORBIDDEN_LAYER_SEGMENTS.some((segment) => prefixed.includes(segment));
}

function isExternalPureTypeDependency(specifier: string): boolean {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return false;
  }
  if (specifier.startsWith('node:')) {
    return false;
  }
  // Dépendance de paquet externe (ex. @types/*, bibliothèque de types pures).
  return true;
}

function countMatches(sourceText: string, pattern: RegExp): number {
  return [...sourceText.matchAll(pattern)].length;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeDisallowedDeclarations(
  relPath: string,
  raw: string,
): { count: number; violations: ArchitectureViolation[] } {
  const violations: ArchitectureViolation[] = [];
  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /^\s*(?:export\s+)?class\s+(\w+)/gmu, label: 'Classe déclarée' },
    { regex: /^\s*(?:export\s+)?function\s+(\w+)/gmu, label: 'Fonction déclarée' },
    { regex: /^\s*(?:export\s+)?enum\s+(\w+)/gmu, label: 'Enum non-const déclarée' },
    { regex: /^\s*export\s+(?:const|let|var)\s+(\w+)\s*=/gmu, label: 'Variable runtime exportée' },
  ];

  for (const { regex, label } of patterns) {
    for (const match of raw.matchAll(regex)) {
      const symbol = match[1] ?? 'unknown';
      const offset = match.index ?? 0;
      violations.push({
        file: relPath,
        line: lineAtOffset(raw, offset),
        symbol,
        message: `${label} dans la couche déclarative types/ : ${symbol}`,
      });
    }
  }

  return { count: violations.length, violations };
}

function analyzeExecutableStatements(
  relPath: string,
  raw: string,
): {
  statementsCount: number;
  statementViolations: ArchitectureViolation[];
  classesCount: number;
  classViolations: ArchitectureViolation[];
} {
  const statementViolations: ArchitectureViolation[] = [];
  const classViolations: ArchitectureViolation[] = [];

  for (const match of raw.matchAll(/^\s*(?:export\s+)?class\s+(\w+)/gmu)) {
    const symbol = match[1] ?? 'unknown';
    const offset = match.index ?? 0;
    const item = {
      file: relPath,
      line: lineAtOffset(raw, offset),
      symbol,
      message: `Classe instanciable interdite dans types/ : ${symbol}`,
    };
    classViolations.push(item);
    statementViolations.push(item);
  }

  for (const match of raw.matchAll(/^\s*(?:export\s+)?function\s+(\w+)/gmu)) {
    const symbol = match[1] ?? 'unknown';
    const offset = match.index ?? 0;
    statementViolations.push({
      file: relPath,
      line: lineAtOffset(raw, offset),
      symbol,
      message: `Corps de fonction exécutable interdit dans types/ : ${symbol}`,
    });
  }

  for (const match of raw.matchAll(/=>\s*\{/gu)) {
    const offset = match.index ?? 0;
    statementViolations.push({
      file: relPath,
      line: lineAtOffset(raw, offset),
      message: `Fonction flèche exécutable avec bloc interdit dans types/`,
    });
  }

  for (const match of raw.matchAll(/\b(?:for|while)\s*\(/gu)) {
    const offset = match.index ?? 0;
    statementViolations.push({
      file: relPath,
      line: lineAtOffset(raw, offset),
      message: `Boucle d'exécution interdite dans types/`,
    });
  }

  for (const match of raw.matchAll(/\bdo\s*\{/gu)) {
    const offset = match.index ?? 0;
    statementViolations.push({
      file: relPath,
      line: lineAtOffset(raw, offset),
      message: `Boucle do-while interdite dans types/`,
    });
  }

  for (const match of raw.matchAll(/^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/gmu)) {
    const symbol = match[1] ?? 'unknown';
    const offset = match.index ?? 0;
    statementViolations.push({
      file: relPath,
      line: lineAtOffset(raw, offset),
      symbol,
      message: `Variable runtime exécutable interdite dans types/ : ${symbol}`,
    });
  }

  return {
    statementsCount: statementViolations.length,
    statementViolations,
    classesCount: classViolations.length,
    classViolations,
  };
}

function analyzeImportViolations(
  relPath: string,
  raw: string,
  fromFile: string,
  typesRoot: string,
  srcRoot: string,
): {
  forbiddenLayerCount: number;
  forbiddenViolations: ArchitectureViolation[];
  unauthorizedCount: number;
  unauthorizedViolations: ArchitectureViolation[];
} {
  const forbiddenViolations: ArchitectureViolation[] = [];
  const unauthorizedViolations: ArchitectureViolation[] = [];

  const checkSpecifiers = (pattern: RegExp) => {
    for (const match of raw.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier === undefined) continue;
      const offset = match.index ?? 0;
      const line = lineAtOffset(raw, offset);

      if (specifier.startsWith('.')) {
        const resolved = resolveRelativeToFile(fromFile, specifier);
        if (resolved === null) {
          unauthorizedViolations.push({
            file: relPath,
            line,
            message: `Import relatif non résoluble dans types/ : ${specifier}`,
          });
          continue;
        }
        if (isUnderDirectory(resolved, typesRoot)) {
          continue;
        }
        if (isForbiddenLayerTarget(resolved, srcRoot)) {
          forbiddenViolations.push({
            file: relPath,
            line,
            message: `Import interdit d'une couche applicative (${path.relative(srcRoot, resolved)}) depuis types/`,
          });
          continue;
        }
        unauthorizedViolations.push({
          file: relPath,
          line,
          message: `Import non autorisé (${path.relative(srcRoot, resolved)}) depuis types/`,
        });
        continue;
      }

      if (isExternalPureTypeDependency(specifier)) {
        continue;
      }

      unauthorizedViolations.push({
        file: relPath,
        line,
        message: `Import externe non autorisé (${specifier}) depuis types/`,
      });
    }
  };

  checkSpecifiers(IMPORT_SPECIFIER_RE);
  checkSpecifiers(EXPORT_FROM_SPECIFIER_RE);

  return {
    forbiddenLayerCount: forbiddenViolations.length,
    forbiddenViolations,
    unauthorizedCount: unauthorizedViolations.length,
    unauthorizedViolations,
  };
}

function analyzeTypesLayerPurity(typesRoot: string): TypesPurityAnalysis {
  const srcRoot = resolveSrcRoot();
  const files = listTypeScriptFiles(typesRoot);

  let disallowedDeclarationCount = 0;
  let executableStatementCount = 0;
  let instantiableClassCount = 0;
  let forbiddenLayerImportCount = 0;
  let unauthorizedImportCount = 0;

  const disallowedDeclarations: ArchitectureViolation[] = [];
  const executableStatements: ArchitectureViolation[] = [];
  const instantiableClasses: ArchitectureViolation[] = [];
  const forbiddenLayerImports: ArchitectureViolation[] = [];
  const unauthorizedImports: ArchitectureViolation[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(srcRoot, file);

    const declResult = analyzeDisallowedDeclarations(relPath, raw);
    disallowedDeclarationCount += declResult.count;
    disallowedDeclarations.push(...declResult.violations);

    const execResult = analyzeExecutableStatements(relPath, raw);
    executableStatementCount += execResult.statementsCount;
    executableStatements.push(...execResult.statementViolations);
    instantiableClassCount += execResult.classesCount;
    instantiableClasses.push(...execResult.classViolations);

    const importResult = analyzeImportViolations(relPath, raw, file, typesRoot, srcRoot);
    forbiddenLayerImportCount += importResult.forbiddenLayerCount;
    forbiddenLayerImports.push(...importResult.forbiddenViolations);
    unauthorizedImportCount += importResult.unauthorizedCount;
    unauthorizedImports.push(...importResult.unauthorizedViolations);
  }

  return {
    disallowedDeclarationCount,
    executableStatementCount,
    instantiableClassCount,
    forbiddenLayerImportCount,
    unauthorizedImportCount,
    violationsByCheck: {
      disallowedDeclarations,
      executableStatements,
      instantiableClasses,
      forbiddenLayerImports,
      unauthorizedImports,
    },
  };
}

describe('CASE-ARCH-01-2 — pureté déclarative de src/types/ (SPEC-ARCH-01)', () => {
  it('test_CASE_ARCH_01_2_types_layer_declarative_purity', () => {
    const typesRoot = resolveTypesRoot();
    if (!fs.existsSync(typesRoot)) {
      throw new Error(`Répertoire types introuvable : ${typesRoot}`);
    }

    const analysis = analyzeTypesLayerPurity(typesRoot);

    // Alors ils ne contiennent que des déclarations "interface", "type", "const enum" ou types structuraux purs
    expect(
      analysis.disallowedDeclarationCount,
      formatViolationsMessage(
        'Déclarations non autorisées dans types/',
        analysis.violationsByCheck.disallowedDeclarations,
      ),
    ).toBe(0);

    // Et ils ne contiennent aucun corps de fonction, classe instanciable, boucle ou variable runtime
    expect(
      {
        executableStatements: analysis.executableStatementCount,
        instantiableClasses: analysis.instantiableClassCount,
      },
      formatViolationsMessage('Statements exécutables / classes dans types/', [
        ...analysis.violationsByCheck.executableStatements,
        ...analysis.violationsByCheck.instantiableClasses,
      ]),
    ).toEqual({
      executableStatements: 0,
      instantiableClasses: 0,
    });

    // Et ils n'importent aucun fichier provenant de couches applicatives interdites
    expect(
      analysis.forbiddenLayerImportCount,
      formatViolationsMessage(
        'Imports de couches interdites depuis types/',
        analysis.violationsByCheck.forbiddenLayerImports,
      ),
    ).toBe(0);

    // Et les imports autorisés sont intra-src/types/ ou dépendances externes de types pures
    expect(
      analysis.unauthorizedImportCount,
      formatViolationsMessage(
        'Imports non autorisés depuis types/',
        analysis.violationsByCheck.unauthorizedImports,
      ),
    ).toBe(0);
  });
});
