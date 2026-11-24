/**
 * CASE-ARCH-04-1 — Contrôleurs CTL-001..003 découplés via HttpRouter (TYPES-011)
 * sans référence à MiniRouter (LIB-007) (`AC-ARCH-04-1` / `SPEC-ARCH-04`).
 *
 * Modules cibles (signature-controllers.md + Ground Truth) :
 * - `controllers/http/resource.controller.ts` (CTL-001)
 * - `controllers/http/execution.controller.ts` (CTL-002)
 * - `controllers/sse/stream.controller.ts` (CTL-003)
 * La fiche CASE Données cite des noms erronés (`agent.controller.ts`,
 * `scenario.controller.ts`) ; la signature fait foi (doctrine POINT-026).
 *
 * Nom de test : contrat fiche CASE (= prompt §1, alignés).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Contrôleurs contractuels CTL-001..003 (signature-controllers.md). */
const CONTROLLER_RELATIVE_PATHS: readonly string[] = [
  'http/resource.controller.ts',
  'http/execution/execution.controller.ts',
  'sse/stream.controller.ts',
];

/** Résultat d'audit découplage HttpRouter / MiniRouter. */
interface ControllersHttpRouterDecouplingAnalysis {
  /**
   * Contrôleurs absents ou sans paramètre / import typé `HttpRouter`
   * (clause Alors).
   */
  readonly httpRouterTypingViolationCount: number;
  /** Références à `MiniRouter` dans les contrôleurs (clause Et). */
  readonly miniRouterReferenceCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly httpRouterTyping: readonly ArchitectureViolation[];
    readonly miniRouterReferences: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const HTTP_ROUTER_TYPE_RE = /\bHttpRouter\b/gu;
const MINI_ROUTER_RE = /\bMiniRouter\b/gu;

function resolveControllersRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src/controllers');
}

function stripComments(sourceText: string): string {
  const withoutBlock = sourceText.replace(/\/\*[\s\S]*?\*\//gu, '');
  return withoutBlock.replace(/^\s*\/\/.*$/gmu, '');
}

function countMatches(sourceText: string, pattern: RegExp): number {
  return [...sourceText.matchAll(pattern)].length;
}

function extractImportSpecifiers(sourceText: string): readonly string[] {
  const found: string[] = [];
  for (const match of sourceText.matchAll(IMPORT_SPECIFIER_RE)) {
    const specifier = match[1];
    if (specifier !== undefined) {
      found.push(specifier);
    }
  }
  return found;
}

/**
 * HttpRouter « reçu » : import du contrat + occurrence du type
 * (paramètre `router: HttpRouter` ou options contenant HttpRouter).
 */
function hasHttpRouterTyping(stripped: string): boolean {
  const importsHttpRouterContract = extractImportSpecifiers(stripped).some(
    (specifier) =>
      specifier.includes('http-router.contract') ||
      specifier.endsWith('/http-router.contract.js') ||
      specifier.endsWith('/http-router.contract.ts'),
  );
  const mentionsHttpRouter = countMatches(stripped, HTTP_ROUTER_TYPE_RE) > 0;
  return importsHttpRouterContract && mentionsHttpRouter;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeControllersHttpRouterDecoupling(
  controllersRoot: string,
): ControllersHttpRouterDecouplingAnalysis {
  let httpRouterTypingViolationCount = 0;
  let miniRouterReferenceCount = 0;

  const httpRouterTyping: ArchitectureViolation[] = [];
  const miniRouterReferences: ArchitectureViolation[] = [];

  for (const relative of CONTROLLER_RELATIVE_PATHS) {
    const absolute = path.join(controllersRoot, relative);
    const relDisplay = `src/controllers/${relative}`;

    if (!fs.existsSync(absolute)) {
      httpRouterTypingViolationCount += 1;
      httpRouterTyping.push({
        file: relDisplay,
        message: `Fichier contrôleur contractuel introuvable : ${relDisplay}`,
      });
      continue;
    }

    const raw = fs.readFileSync(absolute, 'utf8');
    const stripped = stripComments(raw);

    if (!hasHttpRouterTyping(stripped)) {
      httpRouterTypingViolationCount += 1;
      httpRouterTyping.push({
        file: relDisplay,
        symbol: 'HttpRouter',
        message: `Le contrôleur ne reçoit ni n'importe l'interface abstraite HttpRouter`,
      });
    }

    for (const match of stripped.matchAll(MINI_ROUTER_RE)) {
      const offset = match.index ?? 0;
      const line = lineAtOffset(raw, offset);
      miniRouterReferenceCount += 1;
      miniRouterReferences.push({
        file: relDisplay,
        line,
        symbol: 'MiniRouter',
        message: `Couplage interdit avec la classe concrète MiniRouter dans le contrôleur`,
      });
    }
  }

  return {
    httpRouterTypingViolationCount,
    miniRouterReferenceCount,
    violationsByCheck: {
      httpRouterTyping,
      miniRouterReferences,
    },
  };
}

describe('CASE-ARCH-04-1 — découplage HttpRouter des contrôleurs (SPEC-ARCH-04)', () => {
  it('test_CASE_ARCH_04_1_controllers_http_router_interface_decoupling', () => {
    const controllersRoot = resolveControllersRoot();

    const analysis = analyzeControllersHttpRouterDecoupling(controllersRoot);

    // Alors chaque contrôleur reçoit une instance satisfaisant l'interface HttpRouter
    expect(
      analysis.httpRouterTypingViolationCount,
      formatViolationsMessage(
        'Contrat HttpRouter dans les contrôleurs',
        analysis.violationsByCheck.httpRouterTyping,
      ),
    ).toBe(0);

    // Et aucune référence directe à la classe concrète MiniRouter n'est présente
    expect(
      analysis.miniRouterReferenceCount,
      formatViolationsMessage(
        'Références interdites à MiniRouter dans les contrôleurs',
        analysis.violationsByCheck.miniRouterReferences,
      ),
    ).toBe(0);
  });
});
