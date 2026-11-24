/**
 * CASE-ARCH-03-2 — Cécité métier de la couche src/lib/
 * (aucun import depuis src/domain/)
 * (`AC-ARCH-03-2` / `SPEC-ARCH-03` / `LIB-001..011`).
 *
 * Sujet sous test : fichiers TypeScript sous src/lib/.
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

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/**
 * Identifiants métier domain/ (join / prompt / graphe) —
 * clause Et Gherkin : pas de manipulation de ces notions dans lib/.
 * (Hors types/ purs consommés comme contrats neutres.)
 */
const DOMAIN_BUSINESS_MARKERS: readonly RegExp[] = [
  /\bevaluateJoin\b/gu,
  /\bisOrphanBlock\b/gu,
  /\bJoinDecision\b/gu,
  /\bassemblePrompt\b/gu,
  /\bshouldInjectSystemPrompt\b/gu,
  /\bupdatePolicyState\b/gu,
  /\bPolicyInjectionState\b/gu,
  /\bvalidateGraph\b/gu,
  /\bassignDefaultKey\b/gu,
  /\brenumberDefaultKeys\b/gu,
  /\bhasKeyCollision\b/gu,
  /\bisValidConnectionKey\b/gu,
  /\bScenarioNode\b/gu,
];

/** Résultat d'audit de cécité métier de src/lib/. */
interface LibDomainBlindnessAnalysis {
  /** Imports relatifs résolus vers src/domain/. */
  readonly domainImportCount: number;
  /** Références aux algorithmes / notions métier domain. */
  readonly businessConceptReferenceCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly domainImports: readonly ArchitectureViolation[];
    readonly businessConceptReferences: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

function resolveLibRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src/lib');
}

function resolveSrcRoot(): string {
  return path.resolve(resolveLibRoot(), '..');
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

function resolveRelativeToFile(fromFile: string, specifier: string): string {
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

function countBusinessConceptReferences(sourceText: string): number {
  let count = 0;
  for (const pattern of DOMAIN_BUSINESS_MARKERS) {
    count += [...sourceText.matchAll(pattern)].length;
  }
  return count;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeLibDomainBlindness(libRoot: string): LibDomainBlindnessAnalysis {
  const srcRoot = resolveSrcRoot();
  const files = listTypeScriptFiles(libRoot);

  let domainImportCount = 0;
  let businessConceptReferenceCount = 0;

  const domainImports: ArchitectureViolation[] = [];
  const businessConceptReferences: ArchitectureViolation[] = [];

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
        if (layerOfSrcPath(resolved, srcRoot) === 'domain') {
          domainImportCount += 1;
          const targetRel = path.relative(srcRoot, resolved);
          domainImports.push({
            file: relFile,
            line,
            message: `Import interdit du module domain (${targetRel}) depuis la couche lib/`,
          });
        }
      }
    };

    checkSpecifiers(IMPORT_SPECIFIER_RE);
    checkSpecifiers(EXPORT_FROM_SPECIFIER_RE);

    const stripped = stripComments(raw);
    for (const pattern of DOMAIN_BUSINESS_MARKERS) {
      for (const match of stripped.matchAll(pattern)) {
        const symbol = match[0] ?? 'unknown';
        const offset = match.index ?? 0;
        const line = lineAtOffset(raw, offset);
        businessConceptReferenceCount += 1;
        businessConceptReferences.push({
          file: relFile,
          line,
          symbol,
          message: `Référence à une notion/algorithme métier (${symbol}) interdite dans la couche lib/`,
        });
      }
    }
  }

  return {
    domainImportCount,
    businessConceptReferenceCount,
    violationsByCheck: {
      domainImports,
      businessConceptReferences,
    },
  };
}

describe('CASE-ARCH-03-2 — cécité métier de src/lib/ (SPEC-ARCH-03)', () => {
  it('test_CASE_ARCH_03_2_lib_layer_domain_blindness', () => {
    const libRoot = resolveLibRoot();
    if (!fs.existsSync(libRoot)) {
      throw new Error(`Répertoire lib introuvable : ${libRoot}`);
    }

    const analysis = analyzeLibDomainBlindness(libRoot);

    // Alors aucun fichier de src/lib/ n'importe de chemin situé dans src/domain/
    expect(
      analysis.domainImportCount,
      formatViolationsMessage(
        'Imports de src/domain/ depuis lib/',
        analysis.violationsByCheck.domainImports,
      ),
    ).toBe(0);

    // Et ils ne manipulent ni blocs de scénario, ni règles de join, ni algorithmes de prompt
    expect(
      analysis.businessConceptReferenceCount,
      formatViolationsMessage(
        'Références métier domain dans lib/',
        analysis.violationsByCheck.businessConceptReferences,
      ),
    ).toBe(0);
  });
});
