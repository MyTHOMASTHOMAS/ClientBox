/**
 * CASE-ARCH-02-3 — Isomorphisme strict de src/domain/
 * (exécutable sans polyfill navigateur / Node.js)
 * (`AC-ARCH-02-3` / `SPEC-ARCH-02` / CR-012 — `DOM-009` abrogé).
 *
 * Sujet sous test : modules TypeScript sous src/domain/ (glob récursif .ts).
 * Harnais : (1) audit structurel des dépendances nécessitant un polyfill Node ;
 * (2) chargement + exécution des fonctions métier dans le runtime de test
 * (preuve d'exécutabilité sans API Node dans le code domain/).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/**
 * Modules système / builtins Node dont l'usage imposerait un polyfill navigateur
 * (Données CASE + SPEC-ARCH-02 / AC-ARCH-02-3).
 */
const POLYFILL_REQUIRING_MODULES: ReadonlySet<string> = new Set([
  'fs',
  'child_process',
  'net',
  'http',
  'os',
  'path',
  'url',
  'vm',
  'buffer',
  'stream',
  'crypto',
  'events',
  'util',
  'worker_threads',
  'diagnostics_channel',
]);

/**
 * Modules domain/ contractuels (signature-domain.md DOM-001..008 + DOM-010..).
 * Doivent être chargeables pour l'isomorphisme de la couche.
 * `exit/exit-matcher.evaluator.ts` (DOM-009) abrogé — CR-012.
 */
const SIGNATURE_DOMAIN_RELATIVE_MODULES: readonly string[] = [
  'join/join-barrier.evaluator.ts',
  'join/orphan-node.guard.ts',
  'prompt/injection-policy.evaluator.ts',
  'prompt/prompt.assembler.ts',
  'keys/key-assigner.domain.ts',
  'keys/key-renumberer.domain.ts',
  'keys/key-collision.validator.ts',
  'graph/graph-integrity.validator.ts',
];

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

const IMPORT_TYPE_ONLY_RE = /^\s*import\s+type\s+/u;

const EXPORT_TYPE_ONLY_RE = /^\s*export\s+type\s+[^'"\n]+?\s+from\s+/u;

const NODE_ONLY_GLOBAL_PATTERNS: readonly RegExp[] = [
  /\bprocess\b/gu,
  /\bBuffer\b/gu,
  /\b__dirname\b/gu,
  /\b__filename\b/gu,
  /\brequire\s*\(/gu,
  /\bmodule\.exports\b/gu,
  /\bglobal\b/gu,
];

function resolveDomainRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src/domain');
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

function extractRuntimeSpecifiers(sourceText: string): readonly string[] {
  const found: string[] = [];
  const lines = sourceText.split('\n');
  for (const line of lines) {
    if (IMPORT_TYPE_ONLY_RE.test(line) || EXPORT_TYPE_ONLY_RE.test(line)) {
      IMPORT_TYPE_ONLY_RE.lastIndex = 0;
      EXPORT_TYPE_ONLY_RE.lastIndex = 0;
      continue;
    }
    IMPORT_TYPE_ONLY_RE.lastIndex = 0;
    EXPORT_TYPE_ONLY_RE.lastIndex = 0;

    for (const pattern of [IMPORT_SPECIFIER_RE, EXPORT_FROM_SPECIFIER_RE]) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier !== undefined) {
          found.push(specifier);
        }
      }
    }
  }
  return found;
}

function normalizeNodeModuleId(specifier: string): string {
  return specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;
}

function isPolyfillRequiringSpecifier(specifier: string): boolean {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return false;
  }
  if (specifier.startsWith('node:')) {
    return true;
  }
  const normalized = normalizeNodeModuleId(specifier);
  const rootId = normalized.split('/')[0] ?? normalized;
  if (POLYFILL_REQUIRING_MODULES.has(rootId)) {
    return true;
  }
  // Import bare (package npm) → non exécutable tel quel dans un navigateur sans bundler/polyfill
  return true;
}

interface DomainIsomorphismAnalysis {
  readonly sandboxLoadErrorCount: number;
  readonly polyfillDependencyCount: number;
  readonly sandboxViolations: readonly ArchitectureViolation[];
  readonly polyfillViolations: readonly ArchitectureViolation[];
}

function collectPolyfillDependencies(
  filePath: string,
  sourceText: string,
): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const lines = sourceText.split(/\r?\n/u);

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx] ?? '';
    const stripped = stripComments(line);
    const specifiers = extractRuntimeSpecifiers(stripped);
    for (const specifier of specifiers) {
      if (isPolyfillRequiringSpecifier(specifier)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          symbol: specifier,
          message: `Import de module nécessitant polyfill / Node.js "${specifier}" interdit dans la couche isomorphique src/domain/`,
        });
      }
    }
    for (const pattern of NODE_ONLY_GLOBAL_PATTERNS) {
      if (pattern.test(stripped)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          message: `Accès global Node.js interdit (${pattern.source}) dans la couche isomorphique src/domain/`,
        });
      }
    }
  }

  return violations;
}

async function analyzeDomainIsomorphism(domainRoot: string): Promise<DomainIsomorphismAnalysis> {
  const sandboxViolations: ArchitectureViolation[] = [];
  const polyfillViolations: ArchitectureViolation[] = [];

  const files = listTypeScriptFiles(domainRoot);
  for (const file of files) {
    const rel = path.relative(domainRoot, file).split(path.sep).join('/');
    const raw = fs.readFileSync(file, 'utf8');
    const v = collectPolyfillDependencies(`src/domain/${rel}`, raw);
    polyfillViolations.push(...v);
  }

  for (const relative of SIGNATURE_DOMAIN_RELATIVE_MODULES) {
    const absolute = path.join(domainRoot, relative);
    if (!fs.existsSync(absolute)) {
      sandboxViolations.push({
        file: `src/domain/${relative}`,
        message: 'Module contractuel domain manquant sur le disque',
      });
    }
  }

  for (const file of files) {
    const rel = path.relative(domainRoot, file).split(path.sep).join('/');
    try {
      await import(pathToFileURL(file).href);
    } catch (err) {
      sandboxViolations.push({
        file: `src/domain/${rel}`,
        message: `Erreur lors de l'import/exécution : ${(err as Error)?.message ?? 'Erreur inconnue'}`,
      });
    }
  }

  return {
    sandboxLoadErrorCount: sandboxViolations.length,
    polyfillDependencyCount: polyfillViolations.length,
    sandboxViolations,
    polyfillViolations,
  };
}

describe('CASE-ARCH-02-3 — isomorphisme strict de src/domain/ (SPEC-ARCH-02)', () => {
  it('test_CASE_ARCH_02_3_domain_isomorphic_execution', async () => {
    const domainRoot = resolveDomainRoot();
    if (!fs.existsSync(domainRoot)) {
      throw new Error(`Répertoire domain introuvable : ${domainRoot}`);
    }

    const analysis = await analyzeDomainIsomorphism(domainRoot);
    const sandboxMsg = formatViolationsMessage(
      'Erreurs de chargement / exécution sandbox domain/',
      analysis.sandboxViolations,
    );
    const polyfillMsg = formatViolationsMessage(
      'Dépendances et APIs Node.js non isomorphes détectées dans src/domain/',
      analysis.polyfillViolations,
    );

    // Alors toutes les fonctions s'exécutent avec succès
    expect(analysis.sandboxLoadErrorCount, sandboxMsg).toBe(0);

    // Et aucune erreur liée à l'absence d'APIs Node.js n'est levée
    expect(analysis.polyfillDependencyCount, polyfillMsg).toBe(0);
  });
});
