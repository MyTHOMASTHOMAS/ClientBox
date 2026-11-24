/**
 * CASE-ARCH-03-5 — Monopole process.env / process.cwd() dans LIB-005
 * (`AC-ARCH-03-5` / `SPEC-ARCH-03` / `env-resolver.ts`).
 *
 * Sujet sous test : fichiers TypeScript sous src/.
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Modules autorisés (Données CASE / ADR-022 / LIB-024 / LIB-026). */
const ALLOWED_ENV_MODULES: readonly string[] = [
  path.normalize('lib/process/env/env.engine.ts'),
  path.normalize('lib/process/env/env.layout.ts'),
  path.normalize('lib/process/env-resolver.ts'),
];

/** Résultat d'audit monopole process.env / process.cwd(). */
interface EnvResolverMonopolyAnalysis {
  /**
   * Accès `process.env` ou `process.cwd()` hors LIB-005
   * (clause Alors — toutes couches sauf env-resolver).
   */
  readonly forbiddenProcessAccessCount: number;
  /**
   * Accès directs dans `src/index.ts`
   * (clause Et — bootstrap sans accès direct).
   */
  readonly indexDirectAccessCount: number;
}

const PROCESS_ENV_RE = /\bprocess\.env\b/gu;
const PROCESS_CWD_RE = /\bprocess\.cwd\s*\(/gu;

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

function countMatches(sourceText: string, pattern: RegExp): number {
  return [...sourceText.matchAll(pattern)].length;
}

function countProcessAccesses(sourceText: string): number {
  const stripped = stripComments(sourceText);
  return countMatches(stripped, PROCESS_ENV_RE) + countMatches(stripped, PROCESS_CWD_RE);
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface EnvResolverMonopolyAnalysis {
  readonly forbiddenProcessAccessCount: number;
  readonly indexDirectAccessCount: number;
  readonly forbiddenViolations: readonly ArchitectureViolation[];
  readonly indexViolations: readonly ArchitectureViolation[];
}

function collectProcessAccesses(displayPath: string, sourceText: string): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const lines = sourceText.split(/\r?\n/u);

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx] ?? '';
    const stripped = stripComments(line);
    if (PROCESS_ENV_RE.test(stripped)) {
      violations.push({
        file: displayPath,
        line: idx + 1,
        symbol: 'process.env',
        message:
          'Accès direct à "process.env" interdit (monopole exclusif à src/lib/process/env-resolver.ts)',
      });
    }
    if (PROCESS_CWD_RE.test(stripped)) {
      violations.push({
        file: displayPath,
        line: idx + 1,
        symbol: 'process.cwd()',
        message:
          'Accès direct à "process.cwd()" interdit (monopole exclusif à src/lib/process/env-resolver.ts)',
      });
    }
  }

  return violations;
}

function isAllowedEnvResolver(filePath: string, srcRoot: string): boolean {
  const relative = path.normalize(path.relative(srcRoot, filePath));
  return ALLOWED_ENV_MODULES.includes(relative);
}

function analyzeEnvResolverMonopoly(srcRoot: string): EnvResolverMonopolyAnalysis {
  const forbiddenViolations: ArchitectureViolation[] = [];
  const indexViolations: ArchitectureViolation[] = [];

  for (const file of listTypeScriptFiles(srcRoot)) {
    if (isAllowedEnvResolver(file, srcRoot)) {
      continue;
    }
    const rel = path.relative(srcRoot, file).split(path.sep).join('/');
    const raw = fs.readFileSync(file, 'utf8');
    const v = collectProcessAccesses(`src/${rel}`, raw);
    forbiddenViolations.push(...v);
  }

  const indexPath = path.join(srcRoot, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const v = collectProcessAccesses('src/index.ts', fs.readFileSync(indexPath, 'utf8'));
    indexViolations.push(...v);
  }

  return {
    forbiddenProcessAccessCount: forbiddenViolations.length,
    indexDirectAccessCount: indexViolations.length,
    forbiddenViolations,
    indexViolations,
  };
}

describe('CASE-ARCH-03-5 — monopole process.env/cwd LIB-005 (SPEC-ARCH-03)', () => {
  it('test_CASE_ARCH_03_5_env_resolver_process_monopoly', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeEnvResolverMonopoly(srcRoot);
    const forbiddenMsg = formatViolationsMessage(
      'Accès directs à process.env / process.cwd() hors de env-resolver.ts',
      analysis.forbiddenViolations,
    );
    const indexMsg = formatViolationsMessage(
      'Accès directs à process.env / process.cwd() dans src/index.ts',
      analysis.indexViolations,
    );

    // Alors ces accès n'apparaissent que dans src/lib/process/env-resolver.ts
    expect(analysis.forbiddenProcessAccessCount, forbiddenMsg).toBe(0);

    // Et src/index.ts reçoit ces valeurs par injection sans accès direct
    expect(analysis.indexDirectAccessCount, indexMsg).toBe(0);
  });
});
