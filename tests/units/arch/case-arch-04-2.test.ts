/**
 * CASE-ARCH-04-2 — Composition Root unique `src/index.ts` (ROOT-001)
 * et orchestration d'arrêt gracieux SIGINT/SIGTERM (`AC-ARCH-04-2` / `SPEC-ARCH-04`).
 *
 * Sujet sous test : `src/index.ts` + scan d'instanciations hors Composition Root.
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

/** Résultat d'audit Composition Root + signaux OS. */
interface IndexCompositionRootAnalysis {
  /**
   * Manques de câblage Composition Root (workspacePath / services /
   * contrôleurs) ou instanciations hors `index.ts` (clause Alors).
   */
  readonly compositionRootWiringViolationCount: number;
  /**
   * Manques d'orchestration SIGINT/SIGTERM + fermeture HTTP + stop runners
   * (clause Et).
   */
  readonly gracefulShutdownOrchestrationViolationCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly compositionRootWiring: readonly ArchitectureViolation[];
    readonly gracefulShutdown: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const RESOLVE_WORKSPACE_PATH_RE = /\b(?:resolveWorkspacePath|workspacePath|ConfigService)\b/gu;
const REGISTER_CONTROLLER_ROUTES_RE = /\bregister(?:Resource|Execution|Stream)Routes?\b/gu;
const PROCESS_ON_SIGINT_RE = /\bprocess\.on\s*\(\s*['"]SIGINT['"]/gu;
const PROCESS_ON_SIGTERM_RE = /\bprocess\.on\s*\(\s*['"]SIGTERM['"]/gu;
const HTTP_SERVER_CLOSE_RE = /\b(?:\.close\s*\(|createLocalHttpServer\b)/gu;
const RUNNER_STOP_RE = /\.stop\s*\(/gu;

/** Instanciations réservées à ROOT-001 (hors runners éphémères CTL-002). */
const ROOT_ONLY_INSTANTIATION_RE =
  /\b(?:new\s+MiniRouter\s*\(|createLocalHttpServer\s*\(|new\s+(?:ResourceStoreService|AgentService|AdapterRegistryService)\s*\()/gu;

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
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

function importsServicesLayer(stripped: string): boolean {
  return extractImportSpecifiers(stripped).some(
    (specifier) =>
      specifier.includes('/services/') ||
      specifier.includes('/services') ||
      /(?:^|\/)services(?:\/|$)/u.test(specifier),
  );
}

function importsControllersLayer(stripped: string): boolean {
  return extractImportSpecifiers(stripped).some(
    (specifier) =>
      specifier.includes('/controllers/') ||
      specifier.includes('/controllers') ||
      /(?:^|\/)controllers(?:\/|$)/u.test(specifier),
  );
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function countForeignRootInstantiations(
  srcRoot: string,
  indexAbsolute: string,
): { count: number; violations: ArchitectureViolation[] } {
  let count = 0;
  const violations: ArchitectureViolation[] = [];

  for (const file of listTypeScriptFiles(srcRoot)) {
    if (path.normalize(file) === path.normalize(indexAbsolute)) {
      continue;
    }
    const raw = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(raw);
    const relFile = path.relative(srcRoot, file);

    for (const match of stripped.matchAll(ROOT_ONLY_INSTANTIATION_RE)) {
      count += 1;
      const offset = match.index ?? 0;
      const line = lineAtOffset(raw, offset);
      violations.push({
        file: relFile,
        line,
        symbol: match[0],
        message: `Instanciation concrète réservée à la Composition Root index.ts : ${match[0]}`,
      });
    }
  }
  return { count, violations };
}

function analyzeIndexCompositionRoot(srcRoot: string): IndexCompositionRootAnalysis {
  const indexAbsolute = path.join(srcRoot, 'index.ts');

  if (!fs.existsSync(indexAbsolute)) {
    const missingRootViolation: ArchitectureViolation = {
      file: 'src/index.ts',
      message: 'Fichier Composition Root racine index.ts introuvable',
    };
    return {
      compositionRootWiringViolationCount: 3,
      gracefulShutdownOrchestrationViolationCount: 4,
      violationsByCheck: {
        compositionRootWiring: [missingRootViolation],
        gracefulShutdown: [missingRootViolation],
      },
    };
  }

  const raw = fs.readFileSync(indexAbsolute, 'utf8');
  const stripped = stripComments(raw);

  let compositionRootWiringViolationCount = 0;
  const compositionRootWiring: ArchitectureViolation[] = [];

  if (countMatches(stripped, RESOLVE_WORKSPACE_PATH_RE) === 0) {
    compositionRootWiringViolationCount += 1;
    compositionRootWiring.push({
      file: 'src/index.ts',
      symbol: 'resolveWorkspacePath',
      message: 'Résolution de workspacePath manquante dans index.ts',
    });
  }
  if (!importsServicesLayer(stripped)) {
    compositionRootWiringViolationCount += 1;
    compositionRootWiring.push({
      file: 'src/index.ts',
      message: 'Import de la couche services/ manquant dans index.ts',
    });
  }
  if (
    countMatches(stripped, REGISTER_CONTROLLER_ROUTES_RE) === 0 &&
    !importsControllersLayer(stripped)
  ) {
    compositionRootWiringViolationCount += 1;
    compositionRootWiring.push({
      file: 'src/index.ts',
      message: 'Enregistrement des routes de contrôleurs manquant dans index.ts',
    });
  }

  const foreign = countForeignRootInstantiations(srcRoot, indexAbsolute);
  compositionRootWiringViolationCount += foreign.count;
  compositionRootWiring.push(...foreign.violations);

  let gracefulShutdownOrchestrationViolationCount = 0;
  const gracefulShutdown: ArchitectureViolation[] = [];

  if (countMatches(stripped, PROCESS_ON_SIGINT_RE) === 0) {
    gracefulShutdownOrchestrationViolationCount += 1;
    gracefulShutdown.push({
      file: 'src/index.ts',
      symbol: 'SIGINT',
      message: 'Écouteur de signal SIGINT manquant dans index.ts',
    });
  }
  if (countMatches(stripped, PROCESS_ON_SIGTERM_RE) === 0) {
    gracefulShutdownOrchestrationViolationCount += 1;
    gracefulShutdown.push({
      file: 'src/index.ts',
      symbol: 'SIGTERM',
      message: 'Écouteur de signal SIGTERM manquant dans index.ts',
    });
  }
  if (countMatches(stripped, HTTP_SERVER_CLOSE_RE) === 0) {
    gracefulShutdownOrchestrationViolationCount += 1;
    gracefulShutdown.push({
      file: 'src/index.ts',
      message: "Fermeture du serveur HTTP lors de l'arrêt gracieux manquante dans index.ts",
    });
  }
  if (countMatches(stripped, RUNNER_STOP_RE) === 0) {
    gracefulShutdownOrchestrationViolationCount += 1;
    gracefulShutdown.push({
      file: 'src/index.ts',
      message: 'Arrêt des runners actifs (.stop()) manquant dans index.ts',
    });
  }

  return {
    compositionRootWiringViolationCount,
    gracefulShutdownOrchestrationViolationCount,
    violationsByCheck: {
      compositionRootWiring,
      gracefulShutdown,
    },
  };
}

describe('CASE-ARCH-04-2 — Composition Root index.ts et signaux OS (SPEC-ARCH-04)', () => {
  it('test_CASE_ARCH_04_2_index_composition_root_and_os_signals', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeIndexCompositionRoot(srcRoot);

    // Alors il résout "workspacePath", instancie les services et enregistre les contrôleurs
    expect(
      analysis.compositionRootWiringViolationCount,
      formatViolationsMessage(
        'Câblage de la Composition Root index.ts',
        analysis.violationsByCheck.compositionRootWiring,
      ),
    ).toBe(0);

    // Et lors de la réception de "SIGINT" ou "SIGTERM", il ferme le serveur HTTP et arrête les runners actifs
    expect(
      analysis.gracefulShutdownOrchestrationViolationCount,
      formatViolationsMessage(
        'Arrêt gracieux SIGINT/SIGTERM dans index.ts',
        analysis.violationsByCheck.gracefulShutdown,
      ),
    ).toBe(0);
  });
});
