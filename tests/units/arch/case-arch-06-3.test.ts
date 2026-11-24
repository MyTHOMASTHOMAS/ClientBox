/**
 * CASE-ARCH-06-3 — Bannissement strict de `any` (`no-explicit-any`)
 * au profit d'`unknown` avec rétrécissement de type (*type guard*)
 * (`AC-ARCH-06-3` / `SPEC-ARCH-06`).
 *
 * Périmètre Données : l'ensemble de `src/` (163 modules) — y compris `types/`.
 * Règle : scan structurel déterministe des `AnyKeyword` (équivalent AST)
 * et des valeurs dynamiques sans couple `unknown` + type guard.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_rule_and_unknown_guards` ; la fiche CASE fait foi
 * (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Résultat d'audit bannissement `any` / usage `unknown` + guards. */
interface NoExplicitAnyComplianceAnalysis {
  /**
   * Occurrences de `any` explicite en position de type
   * (clause Alors / table Données).
   */
  readonly explicitAnyOccurrenceCount: number;
  /**
   * Valeurs dynamiques non typées hors couple `unknown` + type guard
   * (clause Et).
   */
  readonly untypedValueWithoutUnknownGuardCount: number;
}

/**
 * `any` en position de type (annotation, cast, générique, union/intersection).
 * Évite le mot « any » hors contexte de type (identifiants composés exclus
 * via frontières).
 */
const EXPLICIT_ANY_TYPE_RE =
  /(?::|\bas)\s*any\b|(?:<|,)\s*any\s*(?:,|>)|(?:\||&)\s*any\b|\bany\s*(?:\||&|\[\s*\])|\b(?:Promise|Array|ReadonlyArray|Partial|Required|Readonly)\s*<\s*any\b|\bRecord\s*<\s*[^>]*\bany\b/gu;

/**
 * `JSON.parse(...)` immédiatement casté vers autre chose que `unknown`
 * (contourne unknown + guard).
 */
const JSON_PARSE_UNSAFE_CAST_RE = /JSON\.parse\s*\(\s*[^)]*\)\s*as\s+(?!unknown\b)/gu;

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

/**
 * Retire commentaires et littéraux de chaîne / template pour un scan
 * structurel déterministe (POINT-065 — pas de dépendance `typescript`).
 */
function stripCommentsAndStrings(source: string): string {
  const output: string[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && source[index + 1] === '*') {
      index += 2;
      while (index + 1 < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        if (quote === '`' && source[index] === '$' && source[index + 1] === '{') {
          index += 2;
          let depth = 1;
          while (index < source.length && depth > 0) {
            if (source[index] === '{') {
              depth += 1;
            } else if (source[index] === '}') {
              depth -= 1;
            }
            index += 1;
          }
          continue;
        }
        index += 1;
      }
      continue;
    }

    output.push(char ?? '');
    index += 1;
  }

  return output.join('');
}

function countMatches(pattern: RegExp, text: string): number {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const global = new RegExp(pattern.source, flags);
  let count = 0;
  while (global.exec(text) !== null) {
    count += 1;
  }
  return count;
}

function countExplicitAnyOccurrences(code: string): number {
  return countMatches(EXPLICIT_ANY_TYPE_RE, code);
}

/**
 * `catch` non conforme : binding sans type, ou type ≠ `unknown`.
 * (Parsing du contenu des parenthèses — évite le faux positif
 * backtracking `\s*(?!unknown)`.)
 */
function countNonCompliantCatchBindings(code: string): number {
  const catchClauseRe = /\bcatch\s*\(([^)]*)\)/gu;
  let violations = 0;
  let match: RegExpExecArray | null = catchClauseRe.exec(code);
  while (match !== null) {
    const inner = (match[1] ?? '').trim();
    if (/^[A-Za-z_$][\w$]*$/u.test(inner)) {
      violations += 1;
    } else if (/^[A-Za-z_$][\w$]*\s*:\s*unknown\s*$/u.test(inner)) {
      // conforme — unknown obligatoire
    } else if (/^[A-Za-z_$][\w$]*\s*:/u.test(inner)) {
      violations += 1;
    }
    match = catchClauseRe.exec(code);
  }
  return violations;
}

/**
 * Valeurs dynamiques hors couple unknown + type guard :
 * - `catch` non annoté ou annoté autrement que `unknown` ;
 * - `JSON.parse(...) as T` (T ≠ unknown) sans passage par `unknown`.
 */
