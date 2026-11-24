/**
 * CASE-ARCH-04-4 — Déterminisme du harnais de test (ADR-006 / ADR-007)
 * (`AC-ARCH-04-4` / `SPEC-ARCH-04`).
 *
 * Sujet sous test : `tests/helpers/` (Données) + usages sous `tests/**`.
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70).
 *
 * Nom de test : contrat fiche CASE (= prompt §1, alignés).
 *
 * Gherkin : 1× Alors + 2× Et → exactement 3 assertions.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Outils de harnais exigés (Données CASE). */
const REQUIRED_HELPER_FILES: readonly string[] = [
  'mock-spawn.ts',
  'flush-promises.ts',
  'temp-dir.ts',
  'test-server.ts',
];

/** Résultat d'audit déterminisme harnais ADR-006. */
interface TestHarnessDeterminismAnalysis {
  /** Sockets / URL hors 127.0.0.1|localhost (clause Alors). */
  readonly externalRemoteSocketCount: number;
  /**
   * Doubles CLI absents, non installés, ou non déterministes
   * (clause Et — processus CLI).
   */
  readonly nondeterministicCliDoubleCount: number;
  /**
   * Absence de `flushPromises` ou écarts de synchronisation async
   * (clause Et — état asynchrone).
   */
  readonly flushPromisesSyncGapCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly externalSockets: readonly ArchitectureViolation[];
    readonly cliDoubles: readonly ArchitectureViolation[];
    readonly flushPromises: readonly ArchitectureViolation[];
  };
}

