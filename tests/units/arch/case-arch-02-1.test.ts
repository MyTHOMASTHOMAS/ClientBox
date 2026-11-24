/**
 * CASE-ARCH-02-1 — Absence totale d'I/O et de modules système dans src/domain/
 * (`AC-ARCH-02-1` / `SPEC-ARCH-02` / `DOM-001..009`).
 *
 * Sujet sous test : fichiers TypeScript sous src/domain/.
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi.
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
 * Modules système Node bannis (Données CASE / Gherkin) —
 * équivalence stricte node:X ≡ X.
 */
const FORBIDDEN_SYSTEM_MODULES: ReadonlySet<string> = new Set([
  'fs',
  'child_process',
  'net',
  'http',
  'os',
  'path',
  'url',
  'vm',
]);

/** Résultat d'audit zéro-I/O de src/domain/. */
interface DomainZeroIoAnalysis {
  /** Imports de modules système Node.js interdits. */
  readonly systemImportCount: number;
  /** Accès process.env / process.cwd() / fetch / WebSocket. */
  readonly processOrNetworkAccessCount: number;
  /** Violations détaillées pour le rapport d'audit. */
  readonly violationsByCheck: {
    readonly systemImports: readonly ArchitectureViolation[];
    readonly processOrNetworkAccess: readonly ArchitectureViolation[];
  };
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

const EXPORT_FROM_SPECIFIER_RE =
  /^\s*export\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]\s*;?\s*$/gm;

const PROCESS_ENV_RE = /\bprocess\.env\b/gu;
const PROCESS_CWD_RE = /\bprocess\.cwd\s*\(/gu;
const FETCH_RE = /\bfetch\b/gu;
const WEB_SOCKET_RE = /\bWebSocket\b/gu;

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

function normalizeNodeModuleId(specifier: string): string {
  return specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;
}

function isForbiddenSystemModule(specifier: string): boolean {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return false;
  }
  const normalized = normalizeNodeModuleId(specifier);
  const rootId = normalized.split('/')[0] ?? normalized;
  return FORBIDDEN_SYSTEM_MODULES.has(rootId);
}

function countMatches(sourceText: string, pattern: RegExp): number {
  return [...sourceText.matchAll(pattern)].length;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeDomainZeroIo(domainRoot: string): DomainZeroIoAnalysis {
  const srcRoot = path.resolve(domainRoot, '..');
  const files = listTypeScriptFiles(domainRoot);

  let systemImportCount = 0;
  let processOrNetworkAccessCount = 0;

  const systemImports: ArchitectureViolation[] = [];
  const processOrNetworkAccess: ArchitectureViolation[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(srcRoot, file);

    const checkSpecifiers = (pattern: RegExp) => {
      for (const match of raw.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier === undefined) continue;
        const offset = match.index ?? 0;
        const line = lineAtOffset(raw, offset);

        if (isForbiddenSystemModule(specifier)) {
          systemImportCount += 1;
          systemImports.push({
            file: relFile,
            line,
            message: `Import interdit du module système Node.js (${specifier}) dans le domain pur`,
          });
        }
      }
    };

    checkSpecifiers(IMPORT_SPECIFIER_RE);
    checkSpecifiers(EXPORT_FROM_SPECIFIER_RE);

    const checkAccessPatterns: Array<{ regex: RegExp; label: string }> = [
      { regex: PROCESS_ENV_RE, label: 'process.env' },
      { regex: PROCESS_CWD_RE, label: 'process.cwd()' },
      { regex: FETCH_RE, label: 'fetch' },
      { regex: WEB_SOCKET_RE, label: 'WebSocket' },
    ];

    for (const { regex, label } of checkAccessPatterns) {
      for (const match of raw.matchAll(regex)) {
        const offset = match.index ?? 0;
        const line = lineAtOffset(raw, offset);
        processOrNetworkAccessCount += 1;
        processOrNetworkAccess.push({
          file: relFile,
          line,
          symbol: label,
          message: `Accès système/réseau interdit (${label}) dans le domain pur`,
        });
      }
    }
  }

  return {
    systemImportCount,
    processOrNetworkAccessCount,
    violationsByCheck: {
      systemImports,
      processOrNetworkAccess,
    },
  };
}

describe('CASE-ARCH-02-1 — zéro I/O et modules système dans src/domain/ (SPEC-ARCH-02)', () => {
  it('test_CASE_ARCH_02_1_domain_zero_io_and_system_modules', () => {
    const domainRoot = resolveDomainRoot();
    if (!fs.existsSync(domainRoot)) {
      throw new Error(`Répertoire domain introuvable : ${domainRoot}`);
    }

    const analysis = analyzeDomainZeroIo(domainRoot);

    // Alors aucun module système Node.js n'est importé
    expect(
      analysis.systemImportCount,
      formatViolationsMessage(
        'Imports de modules système Node.js dans domain/',
        analysis.violationsByCheck.systemImports,
      ),
    ).toBe(0);

    // Et aucun accès direct à process.env, process.cwd(), fetch ou WebSocket
    expect(
      analysis.processOrNetworkAccessCount,
      formatViolationsMessage(
        'Accès directs process/réseau dans domain/',
        analysis.violationsByCheck.processOrNetworkAccess,
      ),
    ).toBe(0);
  });
});