function countUntypedWithoutUnknownGuard(code: string): number {
  return countNonCompliantCatchBindings(code) + countMatches(JSON_PARSE_UNSAFE_CAST_RE, code);
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface NoExplicitAnyComplianceAnalysis {
  readonly explicitAnyOccurrenceCount: number;
  readonly untypedValueWithoutUnknownGuardCount: number;
  readonly anyViolations: readonly ArchitectureViolation[];
  readonly untypedViolations: readonly ArchitectureViolation[];
}

function getLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function collectNoExplicitAnyViolations(
  filePath: string,
  source: string,
): {
  anyViolations: ArchitectureViolation[];
  untypedViolations: ArchitectureViolation[];
} {
  const anyViolations: ArchitectureViolation[] = [];
  const untypedViolations: ArchitectureViolation[] = [];
  const code = stripCommentsAndStrings(source);

  // Détection des "any"
  const anyRe = /\bany\b/gu;
  let match: RegExpExecArray | null = anyRe.exec(code);
  while (match !== null) {
    const line = getLineNumber(source, match.index);
    anyViolations.push({
      file: filePath,
      line,
      message:
        'Utilisation interdite du type "any" (utiliser "unknown" avec validation par type guard)',
    });
    match = anyRe.exec(code);
  }

  // Détection des catch non annotés unknown
  const catchClauseRe = /catch\s*\(([^)]+)\)/gu;
  let catchMatch: RegExpExecArray | null = catchClauseRe.exec(code);
  while (catchMatch !== null) {
    const inner = (catchMatch[1] ?? '').trim();
    if (!/^[A-Za-z_$][\w$]*\s*:\s*unknown\s*$/u.test(inner)) {
      const line = getLineNumber(source, catchMatch.index);
      untypedViolations.push({
        file: filePath,
        line,
        symbol: `catch (${inner})`,
        message: 'Clause catch non typée "unknown" (obligation: catch (err: unknown))',
      });
    }
    catchMatch = catchClauseRe.exec(code);
  }

  // Détection JSON.parse unsafe cast
  const jsonCastRe = /JSON\.parse\s*\([^)]*\)\s+as\s+(?:(?!\bunknown\b)[A-Za-z_$][\w$<>[\],\s]*)/gu;
  let jsonMatch: RegExpExecArray | null = jsonCastRe.exec(code);
  while (jsonMatch !== null) {
    const line = getLineNumber(source, jsonMatch.index);
    untypedViolations.push({
      file: filePath,
      line,
      symbol: 'JSON.parse as T',
      message: 'JSON.parse casté directement vers un type sans passage par unknown et type guard',
    });
    jsonMatch = jsonCastRe.exec(code);
  }

  return { anyViolations, untypedViolations };
}

function analyzeNoExplicitAnyCompliance(srcRoot: string): NoExplicitAnyComplianceAnalysis {
  const anyViolations: ArchitectureViolation[] = [];
  const untypedViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const relativePath = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const source = fs.readFileSync(absolute, 'utf8');
    const res = collectNoExplicitAnyViolations(`src/${relativePath}`, source);
    anyViolations.push(...res.anyViolations);
    untypedViolations.push(...res.untypedViolations);
  }

  return {
    explicitAnyOccurrenceCount: anyViolations.length,
    untypedValueWithoutUnknownGuardCount: untypedViolations.length,
    anyViolations,
    untypedViolations,
  };
}

describe('CASE-ARCH-06-3 — bannissement any / unknown + type guard (SPEC-ARCH-06)', () => {
  it('test_CASE_ARCH_06_3_no_explicit_any_compliance', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeNoExplicitAnyCompliance(srcRoot);
    const anyMsg = formatViolationsMessage(
      'Occurrences interdites de "any" détectées',
      analysis.anyViolations,
    );
    const untypedMsg = formatViolationsMessage(
      'Valeurs non typées sans "unknown" + type guard',
      analysis.untypedViolations,
    );

    // Alors aucune occurrence de "any" n'est détectée
    expect(analysis.explicitAnyOccurrenceCount, anyMsg).toBe(0);

    // Et toutes les valeurs non typées utilisent "unknown" avec validation
    // par type guard
    expect(analysis.untypedValueWithoutUnknownGuardCount, untypedMsg).toBe(0);
  });
});