/** URL concrète hors loopback (ignore interpolations `${…}`). */
const EXTERNAL_URL_RE = /https?:\/\/(?!127\.0\.0\.1\b|localhost\b|\$\{)[a-zA-Z0-9.-]+/giu;
/** `.listen(port, 'host')` avec littéral hors loopback. */
const LISTEN_NON_LOOPBACK_RE =
  /\.listen\s*\(\s*[^,)]+\s*,\s*['"](?!127\.0\.0\.1|localhost)[^'"]+['"]/gu;
const DEFAULT_HOST_LOOPBACK_RE = /DEFAULT_HOST\s*=\s*['"]127\.0\.0\.1['"]/u;
const INSTALL_SPAWN_MOCK_RE = /\binstallSpawnMock\b/gu;
const MATH_RANDOM_RE = /\bMath\.random\s*\(/gu;
const FLUSH_PROMISES_EXPORT_RE = /export\s+async\s+function\s+flushPromises\b/u;
const FLUSH_PROMISES_CALL_RE = /\bflushPromises\s*\(/gu;
const CHILD_PROCESS_IMPORT_RE =
  /from\s+['"]node:child_process['"]|require\s*\(\s*['"]node:child_process['"]\s*\)/gu;
const SPAWN_CALL_RE = /\.spawn\s*\(/gu;

function resolveHelpersRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../helpers');
}

function resolveTestsRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../..');
}

function stripComments(sourceText: string): string {
  const withoutBlock = sourceText.replace(/\/\*[\s\S]*?\*\//gu, '');
  return withoutBlock.replace(/^\s*\/\/.*$/gmu, '');
}

function countMatches(sourceText: string, pattern: RegExp): number {
  return [...sourceText.matchAll(pattern)].length;
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
        if (entry.name === 'node_modules') {
          continue;
        }
        walk(absolute);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        collected.push(path.normalize(absolute));
      }
    }
  }

  walk(rootDir);
  return collected;
}

function readStripped(filePath: string): string {
  return stripComments(fs.readFileSync(filePath, 'utf8'));
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeTestHarnessDeterminism(
  helpersRoot: string,
  testsRoot: string,
): TestHarnessDeterminismAnalysis {
  let externalRemoteSocketCount = 0;
  let nondeterministicCliDoubleCount = 0;
  let flushPromisesSyncGapCount = 0;

  const externalSockets: ArchitectureViolation[] = [];
  const cliDoubles: ArchitectureViolation[] = [];
  const flushPromisesList: ArchitectureViolation[] = [];

  for (const helperName of REQUIRED_HELPER_FILES) {
    const helperFile = `tests/helpers/${helperName}`;
    if (!fs.existsSync(path.join(helpersRoot, helperName))) {
      if (helperName === 'mock-spawn.ts') {
        nondeterministicCliDoubleCount += 1;
        cliDoubles.push({
          file: helperFile,
          message: `Helper requis introuvable : ${helperName}`,
        });
      } else if (helperName === 'flush-promises.ts') {
        flushPromisesSyncGapCount += 1;
        flushPromisesList.push({
          file: helperFile,
          message: `Helper requis introuvable : ${helperName}`,
        });
      } else if (helperName === 'test-server.ts') {
        externalRemoteSocketCount += 1;
        externalSockets.push({
          file: helperFile,
          message: `Helper requis introuvable : ${helperName}`,
        });
      } else {
        flushPromisesSyncGapCount += 1;
        flushPromisesList.push({
          file: helperFile,
          message: `Helper requis introuvable : ${helperName}`,
        });
      }
    }
  }

  const testServerPath = path.join(helpersRoot, 'test-server.ts');
  if (fs.existsSync(testServerPath)) {
    const raw = fs.readFileSync(testServerPath, 'utf8');
    const stripped = stripComments(raw);
    if (!DEFAULT_HOST_LOOPBACK_RE.test(stripped)) {
      externalRemoteSocketCount += 1;
      externalSockets.push({
        file: 'tests/helpers/test-server.ts',
        message: "DEFAULT_HOST n'est pas fixé à 127.0.0.1",
      });
    }
    for (const match of stripped.matchAll(EXTERNAL_URL_RE)) {
      const offset = match.index ?? 0;
      externalRemoteSocketCount += 1;
      externalSockets.push({
        file: 'tests/helpers/test-server.ts',
        line: lineAtOffset(raw, offset),
        message: `URL distante externe détectée : ${match[0]}`,
      });
    }
    for (const match of stripped.matchAll(LISTEN_NON_LOOPBACK_RE)) {
      const offset = match.index ?? 0;
      externalRemoteSocketCount += 1;
      externalSockets.push({
        file: 'tests/helpers/test-server.ts',
        line: lineAtOffset(raw, offset),
        message: `Écoute réseau hors loopback : ${match[0]}`,
      });
    }
  }

  const mockSpawnPath = path.join(helpersRoot, 'mock-spawn.ts');
  if (fs.existsSync(mockSpawnPath)) {
    const raw = fs.readFileSync(mockSpawnPath, 'utf8');
    const stripped = stripComments(raw);
    if (countMatches(stripped, INSTALL_SPAWN_MOCK_RE) === 0) {
      nondeterministicCliDoubleCount += 1;
      cliDoubles.push({
        file: 'tests/helpers/mock-spawn.ts',
        message: 'Fonction installSpawnMock manquante dans mock-spawn.ts',
      });
    }
    for (const match of stripped.matchAll(MATH_RANDOM_RE)) {
      const offset = match.index ?? 0;
      nondeterministicCliDoubleCount += 1;
      cliDoubles.push({
        file: 'tests/helpers/mock-spawn.ts',
        line: lineAtOffset(raw, offset),
        symbol: 'Math.random',
        message: 'Usage non déterministe de Math.random dans le double CLI',
      });
    }
  }

  const flushPath = path.join(helpersRoot, 'flush-promises.ts');
  if (fs.existsSync(flushPath)) {
    const stripped = readStripped(flushPath);
    if (!FLUSH_PROMISES_EXPORT_RE.test(stripped)) {
      flushPromisesSyncGapCount += 1;
      flushPromisesList.push({
        file: 'tests/helpers/flush-promises.ts',
        message: 'Export flushPromises manquant dans flush-promises.ts',
      });
    }
  }

  const selfAbsolute = path.normalize(fileURLToPath(import.meta.url));

  for (const file of listTypeScriptFiles(testsRoot)) {
    if (file === selfAbsolute) {
      continue;
    }
    if (file.startsWith(path.normalize(helpersRoot + path.sep))) {
      continue;
    }

    const raw = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(raw);
    const relFile = path.relative(path.resolve(testsRoot, '..'), file);

    for (const match of stripped.matchAll(EXTERNAL_URL_RE)) {
      const offset = match.index ?? 0;
      externalRemoteSocketCount += 1;
      externalSockets.push({
        file: relFile,
        line: lineAtOffset(raw, offset),
        message: `URL distante externe non autorisée : ${match[0]}`,
      });
    }

    for (const match of stripped.matchAll(LISTEN_NON_LOOPBACK_RE)) {
      const offset = match.index ?? 0;
      externalRemoteSocketCount += 1;
      externalSockets.push({
        file: relFile,
        line: lineAtOffset(raw, offset),
        message: `Écoute réseau non loopback non autorisée : ${match[0]}`,
      });
    }

    const importsChildProcess = countMatches(stripped, CHILD_PROCESS_IMPORT_RE) > 0;
    const callsSpawn = countMatches(stripped, SPAWN_CALL_RE) > 0;
    const usesSpawnMock = countMatches(stripped, INSTALL_SPAWN_MOCK_RE) > 0;

    if (importsChildProcess && callsSpawn && !usesSpawnMock) {
      nondeterministicCliDoubleCount += 1;
      cliDoubles.push({
        file: relFile,
        message: 'Processus enfant lancé sans installer installSpawnMock()',
      });
    }
  }

  return {
    externalRemoteSocketCount,
    nondeterministicCliDoubleCount,
    flushPromisesSyncGapCount,
    violationsByCheck: {
      externalSockets,
      cliDoubles,
      flushPromises: flushPromisesList,
    },
  };
}

describe('CASE-ARCH-04-4 — déterminisme harnais ADR-006 (SPEC-ARCH-04)', () => {
  it('test_CASE_ARCH_04_4_test_harness_determinism_and_isolation', () => {
    const helpersRoot = resolveHelpersRoot();
    const testsRoot = resolveTestsRoot();

    const analysis = analyzeTestHarnessDeterminism(helpersRoot, testsRoot);

    // Alors aucun socket distant n'est ouvert sur le réseau externe
    expect(
      analysis.externalRemoteSocketCount,
      formatViolationsMessage(
        'Sockets distants externes non autorisés',
        analysis.violationsByCheck.externalSockets,
      ),
    ).toBe(0);

    // Et les processus CLI sont interceptés par des doubles de test déterministes
    expect(
      analysis.nondeterministicCliDoubleCount,
      formatViolationsMessage(
        'Doubles CLI non déterministes / absents',
        analysis.violationsByCheck.cliDoubles,
      ),
    ).toBe(0);

    // Et l'état asynchrone est synchronisé via `flushPromises()`
    expect(
      analysis.flushPromisesSyncGapCount,
      formatViolationsMessage(
        "Synchronisation de l'état asynchrone via flushPromises()",
        analysis.violationsByCheck.flushPromises,
      ),
    ).toBe(0);
  });
});
